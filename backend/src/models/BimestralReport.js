// ==============================
// BimestralReport.model.js
// Modelo de Reporte Bimestral
// ==============================

const mongoose = require("mongoose");

// ==============================
// Schema
// ==============================
const bimestralReportSchema = new mongoose.Schema(
  {
    // ==========================
    // Relación
    // ==========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================
    // Periodo (bimestre)
    // Cada periodo equivale a 160h
    // ==========================
    period: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    // ==========================
    // Archivo (Supabase Storage)
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
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    // ==========================
    // Notas opcionales del usuario
    // ==========================
    notes: {
      type: String,
      default: "",
    },

    // ==========================
    // Revisión administrativa
    // ==========================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ==============================
// Índices
// ==============================

// ❗ Evita duplicar reportes por usuario y periodo
// (1 reporte por bimestre por usuario)
bimestralReportSchema.index(
  { user: 1, period: 1 },
  { unique: true }
);

// ==============================
// Export
// ==============================
module.exports = mongoose.model(
  "BimestralReport",
  bimestralReportSchema
);
