const Notification = require("../models/Notification");

exports.listNotifications = async (req, res, next) => {
  try {
    const limitRaw = req.query.limit;
    const limitParsed = limitRaw ? Number(limitRaw) : null;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0
        ? Math.min(limitParsed, 50)
        : 25;

    const unreadOnly =
      String(req.query.unread || "").toLowerCase() === "true";

    const query = { recipient: req.user._id };
    if (unreadOnly) query.readAt = null;

    const notifications = await Notification.find(query)
      .populate("actor", "username displayName avatar")
      .populate("workspace", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return res.json({ msg: "Marked read" });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res.json({ msg: "All notifications marked read" });
  } catch (err) {
    next(err);
  }
};

