import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

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
