const Activity = require("../models/Activity");
const Workspace = require("../models/Workspace");

// Get activities for a specific workspace
const getActivities = async (req, res) => {
  try {
    const { workspace } = req.query;
    const workspaceId = workspace;
    const userId = req.user._id;

    // Check if user has access to this workspace
    const workspaceDoc = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ owner: userId }, { "members.user": userId }],
    });

    if (!workspaceDoc) {
      return res.status(403).json({ msg: "Access denied to this workspace" });
    }

    // Get activities for this workspace, sorted by newest first
    const activities = await Activity.find({ workspace: workspaceId })
      .populate("user", "displayName username avatar")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 activities

    res.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get recent activities across all user's workspaces
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all workspaces the user has access to
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    }).select("_id");

    const workspaceIds = workspaces.map((w) => w._id);

    // Get recent activities from these workspaces
    const activities = await Activity.find({
      workspace: { $in: workspaceIds },
    })
      .populate("user", "displayName username avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 most recent

    res.json(activities);
  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Helper function to create activity (used by other controllers)
const createActivity = async (
  workspaceId,
  userId,
  type,
  description,
  metadata = {},
) => {
  try {
    const activity = new Activity({
      workspace: workspaceId,
      user: userId,
      type,
      description,
      metadata,
    });

    await activity.save();

    // Emit real-time update via Socket.io
    const io = require("../server").app.get("io");
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("activity:new", {
        activity: await activity.populate(
          "user",
          "displayName username avatar",
        ),
      });
    }

    return activity;
  } catch (err) {
    console.error("Error creating activity:", err);
    // Don't throw error - activity creation shouldn't break main functionality
  }
};

module.exports = {
  getActivities,
  getRecentActivities,
  createActivity,
};
