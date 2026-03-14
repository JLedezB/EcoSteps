import axios from "axios";
import { getToken } from "./authSession";

const API_URL = "http://localhost:5000/api/chatbot";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const askEcoBot = async (message) => {
  const res = await axios.post(
    `${API_URL}/ask`,
    { message },
    authHeader()
  );
  return res.data;
};

export const createTicketFromEcoBot = async ({ message, subject }) => {
  const res = await axios.post(
    `${API_URL}/create-ticket`,
    { message, subject },
    authHeader()
  );
  return res.data;
};