import axios from "axios";
import { API_BASE_URL } from "./config";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

// ─── CSRF token ───────────────────────────────────────────────────────────────
// Stored in memory. Seeded from the X-CSRF-Token response header (set by
// csrfTokenProvider on every response including GET /health).
// Also read from the csrf_token cookie as a fallback on the first request after
// a hard refresh, before any API response has arrived to seed the memory value.
let csrfToken = null;

function readCsrfCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function resetCsrfTokenCache() {
  csrfToken = null;
}

// ─── Auth event ───────────────────────────────────────────────────────────────
export const AUTH_UNAUTHORIZED_EVENT = "collab:auth-unauthorized";

function shouldIgnore401(config) {
  // A wrong password on /login or /signup must NOT wipe an existing session
  const url = (config?.url || "").split("?")[0];
  return url.endsWith("/auth/login") || url.endsWith("/auth/signup");
}

// ─── Response interceptor ─────────────────────────────────────────────────────
API.interceptors.response.use(
  (response) => {
    const next = response?.headers?.["x-csrf-token"];
    if (next) csrfToken = next;
    return response;
  },
  (error) => {
    const next = error?.response?.headers?.["x-csrf-token"];
    if (next) csrfToken = next;

    const status = error?.response?.status;
    if (
      status === 401 &&
      error?.config &&
      !shouldIgnore401(error.config) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

// ─── Request interceptor ──────────────────────────────────────────────────────
// Attach CSRF token to every state-changing request.
// Falls back to the cookie value so the very first POST after a hard refresh
// works without waiting for a GET /health round-trip.
API.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = csrfToken || readCsrfCookie();
    if (token) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = token;
      // Keep in-memory cache in sync
      if (!csrfToken) csrfToken = token;
    }
  }
  return config;
});

export default API;
