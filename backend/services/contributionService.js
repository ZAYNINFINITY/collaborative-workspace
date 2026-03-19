const Workspace = require("../models/Workspace");
const UserContribution = require("../models/UserContribution");

const ensureWorkspaceMember = async ({ workspaceId, userId }) => {
  if (!workspaceId || !userId) return;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return;

  const hasMember = workspace.members?.some(
    (m) => m.user.toString() === userId.toString(),
  );
  if (!hasMember) {
    workspace.members = workspace.members || [];
    workspace.members.push({
      user: userId,
      role: workspace.owner?.toString() === userId.toString() ? "admin" : "member",
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });
    await workspace.save();
  }
};

const touchMemberActivity = async ({ workspaceId, userId, at = new Date() }) => {
  if (!workspaceId || !userId) return;

  await ensureWorkspaceMember({ workspaceId, userId });

  await Workspace.updateOne(
    { _id: workspaceId, "members.user": userId },
    { $set: { "members.$.lastActiveAt": at } },
  ).catch(() => {});
};

const incrementContribution = async ({
  workspaceId,
  userId,
  inc = {},
  at = new Date(),
}) => {
  if (!workspaceId || !userId) return;

  await ensureWorkspaceMember({ workspaceId, userId });

  const $inc = {};
  if (inc.tasksCompleted) $inc.tasksCompleted = inc.tasksCompleted;
  if (inc.versionCount) $inc.versionCount = inc.versionCount;
  if (inc.messageCount) $inc.messageCount = inc.messageCount;
  if (inc.filesUploaded) $inc.filesUploaded = inc.filesUploaded;

  await Promise.all([
    touchMemberActivity({ workspaceId, userId, at }),
    UserContribution.updateOne(
      { workspace: workspaceId, user: userId },
      {
        $inc,
        $set: { lastCalculatedAt: at },
        $setOnInsert: { workspace: workspaceId, user: userId },
      },
      { upsert: true },
    ).catch(() => {}),
  ]);
};

const computeScore = ({ tasksCompleted, versionCount, messageCount }) => {
  const t = Number(tasksCompleted || 0);
  const v = Number(versionCount || 0);
  const m = Number(messageCount || 0);
  return t * 5 + v * 2 + m * 1;
};

module.exports = {
  touchMemberActivity,
  incrementContribution,
  computeScore,
};

