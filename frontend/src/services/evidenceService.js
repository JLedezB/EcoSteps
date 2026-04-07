import api from "./api";

// ==============================
// 1) Subir evidencia (USER)
// ==============================
export const uploadEvidence = async ({ activityId, file, caption }) => {
  const form = new FormData();

  form.append("activityId", activityId);
  form.append("caption", caption || "");
  form.append("file", file);

  const { data } = await api.post("/evidences/upload", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

// ==============================
// 2) Obtener mis evidencias (USER)
// ==============================
export const getMyEvidences = async () => {
  const { data } = await api.get("/evidences/mine");
  return data;
};