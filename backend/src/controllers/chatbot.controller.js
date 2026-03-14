// backend/src/controllers/chatbot.controller.js

const Ticket = require("../models/Ticket");
const { askEcoBot } = require("../services/ai.service");
const { sanitizeString } = require("../middlewares/validate.js");

function buildTicketSubject(message = "") {
  const clean = String(message || "").trim().replace(/\s+/g, " ");
  if (!clean) return "Soporte desde EcoBot";
  return clean.length > 80 ? clean.slice(0, 80) : clean;
}

const askChatbot = async (req, res) => {
  try {
    const message = sanitizeString(req.body?.message, 1000);

    if (!message) {
      return res.status(400).json({
        ok: false,
        message: "La pregunta es obligatoria.",
      });
    }

    const userName =
      req.user?.fullName ||
      req.user?.name ||
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ").trim() ||
      req.user?.email ||
      "Usuario";

    const role = req.user?.role || "user";
    const sessionKey = req.user?._id?.toString() || req.user?.email || userName;

    const result = await askEcoBot({
      message,
      role,
      userName,
      sessionKey,
    });

    return res.status(200).json({
      ok: true,
      answer: result.answer,
      source: result.source || "unknown",
      canCreateTicket: role === "user",
    });
  } catch (error) {
    console.error("ECOBOT ASK ERROR:", error);

    return res.status(200).json({
      ok: true,
      answer:
        "Ocurrió un problema al consultar EcoBot. Intenta nuevamente o usa las opciones del menú.",
      source: "error",
      canCreateTicket: req.user?.role === "user",
    });
  }
};

const createTicketFromChatbot = async (req, res) => {
  try {
    if (req.user?.role !== "user") {
      return res.status(403).json({
        ok: false,
        message: "Solo los usuarios pueden crear tickets desde EcoBot.",
      });
    }

    const message = sanitizeString(req.body?.message, 2000);
    const suggestedSubject = sanitizeString(req.body?.subject, 120);

    if (!message) {
      return res.status(400).json({
        ok: false,
        message: "Hace falta el mensaje para crear el ticket.",
      });
    }

    const subject = suggestedSubject || buildTicketSubject(message);

    const ticket = await Ticket.create({
      user: req.user._id,
      activity: null,
      subject,
      description: message,
      status: "open",
      messages: [
        {
          senderRole: "user",
          sender: req.user._id,
          text: message,
        },
      ],
    });

    return res.status(201).json({
      ok: true,
      message: "Ticket creado correctamente desde EcoBot.",
      ticket,
    });
  } catch (error) {
    console.error("ECOBOT CREATE TICKET ERROR:", error);
    return res.status(500).json({
      ok: false,
      message: "No se pudo crear el ticket desde EcoBot.",
    });
  }
};

module.exports = {
  askChatbot,
  createTicketFromChatbot,
};