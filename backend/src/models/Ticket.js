// ==============================
// Ticket.model.js
// Modelo de Tickets + Chat (mensajes embebidos)
// ==============================

const mongoose = require("mongoose");

// ==============================
// Subdocumento: Mensajes del ticket
// ==============================
const ticketMessageSchema = new mongoose.Schema(
  {
    // ==========================
    // Emisor
    // ==========================
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================
    // Contenido (texto opcional)
    // ==========================
    // Puede ir vacío si el mensaje trae archivo
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // ==========================
    // Archivo opcional (Supabase / Storage)
    // ==========================
    fileUrl: {
      type: String,
      default: null, // URL pública
    },

    fileName: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      default: "", // bucket/path
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt para cada mensaje
  }
);

// ==============================
// Schema principal: Ticket
// ==============================
const ticketSchema = new mongoose.Schema(
  {
    // ==========================
    // Dueño del ticket
    // ==========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================
    // Relación opcional
    // ==========================
    // Permite ligar el ticket a una actividad específica
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      default: null,
    },

    // ==========================
    // Contenido base del ticket
    // ==========================
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // ==========================
    // Estado del ticket
    // ==========================
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },

    // ==========================
    // Chat embebido
    // ==========================
    messages: {
      type: [ticketMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt / updatedAt del ticket
  }
);

// ==============================
// Export
// ==============================
module.exports = mongoose.model("Ticket", ticketSchema);
