import axios from "axios";

const api = axios.create({
  baseURL: "/api/auth",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const parseError = (err, fallback) => {
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;
};

export const login = async (data) => {
  try {
    const res = await api.post("/login", data);
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error desconocido en login"));
  }
};

// ✅ Registro - pedir código
export const requestRegisterCode = async (email) => {
  try {
    const res = await api.post("/register/request-code", { email });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error al enviar código"));
  }
};

// ✅ Registro - verificar código + crear usuario
export const verifyRegisterCode = async (payload) => {
  try {
    const res = await api.post("/register/verify-code", payload);
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error al verificar código"));
  }
};

export const googleAuth = async (idToken) => {
  try {
    const res = await api.post("/google", { idToken });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error en Google Auth"));
  }
};

// ✅ Password reset - pedir código
export const requestPasswordResetCode = async (email) => {
  try {
    const res = await api.post("/password/request-code", { email });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error al enviar código de restablecimiento"));
  }
};

// ✅ Password reset - verificar código + cambiar password
export const verifyPasswordResetCode = async ({ email, code, newPassword }) => {
  try {
    const res = await api.post("/password/verify-code", { email, code, newPassword });
    return res.data;
  } catch (err) {
    throw new Error(parseError(err, "Error al restablecer contraseña"));
  }
};