const express = require("express");
const multer = require("multer");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  listWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  joinWorkspace,
  inviteMember,
  // Team Management endpoints
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
} = require("../controllers/workspaceController");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only CSV, Excel, and PDF files are allowed.",
        ),
      );
    }
  },
});

// @route   GET /api/workspaces
// @desc    Get workspaces for current user
// @access  Private
router.get("/", ensureAuth, listWorkspaces);

// @route   POST /api/workspaces/join-by-code
// @desc    Join a workspace with a short invite code
// @access  Private
router.post("/join-by-code", ensureAuth, joinWorkspaceByCode);

// @route   POST /api/workspaces
// @desc    Create a new workspace
// @access  Private
router.post("/", ensureAuth, createWorkspace);

// @route   GET /api/workspaces/:id
// @desc    Get a single workspace with content
// @access  Private
router.get("/:id", ensureAuth, getWorkspaceById);

// @route   PUT /api/workspaces/:id
// @desc    Update a workspace (admin only)
// @access  Private
router.put("/:id", ensureAuth, updateWorkspace);

// @route   DELETE /api/workspaces/:id
// @desc    Delete a workspace (owner only)
// @access  Private
router.delete("/:id", ensureAuth, deleteWorkspace);

// @route   POST /api/workspaces/:id/join
// @desc    Join a workspace
// @access  Private
router.post("/:id/join", ensureAuth, joinWorkspace);

// @route   POST /api/workspaces/:id/invite
// @desc    Invite a member by email
// @access  Private
router.post("/:id/invite", ensureAuth, inviteMember);

// ===== TEAM MANAGEMENT ROUTES =====
// @route   GET /api/workspaces/:id/members
// @desc    List all members of a workspace
// @access  Private (workspace members)
router.get("/:id/members", ensureAuth, listMembers);

// Analytics (contribution tracking)
router.get("/:id/analytics", ensureAuth, getWorkspaceAnalytics);
router.get("/:id/working-versions", ensureAuth, getWorkingVersions);

// @route   DELETE /api/workspaces/:id/members/:userId
// @desc    Remove a member from workspace (admin only)
// @access  Private (admin)
router.delete("/:id/members/:userId", ensureAuth, removeMember);

// @route   PUT /api/workspaces/:id/members/:userId
// @desc    Update member role (admin only)
// @access  Private (admin)
router.put("/:id/members/:userId", ensureAuth, updateMemberRole);

// @route   GET /api/workspaces/:id/invites
// @desc    Get pending invitations (admin only)
// @access  Private (admin)
router.get("/:id/invites", ensureAuth, getInvites);
router.get("/:id/invitation-code", ensureAuth, getInvitationCode);

// @route   POST /api/workspaces/:id/invites/:token/accept
// @desc    Accept a workspace invitation
// @access  Private (any authenticated user)
router.post("/:id/invites/:token/accept", ensureAuth, acceptInvite);

// @route   DELETE /api/workspaces/:id/invites/:token/decline
// @desc    Decline a workspace invitation
// @access  Private (any authenticated user)
router.delete("/:id/invites/:token/decline", ensureAuth, declineInvite);

// ===== TEAM MANAGEMENT: Token-only invite accept/decline =====
// Used by frontend when opening `/invite/:token` links
router.post("/invites/:token/accept", ensureAuth, acceptInviteByToken);
router.delete("/invites/:token/decline", ensureAuth, declineInviteByToken);

// Notes
router.post("/:id/notes", ensureAuth, createNote);
router.put("/:id/notes/:noteId", ensureAuth, updateNote);
router.delete("/:id/notes/:noteId", ensureAuth, deleteNote);
router.get("/:id/notes/:noteId/revisions", ensureAuth, getNoteRevisions);
router.post(
  "/:id/notes/:noteId/revisions/:revisionId/restore",
  ensureAuth,
  restoreNoteRevision,
);
router.post(
  "/:id/notes/:noteId/revisions/:revisionId/status",
  ensureAuth,
  updateNoteRevisionStatus,
);

// Tasks
router.post("/:id/tasks", ensureAuth, createTask);
router.put("/:id/tasks/:taskId", ensureAuth, updateTask);
router.delete("/:id/tasks/:taskId", ensureAuth, deleteTask);
router.get("/:id/tasks/:taskId/revisions", ensureAuth, getTaskRevisions);
router.post(
  "/:id/tasks/:taskId/revisions/:revisionId/restore",
  ensureAuth,
  restoreTaskRevision,
);
router.post(
  "/:id/tasks/:taskId/revisions/:revisionId/status",
  ensureAuth,
  updateTaskRevisionStatus,
);

// Task Comments
router.post(
  "/:id/tasks/:taskId/comments",
  ensureAuth,
  require("../controllers/workspaceController").addTaskComment,
);
router.put(
  "/:id/tasks/:taskId/comments/:commentId",
  ensureAuth,
  require("../controllers/workspaceController").updateTaskComment,
);
router.delete(
  "/:id/tasks/:taskId/comments/:commentId",
  ensureAuth,
  require("../controllers/workspaceController").deleteTaskComment,
);

// Chat messages
router.post("/:id/messages", ensureAuth, sendMessage);

// Member ping / nudge
router.post("/:id/ping", ensureAuth, pingMember);

// Documents
router.post(
  "/:id/documents",
  ensureAuth,
  upload.single("file"),
  uploadDocument,
);
router.get("/:id/documents", ensureAuth, getDocuments);
router.put("/:id/documents/:documentId", ensureAuth, updateDocument);
router.get(
  "/:id/documents/:documentId/revisions",
  ensureAuth,
  getDocumentRevisions,
);
router.post(
  "/:id/documents/:documentId/revisions/:revisionId/restore",
  ensureAuth,
  restoreDocumentRevision,
);
router.post(
  "/:id/documents/:documentId/revisions/:revisionId/status",
  ensureAuth,
  updateDocumentRevisionStatus,
);
router.get("/:id/documents/:documentId/download", ensureAuth, downloadDocument);
router.delete("/:id/documents/:documentId", ensureAuth, deleteDocument);

// Project files (simple git-like)
router.get("/:id/project-files", ensureAuth, listProjectFiles);
router.post("/:id/project-files", ensureAuth, createProjectFile);
router.put("/:id/project-files/:fileId", ensureAuth, updateProjectFile);
router.delete("/:id/project-files/:fileId", ensureAuth, deleteProjectFile);
router.get(
  "/:id/project-files/:fileId/revisions",
  ensureAuth,
  getProjectFileRevisions,
);
router.post(
  "/:id/project-files/:fileId/revisions/:revisionId/restore",
  ensureAuth,
  restoreProjectFileRevision,
);
router.post(
  "/:id/project-files/:fileId/revisions/:revisionId/status",
  ensureAuth,
  updateProjectFileRevisionStatus,
);

// @route   GET /api/workspaces/:id/activities
// @desc    Get activities for a specific workspace
// @access  Private (workspace members)
router.get("/:id/activities", ensureAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const Workspace = require("../models/Workspace");
    const Activity = require("../models/Activity");

    // Check if workspace exists
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ msg: "Workspace not found" });
    }

    // Check if user is member
    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (!isMember && workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Get activities
    const activities = await Activity.find({ workspace: id })
      .populate("user", "displayName username avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
