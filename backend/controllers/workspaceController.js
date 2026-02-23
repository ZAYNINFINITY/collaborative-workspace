const Workspace = require("../models/Workspace");
const Note = require("../models/Note");
const Task = require("../models/Task");
const Message = require("../models/Message");
const Document = require("../models/Document");
const emailService = require("../services/emailService");
const crypto = require("crypto");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const path = require("path");

const getRoleForUser = (workspace, userId) => {
  if (!workspace || !workspace.members) return null;
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
  if (role !== "admin") {
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
  if (!["admin", "member"].includes(role)) {
    const error = new Error("You do not have edit permission in this workspace");
    error.status = 403;
    throw error;
  }
  return role;
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

    res.status(201).json(workspace);
  } catch (err) {
    next(err);
  }
};

exports.getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id)
      .populate("members.user", "username displayName avatarUrl email")
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
      .populate("author", "username displayName avatarUrl")
      .sort({ updatedAt: -1 })
      .lean();

    const tasks = await Task.find({ workspace: id })
      .populate("assignee", "username displayName avatarUrl")
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const messages = await Message.find({ workspace: id })
      .populate("author", "username displayName avatarUrl")
      .sort({ createdAt: 1 })
      .lean();

    const documents = await Document.find({ workspace: id })
      .populate("createdBy", "username displayName avatarUrl")
      .populate("lastModifiedBy", "username displayName avatarUrl")
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
    try {
      await emailService.sendInviteEmail(email, workspace.name, inviteUrl);
    } catch (emailError) {
      console.error(
        `❌ Email delivery failed for ${email}:`,
        emailError.message,
      );
      // Don't fail the request if email fails, just log it
    }

    res.json({
      msg: "Invitation sent successfully",
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
    const invites = workspace.invites.map((invite) => ({
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
      workspace.invites.push({
        role: "member",
        token,
        codeOnly: true,
      });
      await workspace.save();
      codeInvite = workspace.invites.find((inv) => inv.codeOnly === true);
    }

    return res.json({ code: codeInvite.token });
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
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteCreated", {
      workspaceId: id,
      note: populated,
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
      role !== "admin"
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
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteUpdated", {
      workspaceId: id,
      note: populated,
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
      role !== "admin"
    ) {
      return res
        .status(403)
        .json({ msg: "You can only delete your own notes or be an admin" });
    }

    await note.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:noteDeleted", {
      workspaceId: id,
      noteId,
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
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskCreated", {
      workspaceId: id,
      task: populated,
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

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (order !== undefined) task.order = order;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (attachments !== undefined) task.attachments = attachments || [];

    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatarUrl" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatarUrl" },
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
      { path: "assignee", select: "username displayName avatarUrl" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatarUrl" },
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
      role !== "admin"
    ) {
      return res
        .status(403)
        .json({ msg: "You can only edit your own comments or be an admin" });
    }

    comment.content = content;
    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatarUrl" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatarUrl" },
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
      role !== "admin"
    ) {
      return res
        .status(403)
        .json({ msg: "You can only delete your own comments or be an admin" });
    }

    task.comments.pull(commentId);
    await task.save();

    const populated = await task.populate([
      { path: "assignee", select: "username displayName avatarUrl" },
      { path: "attachments", select: "name type" },
      { path: "comments.author", select: "username displayName avatarUrl" },
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

    await task.deleteOne();

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:taskDeleted", {
      workspaceId: id,
      taskId,
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
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("message:new", populated);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
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
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentCreated", {
      workspaceId: id,
      document: populated,
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
      .populate("createdBy", "username displayName avatarUrl")
      .populate("lastModifiedBy", "username displayName avatarUrl")
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

    const populated = await document.populate(
      "lastModifiedBy",
      "username displayName avatarUrl",
    );

    const io = req.app.get("io");
    io.to(`workspace:${id}`).emit("workspace:documentUpdated", {
      workspaceId: id,
      documentId,
      document: populated,
    });

    res.json(populated);
  } catch (err) {
    next(err);
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

