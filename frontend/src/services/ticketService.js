import api from "./api";

// ==============================
// USER: crear ticket
// ==============================
export const createTicket = async ({ subject, description, activityId }) => {
  const { data } = await api.post("/tickets", {
    subject,
    description,
    activityId,
  });
  return data;
};

// ==============================
// USER: listar mis tickets
// ==============================
export const getMyTickets = async () => {
  const { data } = await api.get("/tickets/mine");
  return data;
};

// ==============================
// ADMIN: listar tickets
// ==============================
export const getAllTickets = async (status) => {
  const config = {};

  if (status) {
    config.params = { status };
  }

  const { data } = await api.get("/tickets", config);
  return data;
};

// ==============================
// USER/ADMIN: detalle ticket
// ==============================
export const getTicketById = async (ticketId) => {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return data;
};

// ==============================
// USER/ADMIN: enviar mensaje + adjunto opcional
// ==============================
export const sendTicketMessage = async (
  ticketId,
  { text = "", file = null }
) => {
  const fd = new FormData();
  fd.append("text", text || "");
  if (file) fd.append("file", file);

  const { data } = await api.post(`/tickets/${ticketId}/messages`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

// ==============================
// ADMIN: cambiar estado
// ==============================
export const updateTicketStatus = async (ticketId, status) => {
  const { data } = await api.patch(`/tickets/${ticketId}/status`, { status });
  return data;
};