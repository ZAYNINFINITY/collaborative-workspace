const DEFAULT_REMOTE_API_BASE_URL =
  "https://collaborative-workspace-backend-production-68d2.up.railway.app/api";

const envApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();
const isLocalEnvApi =
  /localhost|127\.0\.0\.1/i.test(envApiBaseUrl) ||
  envApiBaseUrl.startsWith("http://0.0.0.0");

export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? envApiBaseUrl && !isLocalEnvApi
      ? envApiBaseUrl
      : "/api"
    : envApiBaseUrl || DEFAULT_REMOTE_API_BASE_URL;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? DEFAULT_REMOTE_API_BASE_URL.replace(/\/api\/?$/, "")
    : API_ORIGIN;
