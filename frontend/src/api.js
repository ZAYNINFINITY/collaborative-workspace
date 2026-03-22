import axios from "axios";
import { API_BASE_URL } from "./config";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

let csrfToken = null;

/** Clear in-memory CSRF cache (call after logout or session expiry). */
export function resetCsrfTokenCache() {
  csrfToken = null;
}

/** Dispatched when an API call returns 401 so AuthProvider can clear client session state. */
export const AUTH_UNAUTHORIZED_EVENT = "collab:auth-unauthorized";

function shouldIgnore401SessionClear(config) {
  const url = config?.url || "";
  const path = url.split("?")[0];
  // Wrong password on login must not wipe an existing session; signup errors likewise.
  if (path.endsWith("/auth/login") || path.endsWith("/auth/signup")) return true;
  return false;
}

API.interceptors.response.use(
  (response) => {
    const nextToken = response?.headers?.["x-csrf-token"];
    if (nextToken) {
      csrfToken = nextToken;
    }
    return response;
  },
  (error) => {
    const nextToken = error?.response?.headers?.["x-csrf-token"];
    if (nextToken) {
      csrfToken = nextToken;
    }
    const status = error?.response?.status;
    const cfg = error?.config;
    if (
      status === 401 &&
      cfg &&
      !shouldIgnore401SessionClear(cfg) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

API.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method) && csrfToken) {
    config.headers = config.headers || {};
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

export default API;
