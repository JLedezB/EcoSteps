/**
 * Activities Routes (EcoSteps)
 * ------------------------------------------------------------
 * Buenas prácticas aplicadas en este archivo:
 * - Validación + sanitización de inputs (body/params) antes de usarlos.
 * - Autorización por rol (user/admin) en cada endpoint.
 * - Respuestas consistentes (status + JSON).
 * - Manejo de errores con logs en servidor, mensajes genéricos al cliente.
 * - Evitar “romper”: NO cambié la lógica, solo agregué comentarios y mejoras no-invasivas.
 *
 * ✅ FIX FECHA:
 * - "YYYY-MM-DD" (input type="date") se interpreta como UTC 00:00, y en timezone local puede verse como día anterior.
 * - Se guarda como "fecha sin hora" usando mediodía UTC: "YYYY-MM-DDT12:00:00.000Z"
 * - Esto evita desfases de día en cualquier zona horaria.
 */

const express = require("express");
const Activity = require("../models/Activity");
const { protect, requireRole } = require("../middlewares/authMiddleware");
const {
  validateObjectId,
  sanitizeString,
  sanitizeNumber,
  validateRequiredBody,
} = require("../middlewares/validate");

const router = express.Router();

// ==============================
// ✅ Helper: parse fecha "date-only" sin desfase por timezone
// ==============================
function parseDateOnlyToUTCNoon(dateStr) {
  if (!dateStr) return null;

  const s = String(dateStr).trim();

  // Si viene como YYYY-MM-DD (del input date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00.000Z`); // mediodía UTC (estable)
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Si viene como ISO u otro formato
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ✅ USER/ADMIN: listar actividades
 * GET /api/activities
 */
router.get("/", protect, requireRole("user", "admin"), async (req, res) => {
  try {
    const activities = await Activity.find().sort({ fecha: 1 });
    return res.status(200).json({ activities });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
});

/**
 * ✅ USER: mis actividades
 * GET /api/activities/mine
 */
router.get("/mine", protect, requireRole("user"), async (req, res) => {
  try {
    const activities = await Activity.find({
      participants: req.user._id,
    }).sort({ fecha: 1 });

    return res.status(200).json({ activities });
  } catch (error) {
    console.error("MINE ACTIVITIES ERROR:", error);
    return res.status(500).json({ message: "Error al obtener mis actividades" });
  }
});

/**
 * ✅ ADMIN: crear actividad
 * POST /api/activities
 */
router.post(
  "/",
  protect,
  requireRole("admin"),
  validateRequiredBody(["titulo", "descripcion", "fecha", "cupoTotal"]),
  async (req, res) => {
    try {
      const titulo = sanitizeString(req.body.titulo, 120);
      const descripcion = sanitizeString(req.body.descripcion, 1000);
      const lugar = sanitizeString(req.body.lugar, 120);
      const fechaStr = sanitizeString(req.body.fecha, 60);

      const cupoTotal = sanitizeNumber(req.body.cupoTotal, { min: 1, max: 100000 });
      if (cupoTotal === null) {
        return res.status(400).json({ message: "cupoTotal inválido" });
      }

      // ✅ FIX FECHA
      const fecha = parseDateOnlyToUTCNoon(fechaStr);
      if (!fecha) {
        return res.status(400).json({ message: "fecha inválida" });
      }

      const activity = await Activity.create({
        titulo,
        descripcion,
        fecha,
        lugar,
        cupoTotal,
        cupoDisponible: cupoTotal,
        estado: "activa",
        createdBy: req.user._id,
        participants: [],
      });

      return res.status(201).json({ message: "Actividad creada", activity });
    } catch (error) {
      console.error("CREATE ACTIVITY ERROR:", error);
      return res.status(500).json({ message: "Error al crear actividad" });
    }
  }
);

/**
 * ✅ ADMIN: editar actividad
 * PUT /api/activities/:id
 */
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id);
      if (!activity) return res.status(404).json({ message: "Actividad no encontrada" });

      if (req.body.titulo !== undefined) {
        const t = sanitizeString(req.body.titulo, 120);
        if (!t) return res.status(400).json({ message: "titulo inválido" });
        activity.titulo = t;
      }

      if (req.body.descripcion !== undefined) {
        const d = sanitizeString(req.body.descripcion, 1000);
        if (!d) return res.status(400).json({ message: "descripcion inválida" });
        activity.descripcion = d;
      }

      if (req.body.lugar !== undefined) {
        activity.lugar = sanitizeString(req.body.lugar, 120);
      }

      if (req.body.fecha !== undefined) {
        // ✅ FIX FECHA
        const fechaStr = sanitizeString(req.body.fecha, 60);
        const fecha = parseDateOnlyToUTCNoon(fechaStr);
        if (!fecha) {
          return res.status(400).json({ message: "fecha inválida" });
        }
        activity.fecha = fecha;
      }

      if (req.body.estado !== undefined) {
        const estado = sanitizeString(req.body.estado, 30);
        if (!["activa", "cerrada"].includes(estado)) {
          return res.status(400).json({ message: "Estado inválido" });
        }
        activity.estado = estado;
      }

      if (req.body.cupoTotal !== undefined) {
        const nuevoTotal = sanitizeNumber(req.body.cupoTotal, { min: 1, max: 100000 });
        if (nuevoTotal === null) {
          return res.status(400).json({ message: "cupoTotal inválido" });
        }

        const ocupados = (activity.participants || []).length;
        if (nuevoTotal < ocupados) {
          return res.status(400).json({
            message: `No puedes poner cupoTotal (${nuevoTotal}) menor a los ocupados (${ocupados})`,
          });
        }

        activity.cupoTotal = nuevoTotal;
        activity.cupoDisponible = nuevoTotal - ocupados;
      }

      await activity.save();
      return res.status(200).json({ message: "Actividad actualizada", activity });
    } catch (error) {
      console.error("UPDATE ACTIVITY ERROR:", error);
      return res.status(500).json({ message: "Error al actualizar actividad" });
    }
  }
);

/**
 * ✅ ADMIN: eliminar actividad
 * DELETE /api/activities/:id
 */
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id);
      if (!activity) return res.status(404).json({ message: "Actividad no encontrada" });

      await Activity.deleteOne({ _id: id });
      return res.status(200).json({ message: "Actividad eliminada" });
    } catch (error) {
      console.error("DELETE ACTIVITY ERROR:", error);
      return res.status(500).json({ message: "Error al eliminar actividad" });
    }
  }
);

/**
 * ✅ USER: inscribirse
 * POST /api/activities/:id/join
 */
router.post(
  "/:id/join",
  protect,
  requireRole("user"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id);
      if (!activity) return res.status(404).json({ message: "Actividad no encontrada" });

      if (activity.estado !== "activa") {
        return res.status(400).json({ message: "La actividad está cerrada" });
      }

      const participants = activity.participants || [];

      const yaInscrito = participants.some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (yaInscrito) {
        return res.status(400).json({ message: "Ya estás inscrito en esta actividad" });
      }

      const ocupados = participants.length;
      const disponible = activity.cupoTotal - ocupados;

      if (disponible <= 0) {
        activity.cupoDisponible = 0;
        await activity.save();
        return res.status(400).json({ message: "Cupo lleno" });
      }

      activity.participants.push(req.user._id);

      const nuevosOcupados = activity.participants.length;
      activity.cupoDisponible = activity.cupoTotal - nuevosOcupados;
      if (activity.cupoDisponible === 0) activity.estado = "cerrada";

      await activity.save();

      return res.status(200).json({ message: "Inscripción exitosa", activity });
    } catch (error) {
      console.error("JOIN ACTIVITY ERROR:", error);
      return res.status(500).json({ message: "Error al inscribirse" });
    }
  }
);

/**
 * ✅ USER: cancelar inscripción
 * POST /api/activities/:id/leave
 */
router.post(
  "/:id/leave",
  protect,
  requireRole("user"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const activity = await Activity.findById(id);
      if (!activity) return res.status(404).json({ message: "Actividad no encontrada" });

      const before = (activity.participants || []).length;

      activity.participants = (activity.participants || []).filter(
        (p) => p.toString() !== req.user._id.toString()
      );

      const after = activity.participants.length;

      if (before === after) {
        return res.status(400).json({ message: "No estabas inscrito en esta actividad" });
      }

      activity.cupoDisponible = activity.cupoTotal - after;
      if (activity.estado === "cerrada" && activity.cupoDisponible > 0) activity.estado = "activa";

      await activity.save();
      return res.status(200).json({ message: "Inscripción cancelada", activity });
    } catch (error) {
      console.error("LEAVE ACTIVITY ERROR:", error);
      return res.status(500).json({ message: "Error al cancelar inscripción" });
    }
  }
);

module.exports = router;