const Workspace = require("../models/Workspace");
const Note = require("../models/Note");
const Task = require("../models/Task");
const Message = require("../models/Message");
const Document = require("../models/Document");
const Notification = require("../models/Notification");
const DocumentRevision = require("../models/DocumentRevision");
const TaskRevision = require("../models/TaskRevision");
const NoteRevision = require("../models/NoteRevision");
const ProjectFile = require("../models/ProjectFile");
const ProjectFileRevision = require("../models/ProjectFileRevision");
const UserContribution = require("../models/UserContribution");
const emailService = require("../services/emailService");
const { recordActivity } = require("../services/activityService");
const {
  incrementContribution,
  touchMemberActivity,
  computeScore,
} = require("../services/contributionService");
const crypto = require("crypto");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const path = require("path");
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

const generateHumanInviteCode = () => {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    const idx = crypto.randomInt(0, INVITE_CODE_ALPHABET.length);
    code += INVITE_CODE_ALPHABET[idx];
  }
  return code;
};

const createUniqueInviteCode = async () => {
  for (let i = 0; i < 8; i += 1) {
    const candidate = generateHumanInviteCode();
    // Keep codes globally unique across pending invites to avoid ambiguity.
    // eslint-disable-next-line no-await-in-loop
    const exists = await Workspace.exists({ "invites.code": candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new Error("Failed to generate a unique invitation code");
};

const getRoleForUser = (workspace, userId) => {
  if (!workspace || !workspace.members) return null;
  if (workspace.owner?.toString?.() === userId.toString()) return "owner";
  const member = workspace.members.find((m) => {
    const userIdToCompare = m.user._id
      ? m.user._id.toString()
      : m.user.toString();
    return userIdToCompare === userId.toString();
  });
  return member ? member.role : null;
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

const ensureAdminOrThrow = (workspace, userId) => {
  const role = ensureMemberOrThrow(workspace, userId);
  if (!["admin", "owner"].includes(role)) {
    const error = new Error(
      "You do not have permission to perform this action",
    );
    error.status = 403;
    throw error;
  }
  return role;
};

const ensureEditorOrThrow = (workspace, userId) => {
  const role = ensureMemberOrThrow(workspace, userId);
  if (!["admin", "owner", "member"].includes(role)) {
    const error = new Error("You do not have edit permission in this workspace");
    error.status = 403;
    throw error;
  }
  return role;
};

const recordDocumentRevision = async ({ workspaceId, document, userId }) => {
  try {
    if (!workspaceId || !document?._id || !userId) return;
    await DocumentRevision.create({
      workspace: workspaceId,
      document: document._id,
      name: document.name,
      type: document.type,
      data: document.data,
      fileData: document.fileData,
      mimeType: document.mimeType,
      createdBy: userId,
    });
    await incrementContribution({
      workspaceId,
      userId,
      inc: { versionCount: 1 },
    });
  } catch (err) {
    console.error("Document revision save failed:", err?.message || err);
  }
};

const recordTaskRevision = async ({ workspaceId, task, userId }) => {
  try {
    if (!workspaceId || !task?._id || !userId) return;
    await TaskRevision.create({
      workspace: workspaceId,
      task: task._id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      assignee: task.assignee || null,
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
      comments: Array.isArray(task.comments) ? task.comments : [],
      order: task.order || 0,
      createdBy: userId,
    });
    await incrementContribution({
      workspaceId,
      userId,
      inc: { versionCount: 1 },
    });
  } catch (err) {
    console.error("Task revision save failed:", err?.message || err);
  }
};

const recordNoteRevision = async ({ workspaceId, note, userId }) => {
  try {
    if (!workspaceId || !note?._id || !userId) return;
    await NoteRevision.create({
      workspace: workspaceId,
      note: note._id,
      author: note.author,
      title: note.title || "",
      content: note.content || "",
      createdBy: userId,
    });
    await incrementContribution({
      workspaceId,
      userId,
      inc: { versionCount: 1 },
    });
  } catch (err) {
    console.error("Note revision save failed:", err?.message || err);
  }
};

const extractMentions = (text) => {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/@([A-Za-z0-9_]{2,32})/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1)))).slice(0, 10);
};

const notifyUsers = async ({ req, workspaceId, actorId, recipients, type, title, message, link, metadata }) => {
  try {
    const uniqueRecipients = Array.from(new Set((recipients || []).map((r) => r.toString()))).filter(
      (r) => r && r !== actorId.toString(),
    );
    if (uniqueRecipients.length === 0) return;

    const docs = await Notification.insertMany(
      uniqueRecipients.map((recipient) => ({
        workspace: workspaceId,
        recipient,
        actor: actorId,
        type,
        title: title || "",
        message: message || "",
        link: link || "",
        metadata: metadata || {},
      })),
    );

    const io = req?.app?.get?.("io");
    if (io) {
      docs.forEach((doc) => {
        io.to(`user:${doc.recipient.toString()}`).emit("notify:new", {
          notificationId: doc._id,
        });
      });
    }
  } catch (err) {
    console.error("Notification dispatch failed:", err?.message || err);
  }
};

const recordProjectFileRevision = async ({ workspaceId, file, userId }) => {
  try {
    if (!workspaceId || !file?._id || !userId) return;
    await ProjectFileRevision.create({
      workspace: workspaceId,
      file: file._id,
      path: file.path,
      content: file.content,
      language: file.language,
      createdBy: userId,
    });
    await incrementContribution({
      workspaceId,
      userId,
      inc: { versionCount: 1 },
    });
  } catch (err) {
    console.error("Project file revision save failed:", err?.message || err);
  }
};

const normalizeVersionAction = (value) =>
  (value || "").toString().trim().toLowerCase();

const applyDocumentFromRevision = async ({ document, revision, userId }) => {
  document.name = revision.name || document.name;
  document.type = revision.type || document.type;
  document.data = revision.data ?? document.data;
  document.fileData = revision.fileData ?? document.fileData;
  document.mimeType = revision.mimeType ?? document.mimeType;
  document.lastModifiedBy = userId;
  await document.save();
};

const applyTaskFromRevision = async ({ task, revision }) => {
  task.title = revision.title || task.title;
  task.description = revision.description || "";
  task.status = revision.status || task.status;
  task.priority = revision.priority || task.priority;
  task.deadline = revision.deadline || null;
  task.assignee = revision.assignee || null;
  task.attachments = Array.isArray(revision.attachments) ? revision.attachments : [];
  task.comments = Array.isArray(revision.comments) ? revision.comments : [];
  task.order = revision.order ?? task.order;
  await task.save();
};

const applyNoteFromRevision = async ({ note, revision }) => {
  note.title = revision.title || note.title;
  note.content = revision.content || "";
  await note.save();
};

const applyProjectFileFromRevision = async ({ file, revision, userId }) => {
  file.path = revision.path || file.path;
  file.content = revision.content || "";
  file.language = revision.language || "";
  file.lastModifiedBy = userId;
  await file.save();
};

const downgradeOtherWorkingRevisions = async ({ Model, workspaceId, entityField, entityId, keepRevisionId }) => {
  await Model.updateMany(
    {
      workspace: workspaceId,
      [entityField]: entityId,
      versionStatus: "working",
      _id: { $ne: keepRevisionId },
    },
    { $set: { versionStatus: "draft" } },
  );
};

exports.listWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const result = workspaces.map((ws) => {
      const role = getRoleForUser(ws, req.user._id);
      return {
        ...ws,
        currentUserRole: role,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description, repos } = req.body;

    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }

    const workspace = await Workspace.create({
      name,
      description: description || "",
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
      repos:
        repos?.map((r) => ({
          githubId: r.githubId,
          name: r.name,
          fullName: r.fullName,
          htmlUrl: r.htmlUrl,
        })) || [],
    });

    const io = req.app.get("io");
    io.to(`workspace:${workspace._id.toString()}`).emit("workspace:updated", {
      workspaceId: workspace._id,
      workspace,
    });

    await recordActivity({
      req,
      workspaceId: workspace._id,
      type: "workspace_created",
      description: "Workspace created",
      details: { name: workspace.name },
    });

    res.status(201).json(workspace);
  } catch (err) {
    next(err);
  }
};

exports.getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id)
      .populate("members.user", "username displayName avatar email")
      .lean();

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const role = getRoleForUser(workspace, req.user._id);

    if (!role) {
      return res
        .status(403)
        .json({ msg: "You are not a member of this workspace" });
    }

    const notes = await Note.find({ workspace: id })
      .populate("author", "username displayName avatar")
      .sort({ updatedAt: -1 })
      .lean();

    const tasks = await Task.find({ workspace: id })
      .populate("assignee", "username displayName avatar")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const messages = await Message.find({ workspace: id })
      .populate("author", "username displayName avatar")
      .sort({ createdAt: 1 })
      .lean();

    const documents = await Document.find({ workspace: id })
      .populate("createdBy", "username displayName avatar")
      .populate("lastModifiedBy", "username displayName avatar")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      workspace: {
        ...workspace,
        currentUserRole: role,
      },
      notes,
      tasks,
      messages,
      documents,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, repos } = req.body;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureAdminOrThrow(workspace, req.user._id);

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (Array.isArray(repos)) {
      workspace.repos = repos.map((r) => ({
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        htmlUrl: r.htmlUrl,
      }));
    }

    await workspace.save();

    const io = req.app.get("io");
    io.to(`workspace:${workspace._id.toString()}`).emit("workspace:updated", {
      workspaceId: workspace._id,
      workspace,
    });

    res.json(workspace);
  } catch (err) {
    next(err);
  }
};

exports.deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Only owner can delete workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ msg: "Only workspace owner can delete it" });
    }

    console.log(`🗑️ Deleting workspace: ${workspace.name} (ID: ${id})`);

    // Delete all related data
    await Note.deleteMany({ workspace: id });
    await Task.deleteMany({ workspace: id });
    await Message.deleteMany({ workspace: id });
    await Document.deleteMany({ workspace: id });

    // Delete workspace
    await Workspace.findByIdAndDelete(id);

    console.log(`✅ Workspace deleted successfully: ${id}`);

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:deleted", { workspaceId: id });

    res.json({ msg: "Workspace deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.joinWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.body || {};
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const existingRole = getRoleForUser(workspace, req.user._id);
    if (existingRole) {
      return res.json(workspace);
    }

    if (!token) {
      return res
        .status(403)
        .json({ msg: "Invitation token is required to join workspace" });
    }

    const inviteIndex = workspace.invites.findIndex((inv) => inv.token === token);
    if (inviteIndex === -1) {
      return res.status(403).json({ msg: "Invalid or expired invitation token" });
    }

    const invite = workspace.invites[inviteIndex];
    if (invite.email) {
      if (
        !req.user.email ||
        req.user.email.toLowerCase() !== invite.email.toLowerCase()
      ) {
        return res.status(403).json({
          msg: "This invite belongs to a different email address",
        });
      }
    }

    workspace.members.push({
      user: req.user._id,
      role: invite.role || "member",
    });
    workspace.invites.splice(inviteIndex, 1);
    await workspace.save();

    const io = req.app.get("io");
    io.to(`workspace:${workspace._id.toString()}`).emit(
      "workspace:memberJoined",
      {
        workspaceId: workspace._id,
        userId: req.user._id,
      },
    );

    res.json(workspace);
  } catch (err) {
    next(err);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureAdminOrThrow(workspace, req.user._id);

    // Generate unique token for invitation
    const token = crypto.randomBytes(32).toString("hex");

    console.log(
      `📧 Creating invite for ${email} to workspace "${workspace.name}"`,
    );

    workspace.invites.push({
      email: email.toLowerCase().trim(),
      role: role || "member",
      token,
    });

    await workspace.save();
    console.log(`✅ Invite record saved for ${email}`);

    // Send invitation email
    const inviteUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/invite/${token}`;
    let emailDelivered = true;
    try {
      await emailService.sendInviteEmail(email, workspace.name, inviteUrl);
    } catch (emailError) {
      emailDelivered = false;
      console.error(
        `❌ Email delivery failed for ${email}:`,
        emailError.message,
      );
      // Don't fail the request if email fails, just log it
    }

    return res.json({
      msg: emailDelivered
        ? "Invitation sent successfully"
        : "Invite created, but email delivery failed. Share the invite link or code instead.",
      emailDelivered,
      workspaceId: workspace._id,
    });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Join by Invitation Code =====
// Endpoint: POST /api/workspaces/join-by-code
// Body: { code: string }
// Returns: { msg, workspaceId }
// Access: Any authenticated user
exports.joinWorkspaceByCode = async (req, res, next) => {
  try {
    const rawCode = (req.body?.code || "").toString();
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ msg: "Invitation code is required" });
    }

    const workspace = await Workspace.findOne({
      invites: {
        $elemMatch: { code, codeOnly: true },
      },
    });

    if (!workspace) {
      return res.status(404).json({ msg: "Invalid or expired invitation code" });
    }

    const alreadyMember = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (alreadyMember) {
      return res.status(400).json({ msg: "You are already a member of this workspace" });
    }

    const inviteIndex = workspace.invites.findIndex(
      (inv) => inv.codeOnly === true && inv.code === code,
    );
    if (inviteIndex === -1) {
      return res.status(404).json({ msg: "Invalid or expired invitation code" });
    }

    const invite = workspace.invites[inviteIndex];
    workspace.members.push({
      user: req.user._id,
      role: invite.role || "member",
    });
    workspace.invites.splice(inviteIndex, 1);
    await workspace.save();

    const io = req.app.get("io");
    io.to(`workspace:${workspace._id.toString()}`).emit("member:joined", {
      workspaceId: workspace._id,
      userId: req.user._id,
      userDisplayName: req.user.displayName,
      role: invite.role || "member",
    });

    return res.json({
      msg: "Workspace joined successfully",
      workspaceId: workspace._id,
    });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: List Members =====
// Endpoint: GET /api/workspaces/:id/members
// Returns: Array of workspace members with user details and roles
exports.listMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id)
      .populate("members.user", "username displayName email avatar githubUrl")
      .lean();

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Verify requester is a member
    ensureMemberOrThrow(workspace, req.user._id);

    // Include owner info
    const owner = workspace.owner;
    const members = workspace.members.map((m) => ({
      userId: m.user._id,
      username: m.user.username,
      displayName: m.user.displayName,
      email: m.user.email,
      avatar: m.user.avatar,
      githubUrl: m.user.githubUrl,
      role: m.role,
      isOwner: owner.toString() === m.user._id.toString(),
    }));

    res.json(members);
  } catch (err) {
    next(err);
  }
};

// ===== ANALYTICS (Contribution Tracking) =====
// GET /api/workspaces/:id/analytics
// Access: workspace members (owner/admin sees full view)
exports.getWorkspaceAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id)
      .populate("members.user", "username displayName avatar email")
      .populate("owner", "username displayName avatar email")
      .lean();
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

    ensureMemberOrThrow(workspace, req.user._id);

    const now = Date.now();
    const contributions = await UserContribution.find({ workspace: id }).lean();
    const byUser = new Map(
      contributions.map((c) => [c.user.toString(), c]),
    );

    const members = (workspace.members || []).map((m) => {
      const user = m.user;
      const userId = (user?._id || m.user).toString();
      const contribution = byUser.get(userId);
      const lastActiveAt = m.lastActiveAt || m.joinedAt || workspace.updatedAt;
      const hoursSinceActive = lastActiveAt
        ? (now - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60)
        : null;

      let activityStatus = "active";
      if (hoursSinceActive !== null && hoursSinceActive > 24 * 5) {
        activityStatus = "inactive";
      } else if (hoursSinceActive !== null && hoursSinceActive > 48) {
        activityStatus = "low";
      }

      const tasksCompleted = Number(contribution?.tasksCompleted || 0);
      const versionCount = Number(contribution?.versionCount || 0);
      const messageCount = Number(contribution?.messageCount || 0);

      return {
        userId,
        username: user?.username,
        displayName: user?.displayName,
        email: user?.email,
        avatar: user?.avatar,
        role: m.role,
        label: m.label || "",
        isOwner: workspace.owner?._id
          ? workspace.owner._id.toString() === userId
          : workspace.owner?.toString?.() === userId,
        joinedAt: m.joinedAt,
        lastActiveAt,
        activityStatus,
        tasksCompleted,
        versionCount,
        messageCount,
        filesUploaded: Number(contribution?.filesUploaded || 0),
        score: computeScore({ tasksCompleted, versionCount, messageCount }),
      };
    });

    members.sort((a, b) => b.score - a.score);

    // Basic progress info (tasks)
    const [totalTasks, doneTasks] = await Promise.all([
      Task.countDocuments({ workspace: id }),
      Task.countDocuments({ workspace: id, status: "done" }),
    ]);

    return res.json({
      workspaceId: id,
      totalTasks,
      doneTasks,
      progressPercent: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
      members,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/workspaces/:id/working-versions
// Returns the current "working" versions for each entity type.
exports.getWorkingVersions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).lean();
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureMemberOrThrow(workspace, req.user._id);

    const [docVersions, taskVersions, noteVersions, fileVersions] =
      await Promise.all([
        DocumentRevision.find({ workspace: id, versionStatus: "working" })
          .select("-fileData")
          .sort({ approvedAt: -1, createdAt: -1 })
          .lean(),
        TaskRevision.find({ workspace: id, versionStatus: "working" })
          .sort({ approvedAt: -1, createdAt: -1 })
          .lean(),
        NoteRevision.find({ workspace: id, versionStatus: "working" })
          .sort({ approvedAt: -1, createdAt: -1 })
          .lean(),
        ProjectFileRevision.find({ workspace: id, versionStatus: "working" })
          .sort({ approvedAt: -1, createdAt: -1 })
          .lean(),
      ]);

    return res.json({
      workspaceId: id,
      documents: docVersions,
      tasks: taskVersions,
      notes: noteVersions,
      files: fileVersions,
    });
  } catch (err) {
    return next(err);
  }
};

// ===== TEAM MANAGEMENT: Remove Member =====
// Endpoint: DELETE /api/workspaces/:id/members/:userId
// Returns: Success message
// Access: Workspace admin only
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Verify requester is admin
    ensureAdminOrThrow(workspace, req.user._id);

    // Prevent removing workspace owner
    if (workspace.owner.toString() === userId) {
      return res.status(403).json({
        msg: "Cannot remove workspace owner. Transfer ownership first.",
      });
    }

    // Prevent self-removal
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        msg: "Cannot remove yourself from workspace. Use leave instead.",
      });
    }

    // Remove member from workspace
    const initialLength = workspace.members.length;
    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId,
    );

    if (workspace.members.length === initialLength) {
      return res.status(404).json({ msg: "Member not found in workspace" });
    }

    await workspace.save();

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("member:left", {
      workspaceId: id,
      userId,
      msg: "Member removed from workspace",
    });

    res.json({ msg: "Member removed successfully" });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Update Member Role =====
// Endpoint: PUT /api/workspaces/:id/members/:userId
// Body: { role: "admin" | "member" | "viewer" }
// Returns: Updated member info
// Access: Workspace admin only
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "member", "viewer"].includes(role)) {
      return res
        .status(400)
        .json({ msg: 'Role must be "admin", "member", or "viewer"' });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Verify requester is admin
    ensureAdminOrThrow(workspace, req.user._id);

    // Prevent changing owner's role
    if (workspace.owner.toString() === userId) {
      return res
        .status(403)
        .json({ msg: "Cannot change workspace owner role" });
    }

    // Find and update member role
    const member = workspace.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ msg: "Member not found in workspace" });
    }

    const oldRole = member.role;
    member.role = role;
    await workspace.save();

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("member:roleChanged", {
      workspaceId: id,
      userId,
      oldRole,
      newRole: role,
    });

    res.json({
      msg: "Member role updated successfully",
      userId,
      newRole: role,
    });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Get Pending Invites =====
// Endpoint: GET /api/workspaces/:id/invites
// Returns: Array of pending invitations (admin only)
exports.getInvites = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).lean();

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Only admins can view invites
    ensureAdminOrThrow(workspace, req.user._id);

    // Return pending invites with email, role, and creation date
    const invites = workspace.invites
      .filter((invite) => !!invite.email)
      .map((invite) => ({
      email: invite.email,
      role: invite.role,
      createdAt: invite.createdAt,
      token: invite.token, // Include token for decline URL
      }));

    res.json(invites);
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Get/Generate Invitation Code =====
// Endpoint: GET /api/workspaces/:id/invitation-code
// Returns: { code: string }
// Access: Workspace admin only
exports.getInvitationCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureAdminOrThrow(workspace, req.user._id);

    let codeInvite = workspace.invites.find((inv) => inv.codeOnly === true);

    if (!codeInvite) {
      const token = crypto.randomBytes(32).toString("hex");
      const code = await createUniqueInviteCode();
      workspace.invites.push({
        role: "member",
        token,
        code,
        codeOnly: true,
      });
      await workspace.save();
      codeInvite = workspace.invites.find((inv) => inv.codeOnly === true);
    } else if (!codeInvite.code) {
      codeInvite.code = await createUniqueInviteCode();
      await workspace.save();
    }

    return res.json({ code: codeInvite.code });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Accept Invite =====
// Endpoint: POST /api/workspaces/:id/invites/:token/accept
// Returns: Workspace info with updated members
// Access: Any authenticated user (but must match invite email)
exports.acceptInvite = async (req, res, next) => {
  try {
    const { id, token } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Find invite by token
    const inviteIndex = workspace.invites.findIndex(
      (inv) => inv.token === token,
    );
    if (inviteIndex === -1) {
      return res.status(404).json({ msg: "Invite not found or already used" });
    }

    const invite = workspace.invites[inviteIndex];

    // Verify invite email matches user email
    if (
      invite.email &&
      req.user.email &&
      req.user.email.toLowerCase() !== invite.email.toLowerCase()
    ) {
      return res.status(403).json({
        msg: "This invite was sent to a different email address",
      });
    }

    // Check if user is already a member
    const alreadyMember = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ msg: "You are already a member of this workspace" });
    }

    // Add user to workspace with invite role
    workspace.members.push({
      user: req.user._id,
      role: invite.role,
    });

    // Remove the used invite
    workspace.invites.splice(inviteIndex, 1);

    await workspace.save();

    // Emit socket event for real-time update
    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("member:joined", {
      workspaceId: id,
      userId: req.user._id,
      userDisplayName: req.user.displayName,
      role: invite.role,
    });

    res.json({
      msg: "Invite accepted! You are now a member",
      workspaceId: workspace._id,
    });
  } catch (err) {
    next(err);
  }
};

// ===== TEAM MANAGEMENT: Decline Invite =====
// Endpoint: DELETE /api/workspaces/:id/invites/:token/decline
// Returns: Success message
// Access: Any authenticated user
exports.declineInvite = async (req, res, next) => {
  try {
    const { id, token } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Find and remove invite by token
    const inviteIndex = workspace.invites.findIndex(
      (inv) => inv.token === token,
    );
    if (inviteIndex === -1) {
      return res.status(404).json({ msg: "Invite not found or already used" });
    }

    const invite = workspace.invites[inviteIndex];
    if (invite.email) {
      if (
        !req.user.email ||
        req.user.email.toLowerCase() !== invite.email.toLowerCase()
      ) {
        return res.status(403).json({
          msg: "This invite belongs to a different email address",
        });
      }
    } else {
      // Only admins can revoke code-based invites.
      ensureAdminOrThrow(workspace, req.user._id);
    }
    workspace.invites.splice(inviteIndex, 1);

    await workspace.save();

    res.json({ msg: "Invite declined" });
  } catch (err) {
    next(err);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    if (!content) {
      return res.status(400).json({ msg: "Content is required" });
    }

    const note = await Note.create({
      workspace: id,
      author: req.user._id,
      title: title || "",
      content,
    });

    const populated = await note.populate(
      "author",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteCreated", {
      workspaceId: id,
      note: populated,
    });

    await recordNoteRevision({ workspaceId: id, note, userId: req.user._id });

    await recordActivity({
      req,
      workspaceId: id,
      type: "note_created",
      description: "Note created",
      details: { noteId: note._id, title: note.title },
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;
    const { title, content } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const role = ensureEditorOrThrow(workspace, req.user._id);

    const note = await Note.findOne({ _id: noteId, workspace: id });
    if (!note) {
      return res.status(404).json({ msg: "Note not found" });
    }

    if (
      note.author.toString() !== req.user._id.toString() &&
      !["admin", "owner"].includes(role)
    ) {
      return res
        .status(403)
        .json({ msg: "You can only edit your own notes or be an admin" });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();

    const populated = await note.populate(
      "author",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteUpdated", {
      workspaceId: id,
      note: populated,
    });

    await recordNoteRevision({ workspaceId: id, note, userId: req.user._id });

    await recordActivity({
      req,
      workspaceId: id,
      type: "note_updated",
      description: "Note updated",
      details: { noteId: note._id, title: note.title },
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const role = ensureEditorOrThrow(workspace, req.user._id);

    const note = await Note.findOne({ _id: noteId, workspace: id });
    if (!note) {
      return res.status(404).json({ msg: "Note not found" });
    }

    if (
      note.author.toString() !== req.user._id.toString() &&
      !["admin", "owner"].includes(role)
    ) {
      return res
        .status(403)
        .json({ msg: "You can only delete your own notes or be an admin" });
    }

    await recordNoteRevision({ workspaceId: id, note, userId: req.user._id });
    await note.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteDeleted", {
      workspaceId: id,
      noteId,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "note_deleted",
      description: "Note deleted",
      details: { noteId },
    });

    res.json({ msg: "Note deleted" });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, assignee } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    if (!title) {
      return res.status(400).json({ msg: "Title is required" });
    }

    const maxOrderTask = await Task.findOne({ workspace: id }).sort({
      order: -1,
    });
    const nextOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await Task.create({
      workspace: id,
      title,
      description,
      status: status || "todo",
      assignee: assignee || null,
      order: nextOrder,
    });

    const populated = await task.populate(
      "assignee",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskCreated", {
      workspaceId: id,
      task: populated,
    });

    await recordTaskRevision({ workspaceId: id, task, userId: req.user._id });

    await recordActivity({
      req,
      workspaceId: id,
      type: "task_created",
      description: "Task created",
      details: { taskId: task._id, title: task.title },
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const {
      title,
      description,
      status,
      assignee,
      order,
      priority,
      deadline,
      attachments,
    } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const task = await Task.findOne({ _id: taskId, workspace: id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    const previousStatus = task.status;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (order !== undefined) task.order = order;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (attachments !== undefined) task.attachments = attachments || [];

    await task.save();

    if (previousStatus !== "done" && task.status === "done") {
      await incrementContribution({
        workspaceId: id,
        userId: req.user._id,
        inc: { tasksCompleted: 1 },
      });
    }

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatar" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatar" },
    ]);

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskUpdated", {
      workspaceId: id,
      task: populated,
    });

    await recordTaskRevision({ workspaceId: id, task, userId: req.user._id });

    await recordActivity({
      req,
      workspaceId: id,
      type: "task_updated",
      description: "Task updated",
      details: { taskId: task._id, title: task.title },
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.addTaskComment = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const content = req.body.content || req.body.comment;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    if (!content) {
      return res.status(400).json({ msg: "Comment content is required" });
    }

    const task = await Task.findOne({ _id: taskId, workspace: id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    const comment = {
      author: req.user._id,
      content,
      createdAt: new Date(),
    };

    task.comments.push(comment);
    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatar" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatar" },
    ]);

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskUpdated", {
      workspaceId: id,
      task: populated,
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateTaskComment = async (req, res, next) => {
  try {
    const { id, taskId, commentId } = req.params;
    const { content } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const role = ensureEditorOrThrow(workspace, req.user._id);

    const task = await Task.findOne({ _id: taskId, workspace: id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      !["admin", "owner"].includes(role)
    ) {
      return res
        .status(403)
        .json({ msg: "You can only edit your own comments or be an admin" });
    }

    comment.content = content;
    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatar" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatar" },
    ]);

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskUpdated", {
      workspaceId: id,
      task: populated,
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.deleteTaskComment = async (req, res, next) => {
  try {
    const { id, taskId, commentId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    const role = ensureEditorOrThrow(workspace, req.user._id);

    const task = await Task.findOne({ _id: taskId, workspace: id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      !["admin", "owner"].includes(role)
    ) {
      return res
        .status(403)
        .json({ msg: "You can only delete your own comments or be an admin" });
    }

    task.comments.pull(commentId);
    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatar" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatar" },
    ]);

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskUpdated", {
      workspaceId: id,
      task: populated,
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const task = await Task.findOne({ _id: taskId, workspace: id });
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    await recordTaskRevision({ workspaceId: id, task, userId: req.user._id });
    await task.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskDeleted", {
      workspaceId: id,
      taskId,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "task_deleted",
      description: "Task deleted",
      details: { taskId },
    });

    res.json({ msg: "Task deleted" });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    if (!content) {
      return res.status(400).json({ msg: "Content is required" });
    }

    const message = await Message.create({
      workspace: id,
      author: req.user._id,
      content,
    });

    const populated = await message.populate(
      "author",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("message:new", populated);

    await incrementContribution({
      workspaceId: id,
      userId: req.user._id,
      inc: { messageCount: 1 },
    });

    const mentions = extractMentions(content);
    if (mentions.length > 0 || content.includes("@all")) {
      const wsMembers = await Workspace.findById(id)
        .populate("members.user", "username")
        .lean();
      if (wsMembers) {
        const memberUsers = (wsMembers.members || [])
          .map((m) => m.user)
          .filter(Boolean);
        const mentionSet = new Set(mentions.map((m) => m.toLowerCase()));

        const recipients = memberUsers
          .filter((u) => {
            if (!u?._id) return false;
            if (u._id.toString() === req.user._id.toString()) return false;
            if (content.includes("@all")) return true;
            return mentionSet.has(String(u.username || "").toLowerCase());
          })
          .map((u) => u._id);

        await notifyUsers({
          req,
          workspaceId: id,
          actorId: req.user._id,
          recipients,
          type: "mention",
          title: "You were mentioned",
          message: content.slice(0, 180),
          link: `/workspaces/${id}?tab=chat`,
          metadata: { messageId: message._id, mentions },
        });
      }
    }

    await recordActivity({
      req,
      workspaceId: id,
      type: "message_sent",
      description: "Message sent",
      details: { messageId: message._id },
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.pingMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, message } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

    ensureMemberOrThrow(workspace, req.user._id);

    const isTargetMember =
      workspace.owner.toString() === userId ||
      workspace.members.some((m) => m.user.toString() === userId);
    if (!isTargetMember) {
      return res.status(404).json({ msg: "User is not a workspace member" });
    }

    await notifyUsers({
      req,
      workspaceId: id,
      actorId: req.user._id,
      recipients: [userId],
      type: "ping",
      title: "You were pinged",
      message: (message || "Someone pinged you.").slice(0, 180),
      link: `/workspaces/${id}`,
      metadata: { workspaceId: id },
    });

    return res.json({ msg: "Ping sent" });
  } catch (err) {
    return next(err);
  }
};

// Document management functions
exports.uploadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type: requestedType } = req.body;
    const file = req.file;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    if (!file) {
      return res.status(400).json({
        msg: "File is required. Please use multipart/form-data with a file field.",
        details:
          "This endpoint expects file upload via multipart/form-data. For text documents, use a different endpoint.",
      });
    }

    if (!name) {
      return res
        .status(400)
        .json({ msg: "Document name is required in request body" });
    }

    const extensionType = path.extname(file.originalname || "")
      .replace(".", "")
      .toLowerCase();
    const mimeTypeToType = {
      "text/csv": "csv",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/pdf": "pdf",
    };
    const type =
      (requestedType && requestedType.toLowerCase()) ||
      mimeTypeToType[file.mimetype] ||
      extensionType;

    if (!["csv", "xlsx", "xls", "pdf"].includes(type)) {
      return res.status(400).json({
        msg: "Invalid file type. Only CSV, Excel (xlsx/xls), and PDF are supported",
        supported: ["csv", "xlsx", "xls", "pdf"],
        received: type,
      });
    }

    let data = [];
    let fileData;
    let mimeType;

    if (type === "pdf") {
      fileData = file.buffer;
      mimeType = "application/pdf";
    } else if (type === "csv") {
      // Parse CSV file
      const results = [];
      const parser = csv();
      parser.on("data", (row) => results.push(Object.values(row)));
      parser.on("end", () => {
        data = results;
      });
      parser.write(file.buffer);
      parser.end();
    } else {
      // Parse Excel file
      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    }

    const document = await Document.create({
      workspace: id,
      name,
      type,
      data,
      fileData,
      mimeType,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id,
    });

    const populated = await document.populate(
      "createdBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentCreated", {
      workspaceId: id,
      document: populated,
    });

    await recordDocumentRevision({
      workspaceId: id,
      document,
      userId: req.user._id,
    });

    await incrementContribution({
      workspaceId: id,
      userId: req.user._id,
      inc: { filesUploaded: 1 },
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "document_uploaded",
      description: "Document uploaded",
      details: { documentId: document._id, name: document.name, type: document.type },
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const documents = await Document.find({ workspace: id })
      .populate("createdBy", "username displayName avatar")
      .populate("lastModifiedBy", "username displayName avatar")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(documents);
  } catch (err) {
    next(err);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;
    const { data } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const document = await Document.findOne({ _id: documentId, workspace: id });
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    document.data = data;
    document.lastModifiedBy = req.user._id;
    await document.save();

    await recordDocumentRevision({
      workspaceId: id,
      document,
      userId: req.user._id,
    });

    const populated = await document.populate(
      "lastModifiedBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentUpdated", {
      workspaceId: id,
      documentId,
      document: populated,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "document_updated",
      description: "Document updated",
      details: { documentId, name: document.name, type: document.type },
    });

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.getDocumentRevisions = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const exists = await Document.exists({ _id: documentId, workspace: id });
    if (!exists) {
      return res.status(404).json({ msg: "Document not found" });
    }

    const revisions = await DocumentRevision.find({
      workspace: id,
      document: documentId,
    })
      .select("-fileData")
      .populate("createdBy", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return res.json(revisions);
  } catch (err) {
    return next(err);
  }
};

exports.restoreDocumentRevision = async (req, res, next) => {
  try {
    const { id, documentId, revisionId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await DocumentRevision.findOne({
      _id: revisionId,
      workspace: id,
      document: documentId,
    });
    if (!revision) {
      return res.status(404).json({ msg: "Revision not found" });
    }

    const document = await Document.findOne({ _id: documentId, workspace: id });
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    document.name = revision.name;
    document.type = revision.type;
    document.data = revision.data;
    document.fileData = revision.fileData;
    document.mimeType = revision.mimeType;
    document.lastModifiedBy = req.user._id;
    await document.save();

    await recordDocumentRevision({
      workspaceId: id,
      document,
      userId: req.user._id,
    });

    const populated = await document.populate(
      "lastModifiedBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentUpdated", {
      workspaceId: id,
      documentId,
      document: populated,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "document_updated",
      description: "Document restored from history",
      details: { documentId, revisionId, name: document.name, type: document.type },
    });

    return res.json(populated);
  } catch (err) {
    return next(err);
  }
};

// ===== VERSION / APPROVAL WORKFLOW =====
// POST /api/workspaces/:id/documents/:documentId/revisions/:revisionId/status
// Body: { action: "ready" | "approve" | "reject" | "working" | "broken" }
exports.updateDocumentRevisionStatus = async (req, res, next) => {
  try {
    const { id, documentId, revisionId } = req.params;
    const action = normalizeVersionAction(req.body?.action);

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await DocumentRevision.findOne({
      _id: revisionId,
      workspace: id,
      document: documentId,
    });
    if (!revision) return res.status(404).json({ msg: "Version not found" });

    if (action === "ready") {
      revision.versionStatus = "ready";
      revision.reviewStatus = "pending";
      revision.approvedBy = undefined;
      revision.approvedAt = undefined;
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_ready",
        description: "Document version marked as ready",
        details: { entityType: "doc", documentId, revisionId },
      });
      return res.json(revision);
    }

    if (["approve", "working", "reject", "broken"].includes(action)) {
      ensureAdminOrThrow(workspace, req.user._id);
    }

    if (action === "reject" || action === "broken") {
      revision.versionStatus = "broken";
      revision.reviewStatus = "rejected";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_rejected",
        description: "Document version rejected",
        details: { entityType: "doc", documentId, revisionId },
      });
      return res.json(revision);
    }

    if (action === "approve" || action === "working") {
      await downgradeOtherWorkingRevisions({
        Model: DocumentRevision,
        workspaceId: id,
        entityField: "document",
        entityId: documentId,
        keepRevisionId: revisionId,
      });

      revision.versionStatus = "working";
      revision.reviewStatus = "approved";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();

      const document = await Document.findOne({ _id: documentId, workspace: id });
      if (document) {
        await applyDocumentFromRevision({ document, revision, userId: req.user._id });
      }

      await recordActivity({
        req,
        workspaceId: id,
        type: "version_approved",
        description: "Document version approved (working)",
        details: { entityType: "doc", documentId, revisionId },
      });
      return res.json(revision);
    }

    return res.status(400).json({ msg: "Invalid action" });
  } catch (err) {
    return next(err);
  }
};

exports.getTaskRevisions = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const exists = await Task.exists({ _id: taskId, workspace: id });
    if (!exists) return res.status(404).json({ msg: "Task not found" });

    const revisions = await TaskRevision.find({ workspace: id, task: taskId })
      .populate("createdBy", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return res.json(revisions);
  } catch (err) {
    return next(err);
  }
};

exports.restoreTaskRevision = async (req, res, next) => {
  try {
    const { id, taskId, revisionId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await TaskRevision.findOne({
      _id: revisionId,
      workspace: id,
      task: taskId,
    });
    if (!revision) return res.status(404).json({ msg: "Revision not found" });

    let task = await Task.findOne({ _id: taskId, workspace: id });
    const createdNew = !task;
    if (!task) {
      task = await Task.create({
        workspace: id,
        title: revision.title || "Restored task",
        description: revision.description || "",
        status: revision.status || "todo",
        priority: revision.priority || "medium",
        deadline: revision.deadline || null,
        assignee: revision.assignee || null,
        attachments: revision.attachments || [],
        comments: revision.comments || [],
        order: revision.order || 0,
      });
    } else {
      task.title = revision.title || task.title;
      task.description = revision.description || "";
      task.status = revision.status || "todo";
      task.priority = revision.priority || "medium";
      task.deadline = revision.deadline || null;
      task.assignee = revision.assignee || null;
      task.attachments = revision.attachments || [];
      task.comments = revision.comments || [];
      task.order = revision.order || 0;
      await task.save();
    }

    await recordTaskRevision({ workspaceId: id, task, userId: req.user._id });

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatar" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatar" },
    ]);

    const io = req.app.get("io");
    if (createdNew) {
      io.to(`workspace:${id}`).emit("workspace:taskCreated", {
        workspaceId: id,
        task: populated,
      });
    } else {
      io.to(`workspace:${id}`).emit("workspace:taskUpdated", {
        workspaceId: id,
        task: populated,
      });
    }

    await recordActivity({
      req,
      workspaceId: id,
      type: "task_updated",
      description: "Task restored from history",
      details: { taskId: populated._id, revisionId, title: populated.title },
    });

    return res.json(populated);
  } catch (err) {
    return next(err);
  }
};

// POST /api/workspaces/:id/tasks/:taskId/revisions/:revisionId/status
exports.updateTaskRevisionStatus = async (req, res, next) => {
  try {
    const { id, taskId, revisionId } = req.params;
    const action = normalizeVersionAction(req.body?.action);

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await TaskRevision.findOne({
      _id: revisionId,
      workspace: id,
      task: taskId,
    });
    if (!revision) return res.status(404).json({ msg: "Version not found" });

    if (action === "ready") {
      revision.versionStatus = "ready";
      revision.reviewStatus = "pending";
      revision.approvedBy = undefined;
      revision.approvedAt = undefined;
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_ready",
        description: "Task version marked as ready",
        details: { entityType: "task", taskId, revisionId },
      });
      return res.json(revision);
    }

    if (["approve", "working", "reject", "broken"].includes(action)) {
      ensureAdminOrThrow(workspace, req.user._id);
    }

    if (action === "reject" || action === "broken") {
      revision.versionStatus = "broken";
      revision.reviewStatus = "rejected";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_rejected",
        description: "Task version rejected",
        details: { entityType: "task", taskId, revisionId },
      });
      return res.json(revision);
    }

    if (action === "approve" || action === "working") {
      await downgradeOtherWorkingRevisions({
        Model: TaskRevision,
        workspaceId: id,
        entityField: "task",
        entityId: taskId,
        keepRevisionId: revisionId,
      });

      revision.versionStatus = "working";
      revision.reviewStatus = "approved";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();

      const task = await Task.findOne({ _id: taskId, workspace: id });
      if (task) {
        await applyTaskFromRevision({ task, revision });
      }

      await recordActivity({
        req,
        workspaceId: id,
        type: "version_approved",
        description: "Task version approved (working)",
        details: { entityType: "task", taskId, revisionId },
      });
      return res.json(revision);
    }

    return res.status(400).json({ msg: "Invalid action" });
  } catch (err) {
    return next(err);
  }
};

exports.getNoteRevisions = async (req, res, next) => {
  try {
    const { id, noteId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const exists = await Note.exists({ _id: noteId, workspace: id });
    if (!exists) return res.status(404).json({ msg: "Note not found" });

    const revisions = await NoteRevision.find({ workspace: id, note: noteId })
      .populate("createdBy", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return res.json(revisions);
  } catch (err) {
    return next(err);
  }
};

exports.restoreNoteRevision = async (req, res, next) => {
  try {
    const { id, noteId, revisionId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await NoteRevision.findOne({
      _id: revisionId,
      workspace: id,
      note: noteId,
    });
    if (!revision) return res.status(404).json({ msg: "Revision not found" });

    let note = await Note.findOne({ _id: noteId, workspace: id });
    const createdNew = !note;
    if (!note) {
      note = await Note.create({
        workspace: id,
        author: revision.author,
        title: revision.title || "",
        content: revision.content || "",
      });
    } else {
      note.title = revision.title || "";
      note.content = revision.content || "";
      await note.save();
    }

    await recordNoteRevision({ workspaceId: id, note, userId: req.user._id });

    const populated = await note.populate("author", "username displayName avatar");

    const io = req.app.get("io");
    if (createdNew) {
      io.to(`workspace:${id}`).emit("workspace:noteCreated", {
        workspaceId: id,
        note: populated,
      });
    } else {
      io.to(`workspace:${id}`).emit("workspace:noteUpdated", {
        workspaceId: id,
        note: populated,
      });
    }

    await recordActivity({
      req,
      workspaceId: id,
      type: "note_updated",
      description: "Note restored from history",
      details: { noteId: populated._id, revisionId, title: populated.title },
    });

    return res.json(populated);
  } catch (err) {
    return next(err);
  }
};

// POST /api/workspaces/:id/notes/:noteId/revisions/:revisionId/status
exports.updateNoteRevisionStatus = async (req, res, next) => {
  try {
    const { id, noteId, revisionId } = req.params;
    const action = normalizeVersionAction(req.body?.action);

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await NoteRevision.findOne({
      _id: revisionId,
      workspace: id,
      note: noteId,
    });
    if (!revision) return res.status(404).json({ msg: "Version not found" });

    if (action === "ready") {
      revision.versionStatus = "ready";
      revision.reviewStatus = "pending";
      revision.approvedBy = undefined;
      revision.approvedAt = undefined;
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_ready",
        description: "Note version marked as ready",
        details: { entityType: "note", noteId, revisionId },
      });
      return res.json(revision);
    }

    if (["approve", "working", "reject", "broken"].includes(action)) {
      ensureAdminOrThrow(workspace, req.user._id);
    }

    if (action === "reject" || action === "broken") {
      revision.versionStatus = "broken";
      revision.reviewStatus = "rejected";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_rejected",
        description: "Note version rejected",
        details: { entityType: "note", noteId, revisionId },
      });
      return res.json(revision);
    }

    if (action === "approve" || action === "working") {
      await downgradeOtherWorkingRevisions({
        Model: NoteRevision,
        workspaceId: id,
        entityField: "note",
        entityId: noteId,
        keepRevisionId: revisionId,
      });

      revision.versionStatus = "working";
      revision.reviewStatus = "approved";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();

      const note = await Note.findOne({ _id: noteId, workspace: id });
      if (note) {
        await applyNoteFromRevision({ note, revision });
      }

      await recordActivity({
        req,
        workspaceId: id,
        type: "version_approved",
        description: "Note version approved (working)",
        details: { entityType: "note", noteId, revisionId },
      });
      return res.json(revision);
    }

    return res.status(400).json({ msg: "Invalid action" });
  } catch (err) {
    return next(err);
  }
};

// ===== PROJECT FILES (Simple Git-like) =====
exports.listProjectFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureMemberOrThrow(workspace, req.user._id);

    const files = await ProjectFile.find({ workspace: id })
      .populate("lastModifiedBy", "username displayName avatar")
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json(files);
  } catch (err) {
    return next(err);
  }
};

exports.createProjectFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { path: filePath, content, language } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ msg: "File path is required" });
    }

    const normalizedPath = filePath.trim().replace(/^\/+/, "");
    if (!normalizedPath) {
      return res.status(400).json({ msg: "File path is required" });
    }

    const bodyContent = typeof content === "string" ? content : "";
    if (bodyContent.length > 200_000) {
      return res.status(400).json({ msg: "File content too large (max 200KB)" });
    }

    const created = await ProjectFile.create({
      workspace: id,
      path: normalizedPath,
      content: bodyContent,
      language: (language || "").toString(),
      createdBy: req.user._id,
      lastModifiedBy: req.user._id,
    });

    await recordProjectFileRevision({ workspaceId: id, file: created, userId: req.user._id });

    await incrementContribution({
      workspaceId: id,
      userId: req.user._id,
      inc: { filesUploaded: 1 },
    });

    const populated = await created.populate(
      "lastModifiedBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:fileCreated", {
      workspaceId: id,
      file: populated,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "project_file_created",
      description: "Project file created",
      details: { path: created.path, fileId: created._id },
    });

    return res.status(201).json(populated);
  } catch (err) {
    // Duplicate path per workspace
    if (err && err.code === 11000) {
      return res.status(409).json({ msg: "A file with this path already exists" });
    }
    return next(err);
  }
};

exports.updateProjectFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const { content, language, path: filePath } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const file = await ProjectFile.findOne({ _id: fileId, workspace: id });
    if (!file) return res.status(404).json({ msg: "File not found" });

    if (filePath !== undefined) {
      const normalizedPath = String(filePath).trim().replace(/^\/+/, "");
      if (!normalizedPath) return res.status(400).json({ msg: "Invalid file path" });
      file.path = normalizedPath;
    }

    if (content !== undefined) {
      const bodyContent = typeof content === "string" ? content : "";
      if (bodyContent.length > 200_000) {
        return res.status(400).json({ msg: "File content too large (max 200KB)" });
      }
      file.content = bodyContent;
    }

    if (language !== undefined) {
      file.language = String(language || "");
    }

    file.lastModifiedBy = req.user._id;
    await file.save();

    await recordProjectFileRevision({ workspaceId: id, file, userId: req.user._id });

    const populated = await file.populate(
      "lastModifiedBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:fileUpdated", {
      workspaceId: id,
      fileId,
      file: populated,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "project_file_updated",
      description: "Project file updated",
      details: { path: file.path, fileId: file._id },
    });

    return res.json(populated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ msg: "A file with this path already exists" });
    }
    return next(err);
  }
};

exports.deleteProjectFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const file = await ProjectFile.findOne({ _id: fileId, workspace: id });
    if (!file) return res.status(404).json({ msg: "File not found" });

    await recordProjectFileRevision({ workspaceId: id, file, userId: req.user._id });
    await file.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:fileDeleted", {
      workspaceId: id,
      fileId,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "project_file_deleted",
      description: "Project file deleted",
      details: { path: file.path, fileId },
    });

    return res.json({ msg: "File deleted" });
  } catch (err) {
    return next(err);
  }
};

exports.getProjectFileRevisions = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const exists = await ProjectFile.exists({ _id: fileId, workspace: id });
    if (!exists) return res.status(404).json({ msg: "File not found" });

    const revisions = await ProjectFileRevision.find({
      workspace: id,
      file: fileId,
    })
      .populate("createdBy", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    return res.json(revisions);
  } catch (err) {
    return next(err);
  }
};

exports.restoreProjectFileRevision = async (req, res, next) => {
  try {
    const { id, fileId, revisionId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await ProjectFileRevision.findOne({
      _id: revisionId,
      workspace: id,
      file: fileId,
    });
    if (!revision) return res.status(404).json({ msg: "Revision not found" });

    const file = await ProjectFile.findOne({ _id: fileId, workspace: id });
    if (!file) return res.status(404).json({ msg: "File not found" });

    file.path = revision.path || file.path;
    file.content = revision.content || "";
    file.language = revision.language || "";
    file.lastModifiedBy = req.user._id;
    await file.save();

    await recordProjectFileRevision({ workspaceId: id, file, userId: req.user._id });

    const populated = await file.populate(
      "lastModifiedBy",
      "username displayName avatar",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:fileUpdated", {
      workspaceId: id,
      fileId,
      file: populated,
    });

    await recordActivity({
      req,
      workspaceId: id,
      type: "project_file_updated",
      description: "Project file restored from history",
      details: { path: file.path, fileId: file._id, revisionId },
    });

    return res.json(populated);
  } catch (err) {
    return next(err);
  }
};

// POST /api/workspaces/:id/project-files/:fileId/revisions/:revisionId/status
exports.updateProjectFileRevisionStatus = async (req, res, next) => {
  try {
    const { id, fileId, revisionId } = req.params;
    const action = normalizeVersionAction(req.body?.action);

    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });
    ensureEditorOrThrow(workspace, req.user._id);

    const revision = await ProjectFileRevision.findOne({
      _id: revisionId,
      workspace: id,
      file: fileId,
    });
    if (!revision) return res.status(404).json({ msg: "Version not found" });

    if (action === "ready") {
      revision.versionStatus = "ready";
      revision.reviewStatus = "pending";
      revision.approvedBy = undefined;
      revision.approvedAt = undefined;
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_ready",
        description: "File version marked as ready",
        details: { entityType: "file", fileId, revisionId },
      });
      return res.json(revision);
    }

    if (["approve", "working", "reject", "broken"].includes(action)) {
      ensureAdminOrThrow(workspace, req.user._id);
    }

    if (action === "reject" || action === "broken") {
      revision.versionStatus = "broken";
      revision.reviewStatus = "rejected";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();
      await recordActivity({
        req,
        workspaceId: id,
        type: "version_rejected",
        description: "File version rejected",
        details: { entityType: "file", fileId, revisionId },
      });
      return res.json(revision);
    }

    if (action === "approve" || action === "working") {
      await downgradeOtherWorkingRevisions({
        Model: ProjectFileRevision,
        workspaceId: id,
        entityField: "file",
        entityId: fileId,
        keepRevisionId: revisionId,
      });

      revision.versionStatus = "working";
      revision.reviewStatus = "approved";
      revision.approvedBy = req.user._id;
      revision.approvedAt = new Date();
      await revision.save();

      const file = await ProjectFile.findOne({ _id: fileId, workspace: id });
      if (file) {
        await applyProjectFileFromRevision({
          file,
          revision,
          userId: req.user._id,
        });
      }

      await recordActivity({
        req,
        workspaceId: id,
        type: "version_approved",
        description: "File version approved (working)",
        details: { entityType: "file", fileId, revisionId },
      });
      return res.json(revision);
    }

    return res.status(400).json({ msg: "Invalid action" });
  } catch (err) {
    return next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const document = await Document.findOne({ _id: documentId, workspace: id });
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    if (document.type === "pdf") {
      if (!document.fileData) {
        return res.status(404).json({ msg: "PDF content not found" });
      }

      res.setHeader("Content-Type", document.mimeType || "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.name}.pdf"`,
      );
      res.send(document.fileData);
    } else if (document.type === "csv") {
      // Convert to CSV
      const csvContent = document.data.map((row) => row.join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.name}.csv"`,
      );
      res.send(csvContent);
    } else {
      // Convert to Excel
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.aoa_to_sheet(document.data);
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = xlsx.write(workbook, {
        type: "buffer",
        bookType: document.type,
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.name}.${document.type}"`,
      );
      res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    ensureEditorOrThrow(workspace, req.user._id);

    const document = await Document.findOne({ _id: documentId, workspace: id });
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    await document.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentDeleted", {
      workspaceId: id,
      documentId,
    });

    res.json({ msg: "Document deleted" });
  } catch (err) {
    next(err);
  }
};

