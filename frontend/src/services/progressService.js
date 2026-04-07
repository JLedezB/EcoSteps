import api from "./api";

// ==============================
// 1) Progreso del usuario
// ==============================
export const getMyProgress = async () => {
  const { data } = await api.get("/progress/me");
  return data;
};