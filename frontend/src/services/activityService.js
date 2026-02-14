// ==============================
// activityService.js
// Capa de servicios (API) para Activities
// - Centraliza llamadas HTTP al backend (axios)
// - Incluye Authorization Bearer usando el token de sesión
// - Mantiene funciones separadas por caso de uso (user/admin)
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
const API_URL = "http://localhost:5000/api/activities";

// ==============================
// 2) Helpers (headers / auth)
// ==============================
// Genera el header Authorization usando el token actual.
// Nota: si getToken() retorna null/undefined, el backend debe responder 401.
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) Endpoints: lectura (user/admin)
// ==============================

// ✅ LISTAR actividades (user/admin)
export const getActivities = async () => {
  const res = await axios.get(API_URL, authHeader());
  return res.data;
};

// ✅ MIS actividades (user)
export const getMyActivities = async () => {
  const res = await axios.get(`${API_URL}/mine`, authHeader());
  return res.data;
};

// ==============================
// 4) Endpoints: inscripción (user)
// ==============================

// ✅ INSCRIBIRSE a una actividad (user)
export const joinActivity = async (activityId) => {
  const res = await axios.post(`${API_URL}/${activityId}/join`, {}, authHeader());
  return res.data;
};

// ✅ SALIRSE de una actividad (user)
export const leaveActivity = async (activityId) => {
  const res = await axios.post(`${API_URL}/${activityId}/leave`, {}, authHeader());
  return res.data;
};

// ==============================
// 5) Endpoints: administración (admin)
// ==============================

// ✅ CREAR actividad (admin)
export const createActivity = async (data) => {
  const res = await axios.post(API_URL, data, authHeader());
  return res.data;
};

// ✅ EDITAR actividad (admin)
export const updateActivity = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data, authHeader());
  return res.data;
};

// ✅ ELIMINAR actividad (admin)
export const deleteActivity = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`, authHeader());
  return res.data;
};
