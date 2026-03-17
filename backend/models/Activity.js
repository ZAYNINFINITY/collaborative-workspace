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
        "workspace_created",
        "workspace_updated",
        "workspace_deleted",
        "task_created",
        "task_updated",
        "task_deleted",
        "note_created",
        "note_updated",
        "note_deleted",
        "file_uploaded",
        "project_file_created",
        "project_file_updated",
        "project_file_deleted",
        "member_joined",
        "member_left",
        "member_invited",
        "member_role_changed",
        "code_edited",
        "document_created",
        "document_uploaded",
        "document_updated",
        "document_deleted",
        "message_sent",
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
