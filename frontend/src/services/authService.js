import api from "./api";

// ==============================
// 1) Error Helper
// ==============================
const parseError = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

// ==============================
// 2) Login
// ==============================
export const login = async (payload) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error desconocido en login"));
  }
};

// ==============================
// 3) Registro (OTP flow)
// ==============================
export const requestRegisterCode = async (email) => {
  try {
    const { data } = await api.post("/auth/register/request-code", { email });
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error al enviar código"));
  }
};

export const verifyRegisterCode = async (payload) => {
  try {
    const { data } = await api.post("/auth/register/verify-code", payload);
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error al verificar código"));
  }
};

// ==============================
// 4) Google Auth
// ==============================
export const googleAuth = async (idToken) => {
  try {
    const { data } = await api.post("/auth/google", { idToken });
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error en Google Auth"));
  }
};

// ==============================
// 5) Password Reset (OTP flow)
// ==============================
export const requestPasswordResetCode = async (email) => {
  try {
    const { data } = await api.post("/auth/password/request-code", { email });
    return data;
  } catch (error) {
    throw new Error(
      parseError(error, "Error al enviar código de restablecimiento")
    );
  }
};

export const verifyPasswordResetCode = async ({
  email,
  code,
  newPassword,
}) => {
  try {
    const { data } = await api.post("/auth/password/verify-code", {
      email,
      code,
      newPassword,
    });
    return data;
  } catch (error) {
    throw new Error(parseError(error, "Error al restablecer contraseña"));
  }
};