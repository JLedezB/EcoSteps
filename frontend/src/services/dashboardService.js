// ==============================
// dashboardService.js
// Servicios de Dashboard
// - Métricas de usuario
// - Métricas de administrador
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
// Endpoint base del dashboard
const BASE_URL = "http://localhost:5000/api/dashboard";

// ==============================
// 2) Helper de autenticación
// ==============================
// Inyecta el token JWT en el header Authorization
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// ==============================
// 3) Dashboard Usuario
// ==============================
// Obtiene métricas y resumen del usuario logueado
export const getUserDashboard = async () => {
  const res = await axios.get(`${BASE_URL}/user`, authHeader());
  return res.data;
};

// ==============================
// 4) Dashboard Administrador
// ==============================
// Obtiene métricas globales para el panel admin
export const getAdminDashboard = async () => {
  const res = await axios.get(`${BASE_URL}/admin`, authHeader());
  return res.data;
};
