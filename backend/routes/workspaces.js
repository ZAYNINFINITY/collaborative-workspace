const express = require("express");
const multer  = require("multer");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  checkWorkspaceLimit,
  checkMemberLimit,
  requirePlan,
  checkFileSizeLimit,
} = require("../middleware/planMiddleware");
const {
  listWorkspaces,
  getMyTasks,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  joinWorkspace,
  inviteMember,
  listMembers,
  removeMember,
  updateMemberRole,
  getWorkspaceAnalytics,
  getWorkingVersions,
  getInvitationCode,
  joinWorkspaceByCode,
  getInvites,
  acceptInvite,
  declineInvite,
  acceptInviteByToken,
  declineInviteByToken,
  revokeInvite,
  resendInvite,
  createNote,
  updateNote,
  deleteNote,
  createTask,
  updateTask,
  deleteTask,
  getTaskRevisions,
  restoreTaskRevision,
  updateTaskRevisionStatus,
  sendMessage,
  uploadDocument,
  getDocuments,
  updateDocument,
  getDocumentRevisions,
  restoreDocumentRevision,
  updateDocumentRevisionStatus,
  downloadDocument,
  deleteDocument,
  getNoteRevisions,
  restoreNoteRevision,
  updateNoteRevisionStatus,
  pingMember,
  listProjectFiles,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getProjectFileRevisions,
  restoreProjectFileRevision,
  updateProjectFileRevisionStatus,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,
} = require("../controllers/workspaceController");

const router = express.Router();

const upload = multer({
  limits: { fileSize: 200 * 1024 * 1024 }, // hard ceiling — plan enforcement handled by checkFileSizeLimit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — no auth required
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/workspaces/invites/:token/preview
 * Returns just enough info so a student sees what they're joining BEFORE login.
 */
router.get("/invites/:token/preview", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ msg: "Token required" });

    const Workspace = require("../models/Workspace");
    const workspace = await Workspace.findOne({ "invites.token": token })
      .populate("owner", "displayName username avatar");

    if (!workspace) return res.status(404).json({ msg: "Invitation not found or expired" });

    const invite = workspace.invites.find((i) => i.token === token);
    if (!invite)   return res.status(404).json({ msg: "Invitation not found" });

    const INVITE_TTL = 14 * 24 * 60 * 60 * 1000;
    if (invite.createdAt && Date.now() - new Date(invite.createdAt) > INVITE_TTL) {
      return res.status(410).json({ msg: "This invitation has expired" });
    }

    return res.json({
      workspaceName:        workspace.name,
      workspaceDescription: workspace.description || "",
      inviterName:  workspace.owner?.displayName || workspace.owner?.username || "A teammate",
      inviterAvatar: workspace.owner?.avatar || null,
      memberCount:  workspace.members.length,
      role:         invite.role || "member",
    });
  } catch (err) {
    console.error("Invite preview error:", err);
    return res.status(500).json({ msg: "Failed to load invitation" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATED
// ─────────────────────────────────────────────────────────────────────────────

router.get("/",             ensureAuth, listWorkspaces);
// Must be registered before "/:id" or Express will treat "my-tasks" as a workspace id.
router.get("/my-tasks",     ensureAuth, getMyTasks);
router.post("/join-by-code", ensureAuth, joinWorkspaceByCode);

// Plan-gated: free users can only have 1 workspace
router.post("/", ensureAuth, checkWorkspaceLimit, createWorkspace);

// Token-based invite accept/decline (from /invite/:token page — CSRF-exempt)
router.post("/invites/:token/accept",  ensureAuth, acceptInviteByToken);
router.delete("/invites/:token/decline", ensureAuth, declineInviteByToken);

// ── Workspace CRUD ───────────────────────────────────────────────────────────
router.get("/:id",    ensureAuth, getWorkspaceById);
router.put("/:id",    ensureAuth, updateWorkspace);
router.delete("/:id", ensureAuth, deleteWorkspace);
router.post("/:id/join", ensureAuth, joinWorkspace);

// Plan-gated: free plan limited to 3 members per workspace
router.post("/:id/invite", ensureAuth, checkMemberLimit, inviteMember);

// ── Members ──────────────────────────────────────────────────────────────────
router.get("/:id/members",          ensureAuth, listMembers);
router.delete("/:id/members/:userId", ensureAuth, removeMember);
router.put("/:id/members/:userId",  ensureAuth, updateMemberRole);

// ── Analytics — pro+ only ────────────────────────────────────────────────────
router.get("/:id/analytics",       ensureAuth, requirePlan("pro"), getWorkspaceAnalytics);
router.get("/:id/working-versions", ensureAuth, getWorkingVersions);

// ── Invites management (workspace admin) ─────────────────────────────────────
router.get("/:id/invites",                          ensureAuth, getInvites);
router.get("/:id/invitation-code",                  ensureAuth, getInvitationCode);
router.post("/:id/invites/:token/accept",           ensureAuth, acceptInvite);
router.delete("/:id/invites/:token/decline",        ensureAuth, declineInvite);
router.delete("/:id/invites/:token",                ensureAuth, revokeInvite);
router.post("/:id/invites/:token/resend",           ensureAuth, resendInvite);

// ── Notes ─────────────────────────────────────────────────────────────────────
router.post("/:id/notes",                                        ensureAuth, createNote);
router.put("/:id/notes/:noteId",                                 ensureAuth, updateNote);
router.delete("/:id/notes/:noteId",                              ensureAuth, deleteNote);
router.get("/:id/notes/:noteId/revisions",                       ensureAuth, getNoteRevisions);
router.post("/:id/notes/:noteId/revisions/:revId/restore",       ensureAuth, restoreNoteRevision);
router.post("/:id/notes/:noteId/revisions/:revId/status",        ensureAuth, updateNoteRevisionStatus);

// ── Tasks ─────────────────────────────────────────────────────────────────────
router.post("/:id/tasks",                                         ensureAuth, createTask);
router.put("/:id/tasks/:taskId",                                  ensureAuth, updateTask);
router.delete("/:id/tasks/:taskId",                               ensureAuth, deleteTask);
router.get("/:id/tasks/:taskId/revisions",                        ensureAuth, getTaskRevisions);
router.post("/:id/tasks/:taskId/revisions/:revId/restore",        ensureAuth, restoreTaskRevision);
router.post("/:id/tasks/:taskId/revisions/:revId/status",         ensureAuth, updateTaskRevisionStatus);
router.post("/:id/tasks/:taskId/comments",                        ensureAuth, addTaskComment);
router.put("/:id/tasks/:taskId/comments/:commentId",              ensureAuth, updateTaskComment);
router.delete("/:id/tasks/:taskId/comments/:commentId",           ensureAuth, deleteTaskComment);

// ── Chat ──────────────────────────────────────────────────────────────────────
router.post("/:id/messages", ensureAuth, sendMessage);

// ── Ping ──────────────────────────────────────────────────────────────────────
router.post("/:id/ping", ensureAuth, pingMember);

// ── Documents — plan-gated file size ─────────────────────────────────────────
router.post("/:id/documents",  ensureAuth, upload.single("file"), checkFileSizeLimit, uploadDocument);
router.get("/:id/documents",   ensureAuth, getDocuments);
router.put("/:id/documents/:documentId",                                ensureAuth, updateDocument);
router.get("/:id/documents/:documentId/revisions",                      ensureAuth, getDocumentRevisions);
router.post("/:id/documents/:documentId/revisions/:revId/restore",      ensureAuth, restoreDocumentRevision);
router.post("/:id/documents/:documentId/revisions/:revId/status",       ensureAuth, updateDocumentRevisionStatus);
router.get("/:id/documents/:documentId/download",                        ensureAuth, downloadDocument);
router.delete("/:id/documents/:documentId",                              ensureAuth, deleteDocument);

// ── Project files ─────────────────────────────────────────────────────────────
router.get("/:id/project-files",                                           ensureAuth, listProjectFiles);
router.post("/:id/project-files",                                          ensureAuth, createProjectFile);
router.put("/:id/project-files/:fileId",                                   ensureAuth, updateProjectFile);
router.delete("/:id/project-files/:fileId",                                ensureAuth, deleteProjectFile);
router.get("/:id/project-files/:fileId/revisions",                         ensureAuth, getProjectFileRevisions);
router.post("/:id/project-files/:fileId/revisions/:revId/restore",         ensureAuth, restoreProjectFileRevision);
router.post("/:id/project-files/:fileId/revisions/:revId/status",          ensureAuth, updateProjectFileRevisionStatus);

// ── Activities ────────────────────────────────────────────────────────────────
router.get("/:id/activities", ensureAuth, async (req, res, next) => {
  try {
    const Workspace = require("../models/Workspace");
    const Activity  = require("../models/Activity");

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

    const isMember =
      workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some((m) => m.user.toString() === req.user._id.toString());

    if (!isMember) return res.status(403).json({ msg: "Access denied" });

    const activities = await Activity.find({ workspace: req.params.id })
      .populate("user",      "displayName username avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
