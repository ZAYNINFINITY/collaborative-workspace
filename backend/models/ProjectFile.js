const mongoose = require("mongoose");

const ProjectFileSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

ProjectFileSchema.index({ workspace: 1, path: 1 }, { unique: true });
ProjectFileSchema.index({ workspace: 1, updatedAt: -1 });

module.exports = mongoose.model("ProjectFile", ProjectFileSchema);

