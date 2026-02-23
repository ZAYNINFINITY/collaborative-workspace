const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "viewer"],
      default: "member",
    },
  },
  { _id: false },
);

const repoSchema = new mongoose.Schema(
  {
    githubId: String,
    name: String,
    fullName: String,
    htmlUrl: String,
  },
  { _id: false },
);

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
    repos: [repoSchema],
    // Team Collaboration: Pending invitations with unique tokens and expiration
    invites: [
      {
        email: String,
        codeOnly: {
          type: Boolean,
          default: false,
        },
        role: {
          type: String,
          enum: ["admin", "member", "viewer"],
          default: "member",
        },
        // Unique token for invite acceptance/rejection
        token: {
          type: String,
          unique: false, // Not globally unique, but unique per workspace
        },
        // Short human-friendly join code for code-based invitations
        code: {
          type: String,
          uppercase: true,
          trim: true,
        },
        // Track when invite was sent for expiration logic (14 days default)
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

WorkspaceSchema.index({ owner: 1, updatedAt: -1 });
WorkspaceSchema.index({ "members.user": 1, updatedAt: -1 });
WorkspaceSchema.index({ "invites.token": 1 });
WorkspaceSchema.index({ "invites.code": 1 });

module.exports = mongoose.model("Workspace", WorkspaceSchema);
