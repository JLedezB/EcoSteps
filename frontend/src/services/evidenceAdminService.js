// ==============================
// evidenceAdminService.js
// Servicios de evidencias (ADMIN)
// - Listar evidencias por actividad
// - Actualizar estado de evidencia
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
// Endpoint base para evidencias
const API_URL = "http://localhost:5000/api/evidences";

// ==============================
// 2) Helper de autenticación
// ==============================
// Inyecta el token JWT en el header Authorization
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) Evidencias por actividad (ADMIN)
// ==============================
// activityId: ID de la actividad
export const getEvidencesByActivity = async (activityId) => {
  const res = await axios.get(
    `${API_URL}/activity/${activityId}`,
    authHeader()
  );
  return res.data;
};

// ==============================
// 4) Actualizar estado de evidencia (ADMIN)
// ==============================
// evidenceId: ID de la evidencia
// status: "pending" | "approved" | "rejected"
export const updateEvidenceStatus = async (evidenceId, status) => {
  const res = await axios.patch(
    `${API_URL}/${evidenceId}/status`,
    { status },
    authHeader()
  );
  return res.data;
};
