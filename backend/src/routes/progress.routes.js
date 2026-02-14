/**
 * Progress Routes (EcoSteps)
 * ------------------------------------------------------------
 * Este archivo calcula el progreso de Servicio Social basado en:
 * - Reportes bimestrales aprobados (cada bimestre = 160 horas)
 * - Total requerido = 480 horas (3 periodos)
 *
 * Endpoints:
 * - GET /api/progress/me        -> progreso del usuario autenticado
 * - GET /api/progress/user/:id  -> (admin) progreso de cualquier usuario
 *
 * Buenas prácticas aplicadas (sin cambiar lógica):
 * - `protect` para exigir autenticación JWT
 * - Chequeo de rol admin en endpoint administrativo
 * - Cálculos con constantes (no "magic numbers")
 * - Respuesta estructurada para UI (percent, completed, sections, reports)
 * - Logs de error en servidor con mensajes genéricos al cliente
 */

const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const BimestralReport = require("../models/BimestralReport");

const router = express.Router();

/**
 * Constantes de negocio:
 * - TOTAL_HOURS: horas totales requeridas
 * - BIMESTER_HOURS: horas por reporte bimestral aprobado
 * - PERIODS: periodos esperados (para UI tipo checklist)
 */
const TOTAL_HOURS = 480;
const BIMESTER_HOURS = 160;
const PERIODS = [1, 2, 3];

/**
 * =========================
 * USER: obtener mi progreso
 * GET /api/progress/me
 * =========================
 *
 * Qué hace:
 * - Busca reportes del usuario autenticado
 * - Cuenta periodos aprobados (status === "approved")
 * - Calcula horas acumuladas (cap a TOTAL_HOURS)
 * - Devuelve:
 *   - approvedCount, hours, percent, completed
 *   - sections: boolean por periodo (p1..p3) para UI
 *   - reports: lista (para detalle en UI)
 *
 * Seguridad:
 * - `protect` valida JWT y coloca el usuario en `req.user`
 *
 * Nota:
 * - Este endpoint funciona también para admin si quieres mostrar "mi propio" progreso.
 */
router.get("/me", protect, async (req, res) => {
  try {
    /**
     * Query:
     * - find por userId
     * - select limita campos (menor payload, menor riesgo)
     */
    const reports = await BimestralReport.find({ user: req.user._id }).select(
      "period status createdAt reviewedAt"
    );

    /**
     * approved:
     * - Usas Set para quedarte con periodos únicos aprobados
     * - Evita duplicar si por alguna razón hay más de un reporte por periodo
     */
    const approved = new Set(
      reports.filter((r) => r.status === "approved").map((r) => r.period)
    );

    /**
     * sections:
     * - Array [b1,b2,b3] => true/false según si ese periodo está aprobado
     * - Esto simplifica el frontend (checkmarks / stepper)
     */
    const sections = PERIODS.map((p) => approved.has(p));

    // Conteos y cálculos de progreso
    const approvedCount = approved.size;
    const hours = Math.min(approvedCount * BIMESTER_HOURS, TOTAL_HOURS);

    // Porcentaje para UI (redondeado)
    const percent = Math.round((hours / TOTAL_HOURS) * 100);

    // Bandera booleana para indicar cumplimiento total
    const completed = hours >= TOTAL_HOURS;

    return res.status(200).json({
      totalHours: TOTAL_HOURS,
      bimestralHours: BIMESTER_HOURS,
      approvedCount,
      hours,
      percent,
      completed,
      sections, // [b1,b2,b3] true/false
      reports,  // útil para mostrar detalle (fechas, status)
    });
  } catch (error) {
    console.error("PROGRESS ME ERROR:", error);
    return res.status(500).json({ message: "Error al obtener progreso" });
  }
});

/**
 * =========================
 * ADMIN: ver progreso de un usuario
 * GET /api/progress/user/:userId
 * =========================
 *
 * Qué hace:
 * - Igual que /me pero para un usuario objetivo
 *
 * Seguridad:
 * - `protect` + validación explícita de rol "admin"
 *
 * Nota (mejora segura):
 * - Podrías validar que userId sea ObjectId válido con tu middleware validateObjectId,
 *   pero no lo agrego para no cambiar tu composición actual.
 */
router.get("/user/:userId", protect, async (req, res) => {
  try {
    // Control de acceso (solo admin)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { userId } = req.params;

    // Traer reportes del usuario objetivo (campos mínimos)
    const reports = await BimestralReport.find({ user: userId }).select(
      "period status createdAt reviewedAt"
    );

    // Periodos aprobados únicos
    const approved = new Set(
      reports.filter((r) => r.status === "approved").map((r) => r.period)
    );

    // Checklist por periodo
    const sections = PERIODS.map((p) => approved.has(p));

    // Cálculos
    const approvedCount = approved.size;
    const hours = Math.min(approvedCount * BIMESTER_HOURS, TOTAL_HOURS);
    const percent = Math.round((hours / TOTAL_HOURS) * 100);
    const completed = hours >= TOTAL_HOURS;

    return res.status(200).json({
      totalHours: TOTAL_HOURS,
      bimestralHours: BIMESTER_HOURS,
      approvedCount,
      hours,
      percent,
      completed,
      sections,
      reports,
    });
  } catch (error) {
    console.error("PROGRESS USER ERROR:", error);
    return res.status(500).json({ message: "Error al obtener progreso del usuario" });
  }
});

module.exports = router;
