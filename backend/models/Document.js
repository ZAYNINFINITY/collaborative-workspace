const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["csv", "xlsx", "xls", "pdf"],
      required: true,
    },
    data: {
      type: [[String]], // 2D array for table data
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
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Document", DocumentSchema);
