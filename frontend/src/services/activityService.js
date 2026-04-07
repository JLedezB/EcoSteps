import api from "./api";

// ==============================
// 1) Endpoints: lectura (user/admin)
// ==============================
export const getActivities = async () => {
  const { data } = await api.get("/activities");
  return data;
};

export const getMyActivities = async () => {
  const { data } = await api.get("/activities/mine");
  return data;
};

// ==============================
// 2) Endpoints: inscripción (user)
// ==============================
export const joinActivity = async (activityId) => {
  const { data } = await api.post(`/activities/${activityId}/join`, {});
  return data;
};

export const leaveActivity = async (activityId) => {
  const { data } = await api.post(`/activities/${activityId}/leave`, {});
  return data;
};

// ==============================
// 3) Endpoints: administración (admin)
// ==============================
export const createActivity = async (payload) => {
  const { data } = await api.post("/activities", payload);
  return data;
};

export const updateActivity = async (id, payload) => {
  const { data } = await api.put(`/activities/${id}`, payload);
  return data;
};

export const deleteActivity = async (id) => {
  const { data } = await api.delete(`/activities/${id}`);
  return data;
};