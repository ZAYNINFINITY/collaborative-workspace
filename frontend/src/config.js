const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";

const nodeEnv = (process.env.NODE_ENV || "development").trim();
const envApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();
const isProduction = nodeEnv === "production";

const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed === "/api") return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const normalizedEnvApiBaseUrl = normalizeApiBaseUrl(envApiBaseUrl);
const normalizedRelativeApiBaseUrl = normalizedEnvApiBaseUrl.startsWith("/")
  ? normalizedEnvApiBaseUrl
  : "";

// In production we *force* same-origin API usage (`/api`) so:
// - cookies work reliably
// - CORS never blocks requests
// - Vercel rewrites/proxy handles routing to the backend
//
// Only relative paths are allowed in production. Any absolute URL env var is
// ignored so a stale deploy variable cannot bypass the proxy and break CORS.
export const API_BASE_URL = isProduction
  ? normalizedRelativeApiBaseUrl || "/api"
  : normalizedEnvApiBaseUrl || DEFAULT_LOCAL_API_BASE_URL;

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

export const API_ORIGIN = API_BASE_URL.startsWith("/")
  ? getBrowserOrigin()
  : API_BASE_URL.replace(/\/api\/?$/, "");

export const SOCKET_URL = API_ORIGIN;
