/**
 * socket.js
 *
 * Socket.io client singleton.
 *
 * Transport strategy:
 *   Production (Vercel):
 *     - POLLING ONLY. Vercel rewrites /socket.io/* to Railway as HTTP,
 *       but cannot upgrade the connection to WebSocket. Attempting websocket
 *       transport causes the "WebSocket connection failed" errors in the console.
 *     - upgrade: false prevents socket.io from ever trying to switch to ws://
 *
 *   Development (localhost):
 *     - Websocket first, polling fallback. Fast and standard.
 *
 * autoConnect: false — AuthProvider connects/disconnects based on auth state
 * so we never have an open socket for a logged-out user.
 */

import { io } from "socket.io-client";
import { SOCKET_URL, IS_PRODUCTION } from "./config";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect:     false,

  // In production, Vercel cannot tunnel WebSocket upgrades through its
  // serverless rewrite layer. Using polling avoids the repeated
  // "WebSocket connection failed" errors and is still fully real-time
  // (Socket.io polling works fine at the scale of a student workspace tool).
  transports: IS_PRODUCTION ? ["polling"] : ["websocket", "polling"],
  upgrade:    !IS_PRODUCTION,

  // Polling-specific tuning for production
  ...(IS_PRODUCTION && {
    path:                "/socket.io",
    reconnection:        true,
    reconnectionDelay:   1500,
    reconnectionDelayMax: 8000,
    reconnectionAttempts: 10,
    timeout:             20000,
  }),

  // Development tuning
  ...(!IS_PRODUCTION && {
    reconnection:        true,
    reconnectionDelay:   1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    rememberUpgrade:     false,
  }),

  maxHttpBufferSize: 1e5, // 100KB — keep payloads small
  forceNew:          false,
});
