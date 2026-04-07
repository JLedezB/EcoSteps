import api from "./api";

export const askEcoBot = async (message) => {
  const { data } = await api.post("/chatbot/ask", { message });
  return data;
};

export const createTicketFromEcoBot = async ({ message, subject }) => {
  const { data } = await api.post("/chatbot/create-ticket", {
    message,
    subject,
  });
  return data;
};