const mongoose = require("mongoose");

const ProjectFileRevisionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFile",
      required: true,
    },
    path: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    versionStatus: {
      type: String,
      enum: ["draft", "ready", "working", "broken"],
      default: "draft",
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

ProjectFileRevisionSchema.index({ workspace: 1, file: 1, createdAt: -1 });

module.exports = mongoose.model("ProjectFileRevision", ProjectFileRevisionSchema);
