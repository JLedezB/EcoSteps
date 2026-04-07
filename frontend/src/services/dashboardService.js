import api from "./api";

// ==============================
// 1) Dashboard Usuario
// ==============================
export const getUserDashboard = async () => {
  const { data } = await api.get("/dashboard/user");
  return data;
};

// ==============================
// 2) Dashboard Administrador
// ==============================
export const getAdminDashboard = async () => {
  const { data } = await api.get("/dashboard/admin");
  return data;
};