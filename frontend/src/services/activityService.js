import axios from "axios";
import { getToken } from "./authSession";

// ==============================
// 1) Configuración base
// ==============================
const API_URL = "http://localhost:5000/api/activities";

// ==============================
// 2) Helpers (headers / auth)
// ==============================
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) Endpoints: lectura (user/admin)
// ==============================
export const getActivities = async () => {
  const { data } = await axios.get(API_URL, authHeader());
  return data;
};

export const getMyActivities = async () => {
  const { data } = await axios.get(`${API_URL}/mine`, authHeader());
  return data;
};

// ==============================
// 4) Endpoints: inscripción (user)
// ==============================
export const joinActivity = async (activityId) => {
  const { data } = await axios.post(
    `${API_URL}/${activityId}/join`,
    {},
    authHeader()
  );
  return data;
};

export const leaveActivity = async (activityId) => {
  const { data } = await axios.post(
    `${API_URL}/${activityId}/leave`,
    {},
    authHeader()
  );
  return data;
};

// ==============================
// 5) Endpoints: administración (admin)
// ==============================
export const createActivity = async (payload) => {
  const { data } = await axios.post(API_URL, payload, authHeader());
  return data;
};

export const updateActivity = async (id, payload) => {
  const { data } = await axios.put(`${API_URL}/${id}`, payload, authHeader());
  return data;
};

export const deleteActivity = async (id) => {
  const { data } = await axios.delete(`${API_URL}/${id}`, authHeader());
  return data;
};