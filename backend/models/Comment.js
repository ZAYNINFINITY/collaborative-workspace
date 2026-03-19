const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["task", "file", "doc", "note"],
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

CommentSchema.index({ workspace: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", CommentSchema);

