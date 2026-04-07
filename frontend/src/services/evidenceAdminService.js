import api from "./api";

// ==============================
// 1) Evidencias por actividad (ADMIN)
// ==============================
export const getEvidencesByActivity = async (activityId) => {
  const { data } = await api.get(`/evidences/activity/${activityId}`);
  return data;
};

// ==============================
// 2) Actualizar estado de evidencia (ADMIN)
// ==============================
export const updateEvidenceStatus = async (evidenceId, status) => {
  const { data } = await api.patch(`/evidences/${evidenceId}/status`, {
    status,
  });
  return data;
};