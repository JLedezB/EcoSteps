// ==============================
// Activity.model.js
// Modelo de Actividad
// ==============================

const mongoose = require("mongoose");

// ==============================
// Activity Schema
// ==============================
const activitySchema = new mongoose.Schema(
  {
    // ==========================
    // Información básica
    // ==========================
    titulo: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      required: true,
      trim: true,
    },

    fecha: {
      type: Date,
      required: true,
    },

    lugar: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // Cupos
    // ==========================
    cupoTotal: {
      type: Number,
      required: true,
      min: 1,
    },

    cupoDisponible: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================
    // Estado de la actividad
    // ==========================
    estado: {
      type: String,
      enum: ["activa", "cerrada"],
      default: "activa",
    },

    // ==========================
    // Participantes inscritos
    // ==========================
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    // ==========================
    // Auditoría
    // ==========================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ==============================
// Export
// ==============================
module.exports = mongoose.model("Activity", activitySchema);
