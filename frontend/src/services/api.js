// ==============================
// api.js
// Cliente HTTP centralizado (Axios)
// - Base URL común (/api)
// - Inyección automática de JWT (Bearer)
// - Manejo uniforme de errores
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Instancia base de Axios
// ==============================
// Usar "/api" permite:
// - Proxy en desarrollo (Vite / CRA)
// - No hardcodear dominio (prod / staging)
const api = axios.create({
  baseURL: "/api",
});

// ==============================
// 2) Interceptor de REQUEST
// ==============================
// Se ejecuta antes de cada petición.
// - Adjunta el token JWT si existe
// - Evita repetir Authorization en cada service
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
// 3) Interceptor de RESPONSE
// ==============================
// Se ejecuta en cada respuesta.
// - Deja pasar respuestas correctas
// - Normaliza errores con un mensaje limpio
api.interceptors.response.use(
  // Respuesta exitosa
  (response) => response,

  // Error
  (error) => {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Error en la petición";

    // Se rechaza con Error estándar para que
    // los services y la UI manejen `.message`
    return Promise.reject(new Error(msg));
  }
);

// ==============================
// 4) Export
// ==============================
// Este cliente debe usarse en:
// - activityService
// - ticketService
// - evidenceService
// - reportService
export default api;
