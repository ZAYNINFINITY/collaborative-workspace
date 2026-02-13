const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { Server } = require("socket.io");

require("dotenv").config();

// Default to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || "development";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Starting server...");

const app = express();

const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

// Security & logging middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(morgan("combined"));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Allow localhost on common dev ports
      if (origin.startsWith("http://localhost:") || origin === clientUrl) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "insecure_dev_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

app.use(session(sessionConfig));

// Passport config
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/workspaces", require("./routes/workspaces"));
app.use("/api/activities", require("./routes/activities"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Create HTTP server and Socket.io instance
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("joinWorkspace", ({ workspaceId }) => {
    if (!workspaceId) return;
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on("leaveWorkspace", ({ workspaceId }) => {
    if (!workspaceId) return;
    socket.leave(`workspace:${workspaceId}`);
  });

  socket.on(
    "document:edit",
    ({ workspaceId, documentId, cell, value, userId }) => {
      if (!workspaceId || !documentId) return;
      socket.to(`workspace:${workspaceId}`).emit("document:cellUpdated", {
        documentId,
        cell,
        value,
        userId,
      });
    },
  );

  socket.on(
    "document:cursor",
    ({ workspaceId, documentId, cursor, userId }) => {
      if (!workspaceId || !documentId) return;
      socket.to(`workspace:${workspaceId}`).emit("document:cursorMoved", {
        documentId,
        cursor,
        userId,
      });
    },
  );

  // Handle direct message sending via socket (for real-time sync)
  socket.on("message:send", ({ workspaceId, message }) => {
    if (!workspaceId || !message) return;
    // Broadcast to all clients in workspace room
    io.to(`workspace:${workspaceId}`).emit("message:new", message);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
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
  res
    .status(err.status || 500)
    .json({ msg: err.message || "Server error. Please try again later." });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;

/**
 * Start the HTTP server and connect to MongoDB.
 * Exported for tests so they can start/stop the server explicitly.
 */
async function startServer() {
  try {
    console.log("NODE_ENV in startServer:", process.env.NODE_ENV);
    // Skip MongoDB connection in development for easier testing
    if (process.env.NODE_ENV === "development") {
      console.warn("Skipping MongoDB connection in development mode");
    } else if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    } else if (!process.env.MONGO_URI) {
      console.warn("MONGO_URI not set, skipping MongoDB connection");
    }

    // Only call listen if the server isn't already listening
    if (!server.listening) {
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
      if (!server.listening) {
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

module.exports = { app, server, startServer };
