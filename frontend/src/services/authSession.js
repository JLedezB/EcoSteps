// ==============================
// authSession.js
// Manejo de sesión en localStorage
// ==============================

const USER_KEY = "ecosteps_user";

// ==============================
// 1) Guardar sesión
// ==============================
export const setSession = ({ token, role, user, userId }) => {
  if (token) localStorage.setItem("token", token);
  if (role) localStorage.setItem("role", role);
  if (userId) localStorage.setItem("userId", userId);

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// ==============================
// 2) Limpiar sesión
// ==============================
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem(USER_KEY);
};

// ==============================
// 3) Getters
// ==============================
export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");
export const getUserId = () => localStorage.getItem("userId");

export const getSessionUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};