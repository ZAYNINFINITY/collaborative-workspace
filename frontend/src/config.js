const DEFAULT_REMOTE_API_BASE_URL =
  "https://collaborative-workspace-backend-production-68d2.up.railway.app/api";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";

const nodeEnv = (process.env.NODE_ENV || "development").trim();
const envApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();

const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed === "/api") return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const defaultApiBaseUrl =
  nodeEnv === "production" ? "/api" : DEFAULT_LOCAL_API_BASE_URL;

export const API_BASE_URL =
  normalizeApiBaseUrl(envApiBaseUrl) || defaultApiBaseUrl;

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

export const API_ORIGIN = API_BASE_URL.startsWith("/")
  ? getBrowserOrigin()
  : API_BASE_URL.replace(/\/api\/?$/, "");

export const SOCKET_URL = API_ORIGIN;
