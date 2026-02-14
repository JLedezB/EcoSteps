// ==============================
// validators.js
// Helpers de validación y sanitización
// ==============================

const mongoose = require("mongoose");

// ==============================
// validateObjectId
// Evita CastError: "Cast to ObjectId failed"
// Uso:
//   router.get("/:id", validateObjectId("id"), ...)
// ==============================
const validateObjectId = (paramName) => (req, res, next) => {
  const value = req.params?.[paramName];

  if (!value) {
    return res.status(400).json({
      message: `Falta parámetro :${paramName}`,
    });
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      message: `Id inválido en :${paramName}`,
    });
  }

  return next();
};

// ==============================
// sanitizeString
// - Convierte a string
// - Trim
// - Limita longitud (anti payload gigante)
// ==============================
const sanitizeString = (val, max = 500) => {
  if (val === undefined || val === null) return "";
  return String(val).trim().slice(0, max);
};

// ==============================
// sanitizeNumber
// - Convierte a Number
// - Valida min / max
// ==============================
const sanitizeNumber = (val, { min = -Infinity, max = Infinity } = {}) => {
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  if (n < min) return null;
  if (n > max) return null;
  return n;
};

// ==============================
// validateRequiredBody
// Asegura que existan campos requeridos
// ==============================
const validateRequiredBody = (fields = []) => (req, res, next) => {
  const missing = [];

  for (const f of fields) {
    const v = req.body?.[f];
    if (v === undefined || v === null || String(v).trim() === "") {
      missing.push(f);
    }
  }

  if (missing.length) {
    return res.status(400).json({
      message: `Faltan campos: ${missing.join(", ")}`,
    });
  }

  return next();
};

// ==============================
// Export
// ==============================
module.exports = {
  validateObjectId,
  sanitizeString,
  sanitizeNumber,
  validateRequiredBody,
};
