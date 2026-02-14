// ==============================
// authService.js
// Servicios de autenticación
// - Login
// - Registro
// - Google OAuth
// ==============================

import axios from "axios";

// ==============================
// 1) Instancia Axios (Auth)
// ==============================
// - baseURL aislado para auth
// - timeout para evitar requests colgados
// - headers JSON por defecto
const api = axios.create({
  baseURL: "/api/auth",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ==============================
// 2) Helpers
// ==============================
// Extrae el mejor mensaje de error posible
const parseError = (err, fallback) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
};

// ==============================
// 3) Auth: Login
// ==============================
// data = { email, password }
export const login = async (data) => {
  try {
    const res = await api.post("/login", data);
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error desconocido en login"));
  }
};

// ==============================
// 4) Auth: Register
// ==============================
// data = { nombre, apellido, email, password, telefono, role }
export const register = async (data) => {
  try {
    const res = await api.post("/register", data);
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error desconocido en registro"));
  }
};

// ==============================
// 5) Auth: Google OAuth
// ==============================
// idToken = token JWT de Firebase
export const googleAuth = async (idToken) => {
  try {
    const res = await api.post("/google", { idToken });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error en Google Auth"));
  }
};
