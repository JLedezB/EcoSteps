// ==============================
// authSession.js
// Manejo de sesión en localStorage
// - Token JWT
// - Rol del usuario
// - ID del usuario
// - ✅ Perfil (nombre/apellido/email) para UI
// ==============================

const USER_KEY = "ecosteps_user";

// ==============================
// 1) Guardar sesión
// ==============================
// Guarda token, rol y opcionalmente perfil del usuario
export const setSession = ({ token, role, user }) => {
  if (token) localStorage.setItem("token", token);
  if (role) localStorage.setItem("role", role);

  // ✅ guarda el perfil si viene
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// ==============================
// 2) Limpiar sesión
// ==============================
// Se usa en logout o expiración de sesión
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem(USER_KEY);
};

// ==============================
// 3) Getters de sesión
// ==============================
export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
export const getUserId = () => localStorage.getItem("userId");

// ✅ perfil completo (para sidebar)
export const getSessionUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};
