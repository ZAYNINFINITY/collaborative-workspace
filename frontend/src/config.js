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

// In production we *force* same-origin API usage (`/api`) so:
// - cookies work reliably
// - CORS never blocks requests
// - Vercel rewrites/proxy handles routing to the backend
//
// If you need a custom API URL in production, set it to a relative path like
// `/api` (recommended) or remove the env var entirely.
export const API_BASE_URL = isProduction
  ? normalizedEnvApiBaseUrl.startsWith("/")
    ? normalizedEnvApiBaseUrl
    : "/api"
  : normalizedEnvApiBaseUrl || DEFAULT_LOCAL_API_BASE_URL;

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

export const API_ORIGIN = API_BASE_URL.startsWith("/")
  ? getBrowserOrigin()
  : API_BASE_URL.replace(/\/api\/?$/, "");

export const SOCKET_URL = API_ORIGIN;
