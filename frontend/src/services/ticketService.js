// ==============================
// ticketService.js
// Servicios de tickets
// - Listar (user/admin)
// - Crear ticket (user)
// - Detalle + chat (user/admin)
// - Enviar mensajes (JSON o multipart)
// - Actualizar estado (admin)
// ==============================

import axios from "axios";

// ==============================
// 1) Configuración base
// ==============================
const API_URL = "http://localhost:5000/api/tickets";

// ==============================
// 2) Helpers de autenticación (token + headers)
// ==============================
// Nota: aquí el token se lee directo de localStorage.
// (Mantengo tu comportamiento tal cual)
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

// ==============================
// 3) Tickets del usuario (USER)
// ==============================

// Obtiene los tickets del usuario autenticado
export const getMyTickets = async () => {
  const res = await axios.get(`${API_URL}/mine`, authHeaders());
  return res.data;
};

// Crea un ticket (subject, description, activityId opcional)
export const createTicket = async (payload) => {
  const res = await axios.post(`${API_URL}`, payload, authHeaders());
  return res.data;
};

// ==============================
// 4) Tickets globales (ADMIN)
// ==============================

// ✅ Acepta status opcional: "", "open", "in_progress", "resolved"
export const getAllTickets = async (status = "") => {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await axios.get(`${API_URL}${q}`, authHeaders());
  return res.data;
};

// ==============================
// 5) Detalle de ticket (USER/ADMIN)
// ==============================

// Trae detalle + mensajes del ticket
export const getTicketDetail = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, authHeaders());
  return res.data;
};

// ==============================
// 6) Chat: enviar mensaje (USER/ADMIN)
// ==============================
// - Si NO hay archivo -> JSON normal
// - Si hay archivo -> multipart/form-data
export const sendTicketMessage = async (id, text, file = null) => {
  // Caso 1: mensaje sin adjunto (JSON)
  if (!file) {
    const res = await axios.post(
      `${API_URL}/${id}/messages`,
      { text },
      authHeaders()
    );
    return res.data;
  }

  // Caso 2: mensaje con adjunto (multipart)
  const formData = new FormData();
  formData.append("text", text || "");
  formData.append("file", file);

  const res = await axios.post(`${API_URL}/${id}/messages`, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// ==============================
// 7) Estado del ticket (ADMIN)
// ==============================

// Actualiza el status del ticket: "open" | "in_progress" | "resolved"
export const updateTicketStatus = async (id, status) => {
  const res = await axios.patch(
    `${API_URL}/${id}/status`,
    { status },
    authHeaders()
  );
  return res.data;
};
