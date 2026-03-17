const mongoose = require("mongoose");

const DocumentRevisionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    fileData: {
      type: Buffer,
    },
    mimeType: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

DocumentRevisionSchema.index({ workspace: 1, document: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentRevision", DocumentRevisionSchema);

