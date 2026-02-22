import axios from "axios";
import { API_BASE_URL } from "./config";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

let csrfToken = null;

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
