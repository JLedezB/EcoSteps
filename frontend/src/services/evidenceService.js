// ==============================
// evidenceService.js
// Servicios de evidencias (USER)
// - Subir evidencia (multipart/form-data)
// - Obtener mis evidencias
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
// Endpoint base de evidencias
const API_URL = "http://localhost:5000/api/evidences";

// ==============================
// 2) Helper de autenticación
// ==============================
// Inyecta el token JWT en el header Authorization
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) Subir evidencia (USER)
// ==============================
// Params:
// - activityId: ID de la actividad
// - file: archivo de imagen
// - caption: descripción opcional
export const uploadEvidence = async ({ activityId, file, caption }) => {
  const form = new FormData();

  form.append("activityId", activityId);
  form.append("caption", caption || "");
  form.append("file", file);

  const res = await axios.post(`${API_URL}/upload`, form, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// ==============================
// 4) Obtener mis evidencias (USER)
// ==============================
export const getMyEvidences = async () => {
  const res = await axios.get(`${API_URL}/mine`, authHeader());
  return res.data;
};
