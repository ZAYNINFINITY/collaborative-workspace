const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      sparse: true,
      unique: true,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
    },
    email: {
      type: String,
      sparse: true, // Allow multiple missing values (not provided)
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Allow undefined/null for OAuth users
          if (!v) return true;
          // Validate email format only if provided
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      select: false, // Don't return by default for security
    },
    avatar: {
      type: String,
    },
    githubUrl: {
      type: String,
    },
    profileUrl: {
      type: String,
    },
    accessToken: {
      type: String,
      select: false, // Don't return by default for security
    },
    refreshToken: {
      type: String,
      select: false, // Don't return by default for security
    },
  },
  {
    timestamps: true,
  },
);

// Create indexes for better query performance
// Note: githubId and googleId have sparse indexes to allow multiple null values
userSchema.index({ createdAt: -1 });
userSchema.index({ username: 1 }, { unique: true });

// Handle duplicate key errors gracefully
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];

    // Allow multiple null values for sparse indexes
    if (
      (field === "email" || field === "githubId" || field === "googleId") &&
      (value === null || value === undefined)
    ) {
      return next(); // Allow multiple null values
    }

    return next(new Error(`${field} "${value}" is already in use`));
  } else {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
