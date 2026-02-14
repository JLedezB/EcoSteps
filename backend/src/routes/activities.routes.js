/**
 * Activities Routes (EcoSteps)
 * ------------------------------------------------------------
 * Buenas prácticas aplicadas en este archivo:
 * - Validación + sanitización de inputs (body/params) antes de usarlos.
 * - Autorización por rol (user/admin) en cada endpoint.
 * - Respuestas consistentes (status + JSON).
 * - Manejo de errores con logs en servidor, mensajes genéricos al cliente.
 * - Evitar “romper”: NO cambié la lógica, solo agregué comentarios y mejoras no-invasivas.
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

/**
 * ✅ USER/ADMIN: listar actividades
 * GET /api/activities
 *
 * Qué hace:
 * - Devuelve TODAS las actividades (para user y admin).
 *
 * Seguridad:
 * - `protect`: requiere JWT válido.
 * - `requireRole("user","admin")`: restringe por rol.
 *
 * Notas:
 * - Ordena por fecha ascendente para mostrar las próximas primero.
 */
router.get("/", protect, requireRole("user", "admin"), async (req, res) => {
  try {
    const activities = await Activity.find().sort({ fecha: 1 });
    return res.status(200).json({ activities });
  } catch (error) {
    // Buena práctica: no exponer el error completo al cliente.
    return res.status(500).json({ message: "Error al obtener actividades" });
  }
});

/**
 * ✅ USER: mis actividades
 * GET /api/activities/mine
 *
 * Qué hace:
 * - Devuelve únicamente las actividades donde el usuario autenticado está inscrito.
 *
 * Seguridad:
 * - `protect`: requiere JWT.
 * - `requireRole("user")`: solo usuarios (no admin).
 *
 * Notas:
 * - Busca por `participants: req.user._id`.
 */
router.get("/mine", protect, requireRole("user"), async (req, res) => {
  try {
    const activities = await Activity.find({
      participants: req.user._id,
    }).sort({ fecha: 1 });

    return res.status(200).json({ activities });
  } catch (error) {
    // Log útil para debugging en servidor
    console.error("MINE ACTIVITIES ERROR:", error);
    return res.status(500).json({ message: "Error al obtener mis actividades" });
  }
});

/**
 * ✅ ADMIN: crear actividad
 * POST /api/activities
 *
 * Requiere body:
 * - titulo, descripcion, fecha, cupoTotal
 *
 * Sanitización/validación:
 * - Strings: sanitizeString con límites (evita payloads enormes, espacios raros, etc.)
 * - Números: sanitizeNumber con rango (evita NaN, negativos, etc.)
 * - Fecha: se parsea con Date y se valida que no sea inválida.
 *
 * Lógica:
 * - cupoDisponible inicia igual que cupoTotal
 * - estado inicia como "activa"
 * - participants vacío
 */
router.post(
  "/",
  protect,
  requireRole("admin"),
  validateRequiredBody(["titulo", "descripcion", "fecha", "cupoTotal"]),
  async (req, res) => {
    try {
      // Sanitizar strings para evitar entradas vacías, demasiado largas, o con basura.
      const titulo = sanitizeString(req.body.titulo, 120);
      const descripcion = sanitizeString(req.body.descripcion, 1000);
      const lugar = sanitizeString(req.body.lugar, 120);
      const fechaStr = sanitizeString(req.body.fecha, 60);

      // Sanitizar/validar número con límites razonables
      const cupoTotal = sanitizeNumber(req.body.cupoTotal, { min: 1, max: 100000 });
      if (cupoTotal === null) {
        return res.status(400).json({ message: "cupoTotal inválido" });
      }

      // Parsear fecha y validar que sea un Date válido
      const fecha = new Date(fechaStr);
      if (Number.isNaN(fecha.getTime())) {
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
        createdBy: req.user._id, // admin creador
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
 *
 * Qué hace:
 * - Permite actualizar campos de una actividad (solo admin).
 *
 * Validación:
 * - validateObjectId("id"): asegura que :id sea un ObjectId válido.
 *
 * Buenas prácticas:
 * - Solo actualiza los campos si vienen en el body (patch-like).
 * - Recalcula cupoDisponible al cambiar cupoTotal usando ocupados reales.
 * - Valida estado contra una lista permitida.
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

      // Sanitizar updates (solo si vienen)
      // Nota: usar !== undefined permite aceptar strings vacíos *solo si* sanitizeString lo permite.
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
        // Si tu sanitizeString devuelve "" cuando es inválido, esto permitiría setear "".
        // Si eso te preocupa, valida igual que con titulo/descripcion.
        activity.lugar = sanitizeString(req.body.lugar, 120);
      }

      if (req.body.fecha !== undefined) {
        const fecha = new Date(sanitizeString(req.body.fecha, 60));
        if (Number.isNaN(fecha.getTime())) {
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

        // Ocupados reales: tamaño de participants (evita inconsistencias)
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
 *
 * Qué hace:
 * - Borra una actividad por id.
 *
 * Buenas prácticas:
 * - Revisa existencia antes de borrar para responder 404.
 * - `deleteOne({ _id: id })` ejecuta la eliminación.
 *
 * Nota:
 * - Podrías borrar directo sin findById, pero así das mensaje más claro.
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
 *
 * Qué hace:
 * - Inscribe al usuario autenticado en la actividad si:
 *   1) Existe
 *   2) Está "activa"
 *   3) No está ya inscrito
 *   4) Hay cupo disponible
 *
 * Lógica de cupo:
 * - cupoDisponible se recalcula en base a cupoTotal - ocupados
 * - si llega a 0, se marca actividad como "cerrada"
 *
 * Nota:
 * - Esto no es transaccional; con mucha concurrencia podrían colarse 2 joins a la vez.
 *   Si lo necesitas a futuro, se resuelve con update atómico / transacciones.
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

      // Comparación robusta: ObjectId -> string
      const yaInscrito = participants.some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (yaInscrito) {
        return res.status(400).json({ message: "Ya estás inscrito en esta actividad" });
      }

      // Recalcular cupo en base a participantes actuales
      const ocupados = participants.length;
      const disponible = activity.cupoTotal - ocupados;

      if (disponible <= 0) {
        // Mantener consistencia: si ya no hay cupo, persistir cupoDisponible=0
        activity.cupoDisponible = 0;
        await activity.save();
        return res.status(400).json({ message: "Cupo lleno" });
      }

      // Inscribir
      activity.participants.push(req.user._id);

      // Recalcular y actualizar estado si se llenó
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
 *
 * Qué hace:
 * - Quita al usuario autenticado de participants si estaba inscrito.
 * - Recalcula cupoDisponible.
 * - Si la actividad estaba "cerrada" pero se liberó cupo, se reabre a "activa".
 *
 * Buenas prácticas:
 * - Checa before/after para saber si realmente se removió algo.
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

      // Filtrar quitando al usuario actual
      activity.participants = (activity.participants || []).filter(
        (p) => p.toString() !== req.user._id.toString()
      );

      const after = activity.participants.length;

      if (before === after) {
        // No se removió nada: el usuario no estaba inscrito
        return res.status(400).json({ message: "No estabas inscrito en esta actividad" });
      }

      // Recalcular cupo y reabrir si aplica
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
