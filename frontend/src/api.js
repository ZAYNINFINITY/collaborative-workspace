import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default API;
