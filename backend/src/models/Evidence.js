// ==============================
// Evidence.model.js
// Modelo de Evidencia de Actividad
// ==============================

const mongoose = require("mongoose");

// ==============================
// Schema
// ==============================
const evidenceSchema = new mongoose.Schema(
  {
    // ==========================
    // Relaciones
    // ==========================
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================
    // Archivo (Firebase Storage)
    // ==========================
    fileUrl: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true, // bucket/path
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      default: "",
    },

    size: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Información adicional
    // ==========================
    caption: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // Estado de revisión
    // ==========================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ==============================
// Índices
// ==============================

// ❗ Evita evidencias duplicadas exactas
// (mismo usuario + actividad + archivo)
evidenceSchema.index(
  { activity: 1, user: 1, filePath: 1 },
  { unique: true }
);

// ==============================
// Export
// ==============================
module.exports = mongoose.model("Evidence", evidenceSchema);
