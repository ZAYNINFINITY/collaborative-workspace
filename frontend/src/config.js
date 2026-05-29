/**
 * config.js — single source of truth for API and Socket URLs.
 *
 * Vite exposes env vars via import.meta.env, NOT process.env.
 * process.env.NODE_ENV is injected at build time via vite.config.js define.
 *
 * Production (Vercel):
 *   API_BASE_URL  = "/api"            → Vercel rewrites to Railway
 *   SOCKET_URL    = window.location.origin → goes through /socket.io/* rewrite
 *   Transport     = polling only (Vercel cannot upgrade WS)
 *
 * Development:
 *   API_BASE_URL  = http://localhost:5000/api  (or VITE_API_BASE_URL)
 *   SOCKET_URL    = http://localhost:5000
 *   Transport     = websocket first, polling fallback
 */

const isProd =
  typeof process !== "undefined"
    ? process.env.NODE_ENV === "production"
    : import.meta.env.MODE === "production";

const devApiBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000/api";

export const API_BASE_URL = isProd ? "/api" : devApiBase;

export const IS_PRODUCTION = isProd;

// Socket URL:
//   Production  → same origin so Vercel /socket.io/* rewrite forwards it
//   Development → strip /api to get the backend origin
export const SOCKET_URL = isProd
  ? (typeof window !== "undefined" ? window.location.origin : "")
  : API_BASE_URL.replace(/\/api\/?$/, "");
