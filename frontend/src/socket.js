import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

const isProduction = (process.env.NODE_ENV || "development") === "production";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  // In production the app reaches the backend through Vercel rewrites.
  // Polling is more reliable there because websocket upgrades may not survive
  // the proxy path consistently across deployments.
  transports: isProduction ? ["polling"] : ["websocket", "polling"],
  upgrade: !isProduction,
  // Performance optimizations
  rememberUpgrade: false,
  maxHttpBufferSize: 1e5,
  forceNew: false,
});
