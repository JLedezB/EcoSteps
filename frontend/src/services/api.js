
import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Instancia base
// ==============================
const api = axios.create({
  baseURL: "/api",
});

// ==============================
// 2) Interceptor: Request
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
// 3) Interceptor: Response
// ==============================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Error en la petición";

    return Promise.reject(new Error(message));
  }
);

// ==============================
// 4) Export
// ==============================
export default api;