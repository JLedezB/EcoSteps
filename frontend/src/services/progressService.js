// ==============================
// progressService.js
// Servicios de progreso del usuario
// - Obtiene avance personal (horas / actividades)
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
// Endpoint base para progreso
const API_URL = "http://localhost:5000/api/progress";

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
// 3) Progreso del usuario
// ==============================
// Obtiene el progreso del usuario autenticado
export const getMyProgress = async () => {
  const res = await axios.get(`${API_URL}/me`, authHeader());
  return res.data;
};
