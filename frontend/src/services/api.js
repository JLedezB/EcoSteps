import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Base URL
// ==============================
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://ecosteps-les4.onrender.com";

// ==============================
// 2) Axios instance
// ==============================
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

// ==============================
// 3) Request interceptor
// ==============================
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// 4) Response interceptor
// ==============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error en la petición";

    return Promise.reject(new Error(message));
  }
);

// ==============================
// 5) Export
// ==============================
export default api;
export { API_BASE_URL };