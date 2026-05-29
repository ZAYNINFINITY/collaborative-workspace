/**
 * config.js
 *
 * Single source of truth for API and Socket URLs.
 *
 * Production (Vercel):
 *   - API calls use `/api` (same-origin) — Vercel rewrites proxy to Railway
 *   - Socket.io uses POLLING ONLY via the same `/socket.io` Vercel rewrite
 *     because Vercel serverless cannot upgrade HTTP→WebSocket
 *   - SOCKET_URL is always window.location.origin in production so the
 *     socket connection goes through the Vercel proxy, not directly to Railway
 *     (direct WSS to Railway is blocked by mixed-content / CORS in production)
 *
 * Development (localhost):
 *   - API calls go directly to http://localhost:5000/api
 *   - Socket connects directly to http://localhost:5000
 *   - WebSocket transport is used for lower latency
 */

const DEFAULT_LOCAL_API  = "http://localhost:5000/api";
const DEFAULT_LOCAL_SOCK = "http://localhost:5000";

const nodeEnv    = (process.env.NODE_ENV || "development").trim();
const isProduction = nodeEnv === "production";

const normalize = (url) => {
  const t = (url || "").trim().replace(/\/+$/, "");
  if (!t) return "";
  return t.endsWith("/api") ? t : `${t}/api`;
};

// In production always use relative /api — cookies + CORS + proxy all work correctly
export const API_BASE_URL = isProduction
  ? "/api"
  : normalize(process.env.REACT_APP_API_BASE_URL) || DEFAULT_LOCAL_API;

// Socket URL:
//   Production  → same origin (goes through Vercel /socket.io/* rewrite, polling only)
//   Development → direct to backend (WebSocket transport)
const getBrowserOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

export const SOCKET_URL = isProduction
  ? getBrowserOrigin()   // e.g. https://collaborative-workspace-rosy.vercel.app
  : DEFAULT_LOCAL_SOCK;

export const IS_PRODUCTION = isProduction;
