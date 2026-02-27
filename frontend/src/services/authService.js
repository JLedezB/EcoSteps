import axios from "axios";

// ==============================
// 1) Axios Instance
// ==============================
const api = axios.create({
  baseURL: "/api/auth",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==============================
// 2) Error Helper
// ==============================
const parseError = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

// ==============================
// 3) Login
// ==============================
export const login = async (payload) => {
  try {
    const { data } = await api.post("/login", payload);
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error desconocido en login"));
  }
};

// ==============================
// 4) Registro (OTP flow)
// ==============================

// Solicitar código de registro
export const requestRegisterCode = async (email) => {
  try {
    const { data } = await api.post("/register/request-code", { email });
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error al enviar código"));
  }
};

// Verificar código y crear usuario
export const verifyRegisterCode = async (payload) => {
  try {
    const { data } = await api.post("/register/verify-code", payload);
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error al verificar código"));
  }
};

// ==============================
// 5) Google Auth
// ==============================
export const googleAuth = async (idToken) => {
  try {
    const { data } = await api.post("/google", { idToken });
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error en Google Auth"));
  }
};

// ==============================
// 6) Password Reset (OTP flow)
// ==============================

// Solicitar código de restablecimiento
export const requestPasswordResetCode = async (email) => {
  try {
    const { data } = await api.post("/password/request-code", { email });
    return data;
  } catch (error) {
    throw new Error(
      parseError(error, "Error al enviar código de restablecimiento")
    );
  }
};

// Verificar código y cambiar contraseña
export const verifyPasswordResetCode = async ({
  email,
  code,
  newPassword,
}) => {
  try {
    const { data } = await api.post("/password/verify-code", {
      email,
      code,
      newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(
      parseError(error, "Error al restablecer contraseña")
    );
  }
};