const Activity = require("../models/Activity");

const safePopulateActivity = async (activityId) => {
  try {
    return await Activity.findById(activityId)
      .populate("user", "displayName username avatar")
      .populate("workspace", "name")
      .lean();
  } catch {
    return null;
  }
};

/**
 * Record an activity entry and (if Socket.io is available) broadcast it to
 * `workspace:<id>`.
 *
 * This function is best-effort: callers should not rely on it for correctness.
 */
const recordActivity = async ({
  req,
  workspaceId,
  userId,
  type,
  description,
  details = {},
}) => {
  if (!workspaceId || !type) return null;

  try {
    const actorId = userId || req?.user?._id;
    if (!actorId) return null;

    const created = await Activity.create({
      workspace: workspaceId,
      user: actorId,
      type,
      description: description || "",
      metadata: details || {},
    });

    const activity = await safePopulateActivity(created._id);

    const io = req?.app?.get?.("io");
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("activity:new", {
        workspaceId,
        activity,
      });
    }

    return activity;
  } catch (err) {
    // Never block the main request on activity logging.
    console.error("Activity logging failed:", err?.message || err);
    return null;
  }
};

module.exports = {
  recordActivity,
};

