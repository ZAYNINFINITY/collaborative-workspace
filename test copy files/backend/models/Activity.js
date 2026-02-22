const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "note_created",
        "file_uploaded",
        "member_joined",
        "member_left",
        "code_edited",
        "document_created",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
activitySchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
