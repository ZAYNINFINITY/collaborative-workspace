const express = require("express");
const multer = require("multer");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  listWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  joinWorkspace,
  inviteMember,
  createNote,
  updateNote,
  deleteNote,
  createTask,
  updateTask,
  deleteTask,
  sendMessage,
  uploadDocument,
  getDocuments,
  updateDocument,
  downloadDocument,
  deleteDocument,
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
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV and Excel files are allowed."));
    }
  },
});

// @route   GET /api/workspaces
// @desc    Get workspaces for current user
// @access  Private
router.get("/", ensureAuth, listWorkspaces);

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

// @route   POST /api/workspaces/:id/join
// @desc    Join a workspace
// @access  Private
router.post("/:id/join", ensureAuth, joinWorkspace);

// @route   POST /api/workspaces/:id/invite
// @desc    Invite a member by email
// @access  Private
router.post("/:id/invite", ensureAuth, inviteMember);

// Notes
router.post("/:id/notes", ensureAuth, createNote);
router.put("/:id/notes/:noteId", ensureAuth, updateNote);
router.delete("/:id/notes/:noteId", ensureAuth, deleteNote);

// Tasks
router.post("/:id/tasks", ensureAuth, createTask);
router.put("/:id/tasks/:taskId", ensureAuth, updateTask);
router.delete("/:id/tasks/:taskId", ensureAuth, deleteTask);

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

// Documents
router.post(
  "/:id/documents",
  ensureAuth,
  upload.single("file"),
  uploadDocument,
);
router.get("/:id/documents", ensureAuth, getDocuments);
router.put("/:id/documents/:documentId", ensureAuth, updateDocument);
router.get("/:id/documents/:documentId/download", ensureAuth, downloadDocument);
router.delete("/:id/documents/:documentId", ensureAuth, deleteDocument);

module.exports = router;
