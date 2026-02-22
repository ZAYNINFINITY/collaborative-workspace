const express = require("express");
const { ensureAuth } = require("../middleware/authMiddleware");
const { chat } = require("../controllers/aiController");

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", ensureAuth, chat);

module.exports = router;

