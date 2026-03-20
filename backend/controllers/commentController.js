const Workspace = require("../models/Workspace");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");

const getRoleForUser = (workspace, userId) => {
  if (!workspace || !userId) return null;
  if (workspace.owner?.toString?.() === userId.toString()) return "owner";
  const member = (workspace.members || []).find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member?.role || null;
};

const ensureMemberOrThrow = (workspace, userId) => {
  const role = getRoleForUser(workspace, userId);
  if (!role) {
    const error = new Error("You are not a member of this workspace");
    error.status = 403;
    throw error;
  }
  return role;
};

const extractMentions = (text) => {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/@([A-Za-z0-9_]{2,32})/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1)))).slice(0, 10);
};

const notifyMentionedUsers = async ({
  req,
  workspace,
  actorId,
  content,
  link,
  metadata = {},
}) => {
  const mentions = extractMentions(content);
  const mentionAll = content.includes("@all");
  if (!mentions.length && !mentionAll) return;

  const populated = await Workspace.findById(workspace._id)
    .populate("members.user", "username")
    .lean();
  if (!populated) return;

  const members = (populated.members || []).map((m) => m.user).filter(Boolean);
  const mentionSet = new Set(mentions.map((m) => m.toLowerCase()));

  const recipients = members
    .filter((u) => {
      if (!u?._id) return false;
      if (u._id.toString() === actorId.toString()) return false;
      if (mentionAll) return true;
      return mentionSet.has(String(u.username || "").toLowerCase());
    })
    .map((u) => u._id);

  if (!recipients.length) return;

  const created = await Notification.insertMany(
    recipients.map((recipientId) => ({
      workspace: workspace._id,
      recipient: recipientId,
      actor: actorId,
      type: "mention",
      title: "You were mentioned",
      message: content.slice(0, 180),
      link,
      metadata: { ...metadata, mentions },
    })),
  );

  const io = req.app.get("io");
  if (io) {
    for (const recipientId of recipients) {
      io.to(`user:${recipientId}`).emit("notify:new", {
        recipientId: recipientId.toString(),
      });
    }
  }

  return created;
};

exports.listComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityType, entityId } = req.query;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureMemberOrThrow(workspace, req.user._id);

    if (!entityType || !entityId) {
      return res.status(400).json({ msg: "entityType and entityId are required" });
    }

    const comments = await Comment.find({
      workspace: id,
      entityType,
      entityId,
    })
      .populate("user", "username displayName avatar")
      .populate("resolvedBy", "username displayName avatar")
      .sort({ createdAt: 1 })
      .lean();

    return res.json(comments);
  } catch (err) {
    return next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { entityType, entityId, parentId, content } = req.body || {};

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureMemberOrThrow(workspace, req.user._id);

    if (!entityType || !entityId || !content?.trim()) {
      return res.status(400).json({ msg: "entityType, entityId and content are required" });
    }

    const created = await Comment.create({
      workspace: id,
      entityType,
      entityId,
      parentId: parentId || null,
      user: req.user._id,
      content: String(content).trim(),
    });

    const populated = await Comment.findById(created._id)
      .populate("user", "username displayName avatar")
      .lean();

    // Mentions -> notifications
    await notifyMentionedUsers({
      req,
      workspace,
      actorId: req.user._id,
      content: String(content),
      link: `/workspaces/${id}`,
      metadata: { entityType, entityId, commentId: created._id },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${id}`).emit("comment:new", {
        workspaceId: id,
        comment: populated,
      });
    }

    return res.status(201).json(populated);
  } catch (err) {
    return next(err);
  }
};

exports.resolveComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    const role = ensureMemberOrThrow(workspace, req.user._id);

    const comment = await Comment.findOne({ _id: commentId, workspace: id });
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const isAdmin = ["admin", "owner"].includes(role) || workspace.owner.toString() === req.user._id.toString();
    if (!isAdmin && comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    comment.isResolved = true;
    comment.resolvedBy = req.user._id;
    comment.resolvedAt = new Date();
    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate("user", "username displayName avatar")
      .populate("resolvedBy", "username displayName avatar")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${id}`).emit("comment:updated", {
        workspaceId: id,
        comment: populated,
      });
    }

    return res.json(populated);
  } catch (err) {
    return next(err);
  }
};

