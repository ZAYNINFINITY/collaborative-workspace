const DEFAULT_PROD_API_BASE_URL =
  "https://collaborative-workspace-backend-production-68d2.up.railway.app/api";

const envApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim();

export const API_BASE_URL =
  envApiBaseUrl ||
  (process.env.NODE_ENV === "production"
    ? DEFAULT_PROD_API_BASE_URL
    : "http://localhost:5000/api");

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL = API_ORIGIN;
