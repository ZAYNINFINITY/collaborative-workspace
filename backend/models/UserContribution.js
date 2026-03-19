const mongoose = require("mongoose");

const UserContributionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    versionCount: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    filesUploaded: {
      type: Number,
      default: 0,
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

UserContributionSchema.index({ workspace: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("UserContribution", UserContributionSchema);

