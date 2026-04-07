import api from "./api";

// ==============================
// 1) USER: Subir reporte bimestral
// ==============================
export const uploadReport = async ({ bimestre, file }) => {
  const form = new FormData();

  form.append("bimestre", bimestre);
  form.append("file", file);

  const { data } = await api.post("/reports/upload", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

// ==============================
// 2) USER: Obtener mis reportes
// ==============================
export const getMyReports = async () => {
  const { data } = await api.get("/reports/mine");
  return data;
};

// ==============================
// 3) USER: Progreso asociado a reportes
// ==============================
export const getMyProgress = async () => {
  const { data } = await api.get("/reports/progress");
  return data;
};

// ==============================
// 4) ADMIN: Reportes pendientes
// ==============================
export const getPendingReports = async () => {
  const { data } = await api.get("/reports/pending");
  return data;
};

// ==============================
// 5) ADMIN: Actualizar estado de reporte
// ==============================
export const updateReportStatus = async (id, status) => {
  const { data } = await api.patch(`/reports/${id}/status`, { status });
  return data;
};