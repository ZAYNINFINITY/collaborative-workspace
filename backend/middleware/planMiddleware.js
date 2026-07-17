/**
 * planMiddleware.js
 *
 * Middleware to enforce SaaS plan limits on protected routes.
 *
 * Usage examples in routes:
 *
 *   const { requirePlan, checkWorkspaceLimit, checkMemberLimit } = require("../middleware/planMiddleware");
 *
 *   // Block free users from creating more than 1 workspace
 *   router.post("/workspaces", ensureAuth, checkWorkspaceLimit, createWorkspace);
 *
 *   // Block adding members beyond the plan's per-workspace limit
 *   router.post("/workspaces/:id/invite", ensureAuth, checkMemberLimit, inviteMember);
 *
 *   // Require pro or business plan for analytics
 *   router.get("/workspaces/:id/analytics", ensureAuth, requirePlan("pro"), getWorkspaceAnalytics);
 *
 *   // Gate AI features
 *   router.post("/ai/ask", ensureAuth, checkAiLimit, handleAiRequest);
 */

const Workspace = require("../models/Workspace");
const { PLAN_LIMITS } = require("../models/User");

// ─── Helper: get effective limits for a user ─────────────────────────────────
const getLimits = (user) => {
  if (
    user.plan !== "free" &&
    user.planExpiresAt &&
    new Date(user.planExpiresAt) < new Date()
  ) {
    return { ...PLAN_LIMITS.free, _expired: true };
  }
  return PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
};

// ─── requirePlan ─────────────────────────────────────────────────────────────
// Require at least a given plan tier.
// Usage: requirePlan("pro")  or  requirePlan("business")
const requirePlan = (minPlan) => (req, res, next) => {
  const tiers   = { free: 0, pro: 1, business: 2 };
  const userTier = tiers[req.user?.plan] ?? 0;
  const required = tiers[minPlan] ?? 0;

  if (userTier < required) {
    return res.status(403).json({
      msg:      `This feature requires the ${minPlan} plan.`,
      upgrade:  true,
      required: minPlan,
      current:  req.user?.plan || "free",
    });
  }
  return next();
};

// ─── checkWorkspaceLimit ─────────────────────────────────────────────────────
// Prevent workspace creation beyond the plan limit.
const checkWorkspaceLimit = async (req, res, next) => {
  try {
    const limits = getLimits(req.user);

    if (limits.workspaces === Infinity) return next();

    const count = await Workspace.countDocuments({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id },
      ],
    });

    if (count >= limits.workspaces) {
      return res.status(403).json({
        msg:     `Your ${req.user.plan} plan allows up to ${limits.workspaces} workspace${limits.workspaces === 1 ? "" : "s"}. Upgrade to create more.`,
        upgrade: true,
        limit:   limits.workspaces,
        current: count,
      });
    }
    return next();
  } catch (err) {
    console.error("checkWorkspaceLimit error:", err);
    return next(err);
  }
};

// ─── checkMemberLimit ────────────────────────────────────────────────────────
// Prevent adding members beyond the plan's per-workspace limit.
// Expects req.params.id to be the workspace ID.
const checkMemberLimit = async (req, res, next) => {
  try {
    const limits = getLimits(req.user);
    if (limits.membersPerWs === Infinity) return next();

    const workspace = await Workspace.findById(req.params.id).select("members owner");
    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

    // Count owner + current members
    const currentCount = workspace.members.length + 1; // +1 for owner

    if (currentCount >= limits.membersPerWs) {
      return res.status(403).json({
        msg:     `Your ${req.user.plan} plan allows up to ${limits.membersPerWs} members per workspace. Upgrade to add more.`,
        upgrade: true,
        limit:   limits.membersPerWs,
        current: currentCount,
      });
    }
    return next();
  } catch (err) {
    console.error("checkMemberLimit error:", err);
    return next(err);
  }
};

// ─── checkAiLimit ────────────────────────────────────────────────────────────
// Gate AI endpoint usage with daily quota.
// Increments usage.aiRequestsToday; resets at midnight UTC.
const checkAiLimit = async (req, res, next) => {
  try {
    const User   = require("../models/User");
    const limits = getLimits(req.user);

    if (limits.aiRequests === Infinity) return next();

    const user  = await User.findById(req.user._id).select("usage plan");
    if (!user) return res.status(401).json({ msg: "Not authenticated" });

    const now       = new Date();
    const resetDate = user.usage?.aiRequestsReset;
    const sameDay   =
      resetDate &&
      new Date(resetDate).toDateString() === now.toDateString();

    const todayCount = sameDay ? (user.usage.aiRequestsToday || 0) : 0;

    if (todayCount >= limits.aiRequests) {
      return res.status(429).json({
        msg:      `Daily AI limit reached (${limits.aiRequests} requests). Resets at midnight UTC.`,
        upgrade:  req.user.plan !== "business",
        limit:    limits.aiRequests,
        used:     todayCount,
        resetAt:  new Date(new Date().setUTCHours(24, 0, 0, 0)),
      });
    }

    // Increment and continue
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: { "usage.aiRequestsReset": now },
        $inc: { "usage.aiRequestsToday": sameDay ? 1 : 0 },
        ...(sameDay ? {} : { $set: { "usage.aiRequestsToday": 1, "usage.aiRequestsReset": now } }),
      },
    );

    // Simpler atomic update
    if (sameDay) {
      await User.updateOne({ _id: req.user._id }, { $inc: { "usage.aiRequestsToday": 1 } });
    } else {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { "usage.aiRequestsToday": 1, "usage.aiRequestsReset": now } },
      );
    }

    return next();
  } catch (err) {
    console.error("checkAiLimit error:", err);
    return next(err);
  }
};

// ─── checkFileSizeLimit ───────────────────────────────────────────────────────
// Use as an Express middleware AFTER multer parses the file.
// Rejects files larger than the plan's fileSizeMb limit.
const checkFileSizeLimit = (req, res, next) => {
  if (!req.file && !req.files) return next();

  const limits   = getLimits(req.user);
  const maxBytes = limits.fileSizeMb * 1024 * 1024;
  const files    = req.files ? Object.values(req.files).flat() : [req.file];

  for (const f of files) {
    if (f && f.size > maxBytes) {
      return res.status(413).json({
        msg:     `File too large. Your ${req.user.plan} plan allows up to ${limits.fileSizeMb}MB per file.`,
        upgrade: true,
        limit:   limits.fileSizeMb,
      });
    }
  }
  return next();
};

module.exports = {
  requirePlan,
  checkWorkspaceLimit,
  checkMemberLimit,
  checkAiLimit,
  checkFileSizeLimit,
  getLimits,
};
