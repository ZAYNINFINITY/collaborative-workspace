const express = require("express");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  listComments,
  createComment,
  resolveComment,
} = require("../controllers/commentController");

const router = express.Router();

// /api/workspaces/:id/comments?entityType=task&entityId=...
router.get("/workspaces/:id/comments", ensureAuth, listComments);
router.post("/workspaces/:id/comments", ensureAuth, createComment);
router.post("/workspaces/:id/comments/:commentId/resolve", ensureAuth, resolveComment);

module.exports = router;

