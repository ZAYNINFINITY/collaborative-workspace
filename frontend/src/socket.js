import { io } from "socket.io-client";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// Derive socket base URL from API base by stripping trailing /api if present
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ["websocket", "polling"],
  // Performance optimizations
  rememberUpgrade: false,
  maxHttpBufferSize: 1e5,
  forceNew: false,
});
