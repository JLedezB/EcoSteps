// ==============================
// Report.model.js
// Modelo de Reporte Bimestral
// ==============================

const mongoose = require("mongoose");

// ==============================
// Schema
// ==============================
const reportSchema = new mongoose.Schema(
  {
    // ==========================
    // Relación
    // ==========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================
    // Periodo / Horas
    // ==========================
    bimestre: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    // Cada reporte aprobado suma 160 horas
    hours: {
      type: Number,
      default: 160,
    },

    // ==========================
    // Archivo (Supabase / Storage)
    // ==========================
    fileUrl: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
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
    // Estado de revisión
    // ==========================
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // ==========================
    // Control contable
    // ==========================
    // Evita que un reporte aprobado sume horas más de una vez
    credited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ==============================
// Export
// ==============================
module.exports = mongoose.model("Report", reportSchema);
