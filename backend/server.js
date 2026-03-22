const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const cookie = require("cookie");
const User = require("./models/User");
const {
  cleanupRevokedTokens,
  verifyToken,
  isTokenRevoked,
  JWT_COOKIE_NAME,
} = require("./utils/jwt");

require("dotenv").config();

// Default to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Starting server...");

const app = express();

// Required in production behind reverse proxies (Railway/Vercel) so secure
// session cookies are issued correctly.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

// Performance & Security middleware
app.use(compression({ level: 6 })); // Gzip compression for all responses
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(morgan("combined"));

// Cache control headers for static assets
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path === "/") {
    res.set("Cache-Control", "public, max-age=0, must-revalidate");
  } else {
    res.set("Cache-Control", "public, max-age=3600");
  }
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (origin === clientUrl) return true;

  // Allow localhost origins only outside production.
  if (
    process.env.NODE_ENV !== "production" &&
    origin.startsWith("http://localhost:")
  ) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const corsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"), false);
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Global API rate limiting (production/runtime only; skipped in tests).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again in 15 minutes." },
});

if (process.env.NODE_ENV !== "test") {
  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);
}

// Input sanitization middleware (prevent XSS and injection attacks)
const sanitizeInputs = require("./middleware/sanitizationMiddleware");
app.use(sanitizeInputs);

// Passport config
// Warn if OAuth credentials are missing to avoid long token timeouts
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn(
    "Warning: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set. GitHub OAuth token exchange will fail or time out.",
  );
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google OAuth token exchange will fail or time out.",
  );
}
require("./config/passport")(passport);
app.use(passport.initialize());

// CSRF Protection middleware
const {
  csrfTokenProvider,
  csrfProtection,
} = require("./middleware/csrfMiddleware");
app.use(csrfTokenProvider); // Provide CSRF token
app.use(csrfProtection); // Validate CSRF token on state-changing requests

if (process.env.NODE_ENV !== "test") {
  const revokedTokenCleanup = setInterval(cleanupRevokedTokens, 60 * 1000);
  if (typeof revokedTokenCleanup.unref === "function") {
    revokedTokenCleanup.unref();
  }
}

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/workspaces", require("./routes/workspaces"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api", require("./routes/comments"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Create HTTP server and Socket.io instance
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  // Performance optimizations
  transports: ["websocket", "polling"],
  serveClient: false,
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e5,
});

// Best-effort in-memory presence tracker (per server instance).
// For horizontally scaled deployments, move this to Redis.
const presenceByWorkspace = new Map();

const getWorkspacePresence = (workspaceId) => {
  let presence = presenceByWorkspace.get(workspaceId);
  if (!presence) {
    presence = new Map(); // userId -> { count, user }
    presenceByWorkspace.set(workspaceId, presence);
  }
  return presence;
};

const getPresenceSnapshot = (workspaceId) => {
  const presence = presenceByWorkspace.get(workspaceId);
  if (!presence) return { userIds: [], users: [] };
  const users = Array.from(presence.values())
    .map((entry) => entry.user)
    .filter(Boolean);
  const userIds = users.map((u) => u._id);
  return { userIds, users };
};

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const bearer = socket.handshake.headers?.authorization;
    const bearerToken =
      bearer && bearer.startsWith("Bearer ")
        ? bearer.slice("Bearer ".length)
        : null;
    const parsedCookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const cookieToken = parsedCookies[JWT_COOKIE_NAME];
    const token = authToken || bearerToken || cookieToken;

    if (!token || isTokenRevoked(token)) {
      return next(new Error("Unauthorized"));
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select(
      "_id username displayName avatar",
    );
    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.userId = user._id.toString();
    socket.user = {
      _id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar || null,
    };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.data.joinedWorkspaces = new Set();
  socket.join(`user:${socket.userId}`);

  // Validate workspace and user before allowing events
  const getWorkspaceRole = async (workspaceId, userId) => {
    if (!workspaceId || !userId) return false;
    try {
      const Workspace = require("./models/Workspace");
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return null;
      const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString(),
      );
      return member ? member.role : null;
    } catch (err) {
      console.error("Workspace validation error:", err);
      return null;
    }
  };

  socket.on("joinWorkspace", async ({ workspaceId }) => {
    if (!workspaceId) {
      socket.emit("error", { msg: "Workspace ID required" });
      return;
    }

    // Idempotency: if this socket already joined the workspace room,
    // do not increment presence again (prevents online-count drift).
    if (socket.data.joinedWorkspaces?.has(workspaceId)) {
      socket.join(`workspace:${workspaceId}`);
      return;
    }

    try {
      const role = await getWorkspaceRole(workspaceId, socket.userId);
      if (!role) {
        socket.emit("error", { msg: "No access to this workspace" });
        return;
      }

      socket.join(`workspace:${workspaceId}`);
      console.log(`User joined workspace: ${workspaceId}`);

      socket.data.joinedWorkspaces.add(workspaceId);

      const presence = getWorkspacePresence(workspaceId);
      const current = presence.get(socket.userId) || { count: 0, user: socket.user };
      const nextCount = current.count + 1;
      presence.set(socket.userId, { count: nextCount, user: socket.user });

      socket.emit("presence:state", {
        workspaceId,
        ...getPresenceSnapshot(workspaceId),
      });

      // Only broadcast "online" when this is the first active connection for this user.
      if (nextCount === 1) {
        io.to(`workspace:${workspaceId}`).emit("user:joined", {
          workspaceId,
          socketId: socket.id,
          userId: socket.userId,
          user: socket.user,
          timestamp: new Date(),
        });
        io.to(`workspace:${workspaceId}`).emit("member:online", {
          workspaceId,
          userId: socket.userId,
          user: socket.user,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error("Join workspace error:", err);
      socket.emit("error", { msg: "Failed to join workspace" });
    }
  });

  socket.on("leaveWorkspace", ({ workspaceId }) => {
    if (!workspaceId) {
      socket.emit("error", { msg: "Workspace ID required" });
      return;
    }

    // Idempotency: only decrement presence if this socket previously joined.
    if (!socket.data.joinedWorkspaces?.has(workspaceId)) {
      return;
    }

    try {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`User left workspace: ${workspaceId}`);
      socket.data.joinedWorkspaces.delete(workspaceId);

      const presence = presenceByWorkspace.get(workspaceId);
      if (presence) {
        const current = presence.get(socket.userId);
        const nextCount = current ? current.count - 1 : 0;
        if (nextCount <= 0) {
          presence.delete(socket.userId);
          io.to(`workspace:${workspaceId}`).emit("user:left", {
            workspaceId,
            socketId: socket.id,
            userId: socket.userId,
            user: socket.user,
            timestamp: new Date(),
          });
          io.to(`workspace:${workspaceId}`).emit("member:offline", {
            workspaceId,
            userId: socket.userId,
            user: socket.user,
            timestamp: new Date(),
          });
        } else {
          presence.set(socket.userId, { ...current, count: nextCount });
        }

        if (presence.size === 0) {
          presenceByWorkspace.delete(workspaceId);
        }
      }
    } catch (err) {
      console.error("Leave workspace error:", err);
      socket.emit("error", { msg: "Failed to leave workspace" });
    }
  });

  socket.on(
    "document:edit",
    async ({ workspaceId, documentId, cell, value }) => {
      if (!workspaceId || !documentId || !cell) {
        socket.emit("error", {
          msg: "Missing required fields: workspaceId, documentId, cell",
        });
        return;
      }

      try {
        // Validate access
        const role = await getWorkspaceRole(
          workspaceId,
          socket.userId,
        );
        if (!role) {
          socket.emit("error", { msg: "No access to this workspace" });
          return;
        }
        if (!["admin", "member"].includes(role)) {
          socket.emit("error", { msg: "Read-only role cannot edit documents" });
          return;
        }

        socket.to(`workspace:${workspaceId}`).emit("document:cellUpdated", {
          documentId,
          cell,
          value,
          userId: socket.userId,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Document edit error:", err);
        socket.emit("error", { msg: "Failed to update document" });
      }
    },
  );

  socket.on(
    "document:cursor",
    async ({ workspaceId, documentId, cursor, userName }) => {
      if (!workspaceId || !documentId || !cursor) {
        socket.emit("error", {
          msg: "Missing required fields: workspaceId, documentId, cursor",
        });
        return;
      }

      try {
        // Validate access
        const role = await getWorkspaceRole(
          workspaceId,
          socket.userId,
        );
        if (!role) {
          socket.emit("error", { msg: "No access to this workspace" });
          return;
        }

        socket.to(`workspace:${workspaceId}`).emit("document:cursorMoved", {
          documentId,
          cursor,
          userId: socket.userId,
          userName: userName || socket.user?.displayName || socket.user?.username,
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Document cursor error:", err);
        socket.emit("error", { msg: "Failed to update cursor" });
      }
    },
  );

  // Handle real-time messaging via socket
  socket.on("message:send", async ({ workspaceId, message }) => {
    if (!workspaceId || !message) {
      socket.emit("error", {
        msg: "Missing required fields: workspaceId, message",
      });
      return;
    }

    if (!message.content) {
      socket.emit("error", { msg: "Invalid message format" });
      return;
    }

    try {
      // Validate access
      const role = await getWorkspaceRole(
        workspaceId,
        socket.userId,
      );
      if (!role) {
        socket.emit("error", { msg: "No access to this workspace" });
        return;
      }
      if (!["admin", "member"].includes(role)) {
        socket.emit("error", { msg: "Read-only role cannot send messages" });
        return;
      }

      // Broadcast to all clients in workspace room (including sender)
      io.to(`workspace:${workspaceId}`).emit("message:new", {
        ...message,
        sender: socket.user,
        author: socket.user,
        timestamp: message.createdAt || new Date(),
      });
    } catch (err) {
      console.error("Message send error:", err);
      socket.emit("error", { msg: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("user:typing", async ({ workspaceId, userName, isTyping }) => {
    if (!workspaceId) {
      socket.emit("error", { msg: "Missing workspaceId" });
      return;
    }

    try {
      const role = await getWorkspaceRole(workspaceId, socket.userId);
      if (!role) {
        socket.emit("error", { msg: "No access to this workspace" });
        return;
      }

      socket.to(`workspace:${workspaceId}`).emit("user:typing", {
        userId: socket.userId,
        userName: userName || socket.user?.displayName || socket.user?.username,
        isTyping,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Typing indicator error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const joined = Array.from(socket.data.joinedWorkspaces || []);
    joined.forEach((workspaceId) => {
      const presence = presenceByWorkspace.get(workspaceId);
      if (!presence) return;
      const current = presence.get(socket.userId);
      const nextCount = current ? current.count - 1 : 0;
      if (nextCount <= 0) {
        presence.delete(socket.userId);
        io.to(`workspace:${workspaceId}`).emit("user:left", {
          workspaceId,
          socketId: socket.id,
          userId: socket.userId,
          user: socket.user,
          timestamp: new Date(),
        });
        io.to(`workspace:${workspaceId}`).emit("member:offline", {
          workspaceId,
          userId: socket.userId,
          user: socket.user,
          timestamp: new Date(),
        });
      } else {
        presence.set(socket.userId, { ...current, count: nextCount });
      }

      if (presence.size === 0) {
        presenceByWorkspace.delete(workspaceId);
      }
    });
  });

  // Error handler
  socket.on("error", (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

// Make io accessible to routes/controllers if needed in Phase 2
app.set("io", io);

// Global 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ msg: "API route not found" });
  }
  return next();
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return;
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];

    // Allow multiple null/undefined emails for OAuth users without email
    if (
      (field === "email" || field === "githubId" || field === "googleId") &&
      (value === null || value === undefined)
    ) {
      console.log(`Allowing multiple ${field} values for OAuth users`);
      // Don't send error for sparse index duplicates with null values
      return;
    }

    return res.status(409).json({
      msg: `${field} "${value}" is already in use. Please try a different ${field}.`,
      code: "DUPLICATE_KEY",
      field,
    });
  }

  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({
      msg: `Validation error: ${messages}`,
      code: "VALIDATION_ERROR",
    });
  }

  // Handle MongoDB cast errors
  if (err.name === "CastError") {
    return res.status(400).json({
      msg: "Invalid ID format",
      code: "INVALID_ID",
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      msg: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      msg: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    msg: err.message || "Server error. Please try again later.",
    code: err.code || "SERVER_ERROR",
  });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;

const getMongoUri = () => {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
};

/**
 * Start the HTTP server and connect to MongoDB.
 * Exported for tests so they can start/stop the server explicitly.
 */
async function startServer(options = {}) {
  const { skipListen = false } = options;
  try {
    console.log("NODE_ENV in startServer:", process.env.NODE_ENV);
    const mongoUri = getMongoUri();
    // Connect to MongoDB if MONGO_URI is set
    if (mongoose.connection.readyState === 0 && mongoUri) {
      await mongoose.connect(mongoUri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      });
      console.log("MongoDB connected");
    } else if (!mongoUri) {
      console.warn("MONGO_URI not set, skipping MongoDB connection");
    }

    // Only call listen in non-serverless runtime
    if (!skipListen && !server.listening) {
      await new Promise((resolve) => {
        server.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
          resolve();
        });
      });
    }

    return server;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);

    // In development, start server even if DB fails for testing
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Starting server without MongoDB connection for development",
      );
      if (!skipListen && !server.listening) {
        await new Promise((resolve) => {
          server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (DB not connected)`);
            resolve();
          });
        });
      }
      return server;
    }

    // In tests, surface the error instead of exiting the process
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }

    throw err;
  }
}

// Automatically start the server only when this file is run directly
if (require.main === module) {
  // eslint-disable-next-line no-floating-promises
  startServer();
}

// Vercel serverless function handler
const vercelHandler = async (req, res) => {
  await startServer({ skipListen: true });
  return app(req, res);
};

module.exports = vercelHandler;
module.exports.app = app;
module.exports.server = server;
module.exports.startServer = startServer;
