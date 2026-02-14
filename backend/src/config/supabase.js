// ==============================
// supabase.js
// Cliente Supabase (Service Role)
// ==============================

const { createClient } = require("@supabase/supabase-js");

// ==============================
// Variables de entorno
// ==============================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ==============================
// Validación obligatoria
// ==============================
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env");
}

// ==============================
// Inicialización del cliente
// ⚠️ Usa SERVICE ROLE (solo backend)
// ==============================
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// ==============================
// Export
// ==============================
module.exports = supabase;
