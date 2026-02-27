// ==============================
// ticketService.js (FRONTEND)
// NO Node/Express/Mongoose/Multer aquí.
// ==============================

import axios from "axios";
import { getToken } from "./authSession";

const API_URL = "http://localhost:5000/api/tickets";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// USER: crear ticket
export const createTicket = async ({ subject, description, activityId }) => {
  const res = await axios.post(
    API_URL,
    { subject, description, activityId },
    authHeader()
  );
  return res.data;
};

// USER: listar mis tickets
export const getMyTickets = async () => {
  const res = await axios.get(`${API_URL}/mine`, authHeader());
  return res.data;
};

// ADMIN: listar tickets (opcional filtro status)
export const getAllTickets = async (status) => {
  const params = {};
  if (status) params.status = status;

  const res = await axios.get(API_URL, {
    ...authHeader(),
    params,
  });
  return res.data;
};

// USER/ADMIN: detalle ticket
export const getTicketById = async (ticketId) => {
  const res = await axios.get(`${API_URL}/${ticketId}`, authHeader());
  return res.data;
};

// USER/ADMIN: enviar mensaje + adjunto opcional
export const sendTicketMessage = async (ticketId, { text = "", file = null }) => {
  const fd = new FormData();
  fd.append("text", text || "");
  if (file) fd.append("file", file);

  const res = await axios.post(`${API_URL}/${ticketId}/messages`, fd, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// ADMIN: cambiar estado
export const updateTicketStatus = async (ticketId, status) => {
  const res = await axios.patch(
    `${API_URL}/${ticketId}/status`,
    { status },
    authHeader()
  );
  return res.data;
};