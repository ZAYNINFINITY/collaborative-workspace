const express    = require("express");
const http       = require("http");
const mongoose   = require("mongoose");
const passport   = require("passport");
const cookieParser = require("cookie-parser");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const compression = require("compression");
const rateLimit  = require("express-rate-limit");
const { Server } = require("socket.io");
const cookie     = require("cookie");
const User       = require("./models/User");
const {
  cleanupRevokedTokens,
  verifyToken,
  isTokenRevoked,
  JWT_COOKIE_NAME,
} = require("./utils/jwt");

require("dotenv").config();

process.env.NODE_ENV = process.env.NODE_ENV || "development";
const isProd = process.env.NODE_ENV === "production";

console.log("NODE_ENV:", process.env.NODE_ENV);

const app = express();

// Behind Railway / Vercel reverse proxy — needed for secure cookies
if (isProd) app.set("trust proxy", 1);

// ─── CLIENT URL & CORS ────────────────────────────────────────────────────────
const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");

// Extra allowed origins from env (comma-separated)
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;                             // same-origin / server-to-server
  if (origin === clientUrl) return true;
  if (extraOrigins.includes(origin)) return true;
  // Allow ALL vercel.app subdomains so preview deployments work
  if (isProd && origin.endsWith(".vercel.app")) return true;
  if (!isProd && origin.startsWith("http://localhost:")) return true;
  return false;
};

const corsOrigin = (origin, callback) =>
  isOriginAllowed(origin) ? callback(null, true) : callback(new Error("CORS: Not allowed"));

const corsOpts = { origin: corsOrigin, credentials: true };

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(compression({ level: 6 }));
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(cors(corsOpts));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Rate limiting (skip in tests)
if (process.env.NODE_ENV !== "test") {
  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000, max: 100,
    standardHeaders: true, legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  }));
  app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000, max: 20,   // raised from 10 — avoids locking students out
    standardHeaders: true, legacyHeaders: false,
    message: { error: "Too many auth attempts, try again in 15 minutes." },
  }));
}

app.use(require("./middleware/sanitizationMiddleware"));

// OAuth warnings
if (!process.env.GITHUB_CLIENT_ID)  console.warn("GITHUB OAuth not configured");
if (!process.env.GOOGLE_CLIENT_ID)  console.warn("GOOGLE OAuth not configured");
require("./config/passport")(passport);
app.use(passport.initialize());

// CSRF
const { csrfTokenProvider, csrfProtection } = require("./middleware/csrfMiddleware");
app.use(csrfTokenProvider);
app.use(csrfProtection);

// Token cleanup
if (process.env.NODE_ENV !== "test") {
  const cleanup = setInterval(cleanupRevokedTokens, 60_000);
  if (typeof cleanup.unref === "function") cleanup.unref();
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/workspaces",   require("./routes/workspaces"));
app.use("/api/activities",   require("./routes/activities"));
app.use("/api/ai",           require("./routes/ai"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api",              require("./routes/comments"));

app.get("/",           (_, res) => res.json({ status: "ok", health: "/api/health" }));
app.get("/api/health", (_, res) => res.json({ status: "ok", ts: Date.now() }));

// ─── HTTP SERVER ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
// Transport strategy:
//   - Vercel proxies /socket.io/* to Railway over HTTP.
//   - Vercel CANNOT tunnel a WebSocket upgrade, so the client uses polling only.
//   - The backend must accept polling; websocket stays available for direct
//     connections (dev, future CDN, etc.).
const io = new Server(server, {
  cors: corsOpts,
  transports:         ["polling", "websocket"],   // polling first — Vercel proxy compat
  allowUpgrades:      true,                        // allow WS upgrade on direct connections
  serveClient:        false,
  pingInterval:       25_000,
  pingTimeout:        60_000,
  maxHttpBufferSize:  1e5,                          // 100 KB
  // Cookie-based auth works over polling because cookies are in the HTTP header
  cookie:             false,
});

// ─── SOCKET AUTH MIDDLEWARE ───────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const parsedCookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const cookieToken   = parsedCookies[JWT_COOKIE_NAME];
    const bearer        = socket.handshake.headers?.authorization;
    const bearerToken   = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
    const authToken     = socket.handshake.auth?.token;
    const token         = cookieToken || bearerToken || authToken;

    if (!token || isTokenRevoked(token)) return next(new Error("Unauthorized"));

    const payload = verifyToken(token);
    const user    = await User.findById(payload.userId)
      .select("_id username displayName avatar");
    if (!user) return next(new Error("Unauthorized"));

    socket.userId = user._id.toString();
    socket.user   = {
      _id:         user._id.toString(),
      username:    user.username,
      displayName: user.displayName,
      avatar:      user.avatar || null,
    };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

// ─── PRESENCE ─────────────────────────────────────────────────────────────────
// In-memory — suitable for single instance. Upgrade to Redis adapter for scale.
const presenceByWorkspace = new Map();

const getPresence = (wsId) => {
  if (!presenceByWorkspace.has(wsId)) presenceByWorkspace.set(wsId, new Map());
  return presenceByWorkspace.get(wsId);
};

const presenceSnapshot = (wsId) => {
  const map = presenceByWorkspace.get(wsId);
  if (!map) return { userIds: [], users: [] };
  const users = Array.from(map.values()).map((e) => e.user).filter(Boolean);
  return { userIds: users.map((u) => u._id), users };
};

const getRole = async (workspaceId, userId) => {
  try {
    const Workspace = require("./models/Workspace");
    const ws = await Workspace.findById(workspaceId).select("members owner");
    if (!ws) return null;
    if (ws.owner.toString() === userId) return "owner";
    const m = ws.members.find((m) => m.user.toString() === userId);
    return m ? m.role : null;
  } catch { return null; }
};

// ─── SOCKET EVENTS ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.data.joined = new Set();
  socket.join(`user:${socket.userId}`);

  // ── joinWorkspace ──
  socket.on("joinWorkspace", async ({ workspaceId }) => {
    if (!workspaceId) return socket.emit("error", { msg: "workspaceId required" });
    if (socket.data.joined.has(workspaceId)) {
      socket.join(`workspace:${workspaceId}`);
      return socket.emit("presence:state", { workspaceId, ...presenceSnapshot(workspaceId) });
    }
    const role = await getRole(workspaceId, socket.userId);
    if (!role) return socket.emit("error", { msg: "No access" });

    socket.join(`workspace:${workspaceId}`);
    socket.data.joined.add(workspaceId);

    const p       = getPresence(workspaceId);
    const current = p.get(socket.userId) || { count: 0, user: socket.user };
    const next    = current.count + 1;
    p.set(socket.userId, { count: next, user: socket.user });

    socket.emit("presence:state", { workspaceId, ...presenceSnapshot(workspaceId) });

    if (next === 1) {
      io.to(`workspace:${workspaceId}`).emit("member:online", {
        workspaceId, userId: socket.userId, user: socket.user, timestamp: new Date(),
      });
    }
  });

  // ── leaveWorkspace ──
  const leaveWorkspace = (workspaceId) => {
    if (!socket.data.joined.has(workspaceId)) return;
    socket.leave(`workspace:${workspaceId}`);
    socket.data.joined.delete(workspaceId);
    const p = presenceByWorkspace.get(workspaceId);
    if (!p) return;
    const current = p.get(socket.userId);
    const next    = current ? current.count - 1 : 0;
    if (next <= 0) {
      p.delete(socket.userId);
      io.to(`workspace:${workspaceId}`).emit("member:offline", {
        workspaceId, userId: socket.userId, user: socket.user, timestamp: new Date(),
      });
    } else {
      p.set(socket.userId, { ...current, count: next });
    }
    if (p.size === 0) presenceByWorkspace.delete(workspaceId);
  };

  socket.on("leaveWorkspace", ({ workspaceId }) => {
    if (workspaceId) leaveWorkspace(workspaceId);
  });

  // ── document:edit ──
  socket.on("document:edit", async ({ workspaceId, documentId, cell, value }) => {
    if (!workspaceId || !documentId || !cell)
      return socket.emit("error", { msg: "workspaceId, documentId, cell required" });
    const role = await getRole(workspaceId, socket.userId);
    if (!role || role === "viewer")
      return socket.emit("error", { msg: "No permission to edit" });
    socket.to(`workspace:${workspaceId}`).emit("document:cellUpdated", {
      documentId, cell, value, userId: socket.userId, timestamp: new Date(),
    });
  });

  // ── document:cursor ──
  socket.on("document:cursor", async ({ workspaceId, documentId, cursor }) => {
    if (!workspaceId || !documentId || !cursor) return;
    const role = await getRole(workspaceId, socket.userId);
    if (!role) return;
    socket.to(`workspace:${workspaceId}`).emit("document:cursorMoved", {
      documentId, cursor,
      userId:   socket.userId,
      userName: socket.user?.displayName || socket.user?.username,
      timestamp: new Date(),
    });
  });

  // ── message:send ──
  socket.on("message:send", async ({ workspaceId, message }) => {
    if (!workspaceId || !message?.content)
      return socket.emit("error", { msg: "workspaceId and message.content required" });
    const role = await getRole(workspaceId, socket.userId);
    if (!role || role === "viewer")
      return socket.emit("error", { msg: "No permission to send messages" });
    io.to(`workspace:${workspaceId}`).emit("message:new", {
      ...message,
      sender:    socket.user,
      author:    socket.user,
      timestamp: message.createdAt || new Date(),
    });
  });

  // ── user:typing ──
  socket.on("user:typing", async ({ workspaceId, isTyping }) => {
    if (!workspaceId) return;
    const role = await getRole(workspaceId, socket.userId);
    if (!role) return;
    socket.to(`workspace:${workspaceId}`).emit("user:typing", {
      userId:   socket.userId,
      userName: socket.user?.displayName || socket.user?.username,
      isTyping,
      timestamp: new Date(),
    });
  });

  // ── disconnect ──
  socket.on("disconnect", () => {
    Array.from(socket.data.joined).forEach(leaveWorkspace);
  });
});

app.set("io", io);

// ─── ERROR HANDLERS ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ msg: "Not found" });
  next();
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return;
  console.error("Unhandled error:", err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const value = err.keyValue?.[field];
    if (!value) return; // sparse null — ignore
    return res.status(409).json({ msg: `${field} already in use`, field });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ msg: Object.values(err.errors).map((e) => e.message).join(", ") });
  }
  if (err.name === "CastError")           return res.status(400).json({ msg: "Invalid ID" });
  if (err.name === "JsonWebTokenError")   return res.status(401).json({ msg: "Invalid token" });
  if (err.name === "TokenExpiredError")   return res.status(401).json({ msg: "Token expired" });

  res.status(err.status || 500).json({ msg: err.message || "Server error" });
});

// ─── STARTUP ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const getMongoUri = () => (
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL  ||
  process.env.DATABASE_URL || ""
).trim();

async function startServer(options = {}) {
  const { skipListen = false } = options;
  const mongoUri = getMongoUri();
  try {
    if (mongoose.connection.readyState === 0 && mongoUri) {
      await mongoose.connect(mongoUri, {
        connectTimeoutMS:          10_000,
        serverSelectionTimeoutMS:  10_000,
      });
      console.log("MongoDB connected");
    } else if (!mongoUri) {
      console.warn("MONGO_URI not set — skipping DB connection");
    }
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    if (isProd && process.env.NODE_ENV !== "test") process.exit(1);
  }

  if (!skipListen && !server.listening) {
    await new Promise((resolve) => server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      resolve();
    }));
  }
  return server;
}

if (require.main === module) startServer();

// Vercel serverless handler
const vercelHandler = async (req, res) => {
  await startServer({ skipListen: true });
  return app(req, res);
};

module.exports             = vercelHandler;
module.exports.app         = app;
module.exports.server      = server;
module.exports.startServer = startServer;
