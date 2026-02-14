// ==============================
// reportService.js
// Servicios de reportes
// - Subir reporte bimestral (USER)
// - Consultar reportes y progreso (USER)
// - Revisar y aprobar/rechazar reportes (ADMIN)
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
// Endpoint base para reportes
const API_URL = "http://localhost:5000/api/reports";

// ==============================
// 2) Helper de autenticación
// ==============================
// Inyecta el token JWT en el header Authorization
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) USER: Subir reporte bimestral
// ==============================
// Params:
// - bimestre: "1" | "2" | "3"
// - file: PDF o imagen
export const uploadReport = async ({ bimestre, file }) => {
  const form = new FormData();

  form.append("bimestre", bimestre);
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
// 4) USER: Obtener mis reportes
// ==============================
export const getMyReports = async () => {
  const res = await axios.get(`${API_URL}/mine`, authHeader());
  return res.data;
};

// ==============================
// 5) USER: Progreso asociado a reportes
// ==============================
// (Horas acumuladas / estado general)
export const getMyProgress = async () => {
  const res = await axios.get(`${API_URL}/progress`, authHeader());
  return res.data;
};

// ==============================
// 6) ADMIN: Reportes pendientes
// ==============================
// Lista de reportes bimestrales por revisar
export const getPendingReports = async () => {
  const res = await axios.get(`${API_URL}/pending`, authHeader());
  return res.data;
};

// ==============================
// 7) ADMIN: Actualizar estado de reporte
// ==============================
// Params:
// - id: ID del reporte
// - status: "approved" | "rejected"
export const updateReportStatus = async (id, status) => {
  const res = await axios.patch(
    `${API_URL}/${id}/status`,
    { status },
    authHeader()
  );
  return res.data;
};
