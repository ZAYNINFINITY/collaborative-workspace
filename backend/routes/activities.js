const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { ensureAuth } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(ensureAuth);

// Get activities for a specific workspace
router.get("", activityController.getActivities);

// Get recent activities across all user's workspaces
router.get("/recent", activityController.getRecentActivities);

module.exports = router;
