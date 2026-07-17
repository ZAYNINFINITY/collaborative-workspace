const mongoose = require("mongoose");

// ─── Plan limits ──────────────────────────────────────────────────────────────
// Single source of truth for what each plan allows.
// Import this anywhere you need to enforce limits.
const PLAN_LIMITS = {
  free: {
    workspaces:       1,
    membersPerWs:     3,
    fileSizeMb:       5,
    analyticsHistory: 7,    // days
    aiRequests:       10,   // per day
  },
  pro: {
    workspaces:       10,
    membersPerWs:     20,
    fileSizeMb:       50,
    analyticsHistory: 90,
    aiRequests:       200,
  },
  business: {
    workspaces:       Infinity,
    membersPerWs:     Infinity,
    fileSizeMb:       200,
    analyticsHistory: 365,
    aiRequests:       Infinity,
  },
};

const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, sparse: true, unique: true },
    googleId: { type: String, sparse: true, unique: true },

    username: {
      type:      String,
      required:  [true, "Username is required"],
      trim:      true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    displayName: {
      type:     String,
      required: [true, "Display name is required"],
      trim:     true,
    },
    email: {
      type:      String,
      sparse:    true,
      lowercase: true,
      trim:      true,
      validate: {
        validator(v) {
          if (!v) return true;
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please provide a valid email",
      },
    },

    password:     { type: String, select: false },
    avatar:       { type: String },
    githubUrl:    { type: String },
    profileUrl:   { type: String },
    accessToken:  { type: String, select: false },
    refreshToken: { type: String, select: false },

    // ── Plan / subscription fields ─────────────────────────────────────────
    // These are the only fields needed before Stripe is integrated.
    // When you add Stripe: populate stripeCustomerId + stripeSubscriptionId
    // from the webhook and flip `plan` accordingly.
    plan: {
      type:    String,
      enum:    ["free", "pro", "business"],
      default: "free",
    },
    planExpiresAt: {
      type: Date,
      default: null,   // null = no expiry (free plan or lifetime)
    },
    stripeCustomerId:     { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },

    // ── Usage counters (reset monthly by a cron job) ───────────────────────
    usage: {
      aiRequestsToday: { type: Number, default: 0 },
      aiRequestsReset: { type: Date,   default: null },
    },

    // ── Soft-delete / ban ──────────────────────────────────────────────────
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ createdAt: -1 });
userSchema.index({ username: 1 },       { unique: true });
userSchema.index({ plan: 1 });
userSchema.index({ stripeCustomerId: 1 }, { sparse: true });

// ─── Virtual: effective plan limits ───────────────────────────────────────────
userSchema.virtual("limits").get(function () {
  // If a pro/business plan has expired, fall back to free limits
  if (
    this.plan !== "free" &&
    this.planExpiresAt &&
    new Date(this.planExpiresAt) < new Date()
  ) {
    return PLAN_LIMITS.free;
  }
  return PLAN_LIMITS[this.plan] || PLAN_LIMITS.free;
});

// ─── Instance helpers ─────────────────────────────────────────────────────────
userSchema.methods.isPro     = function () { return this.plan === "pro"      && !this._planExpired(); };
userSchema.methods.isBusiness= function () { return this.plan === "business" && !this._planExpired(); };
userSchema.methods.isPaid    = function () { return this.isPro() || this.isBusiness(); };
userSchema.methods._planExpired = function () {
  return this.planExpiresAt && new Date(this.planExpiresAt) < new Date();
};

// ─── Duplicate key error handler ─────────────────────────────────────────────
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    if (
      ["email", "githubId", "googleId"].includes(field) &&
      (value === null || value === undefined)
    ) {
      return next();
    }
    return next(new Error(`${field} "${value}" is already in use`));
  }
  return next(error);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.PLAN_LIMITS = PLAN_LIMITS;
