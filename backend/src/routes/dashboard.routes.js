/**
 * Dashboard Routes (EcoSteps)
 * ------------------------------------------------------------
 * Este archivo expone métricas para:
 * - Dashboard de usuario (progreso, evidencias, actividades)
 * - Dashboard de admin (KPIs globales, top actividades, usuarios activos)
 *
 * Buenas prácticas aplicadas (sin romper lógica):
 * - `protect` para asegurar autenticación JWT
 * - Validación de rol dentro de cada endpoint
 * - Uso de `Promise.all` para paralelizar conteos
 * - Respuesta JSON estructurada para front (KPI + gráficas)
 * - Logs de error en servidor, mensajes genéricos al cliente
 *
 * Notas de consistencia:
 * - Constantes para horas: evita “magic numbers” y facilita cambios futuros.
 */

const express = require("express");
const Activity = require("../models/Activity");
const Evidence = require("../models/Evidence");
const Report = require("../models/Report");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * Constantes de negocio (reglas de Servicio Social)
 * - HOURS_PER_REPORT: horas que se acreditan por reporte aprobado
 * - TOTAL_HOURS: meta total de horas
 *
 * Buenas prácticas:
 * - Dejarlo como constantes hace el cálculo legible y centralizado.
 */
const HOURS_PER_REPORT = 160;
const TOTAL_HOURS = 480;

// =========================
// USER DASHBOARD
// GET /api/dashboard/user
// =========================
/**
 * Qué devuelve (para frontend):
 * - totalHours: horas acumuladas (cap a TOTAL_HOURS)
 * - progressPercent: avance % sobre TOTAL_HOURS
 * - evidences: conteo por status (pending/approved/rejected)
 * - activities: joined (inscritas), completed (actividades con evidencia approved)
 *
 * Seguridad:
 * - Requiere JWT (`protect`)
 * - Solo rol "user" (validación manual)
 *
 * Performance:
 * - Conteos de evidencias en paralelo (Promise.all)
 * - Aggregation para contar actividades completadas sin duplicar por evidencia
 */
router.get("/user", protect, async (req, res) => {
  try {
    // Control de acceso (solo users)
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo user" });
    }

    const userId = req.user._id;

    /**
     * Reportes aprobados:
     * - Se usa countDocuments para obtener el número sin traer documentos completos.
     */
    const approvedReports = await Report.countDocuments({
      user: userId,
      status: "approved",
    });

    /**
     * Cálculo de horas:
     * - totalHours topado a TOTAL_HOURS
     * - porcentaje redondeado para UI
     */
    const totalHours = Math.min(approvedReports * HOURS_PER_REPORT, TOTAL_HOURS);
    const progressPercent = Math.round((totalHours / TOTAL_HOURS) * 100);

    /**
     * Evidencias por status:
     * - Promise.all optimiza: 3 queries se ejecutan en paralelo
     */
    const [pendingEv, approvedEv, rejectedEv] = await Promise.all([
      Evidence.countDocuments({ user: userId, status: "pending" }),
      Evidence.countDocuments({ user: userId, status: "approved" }),
      Evidence.countDocuments({ user: userId, status: "rejected" }),
    ]);

    /**
     * Actividades inscritas:
     * - countDocuments sobre participants
     */
    const joinedActivities = await Activity.countDocuments({
      participants: userId,
    });

    /**
     * Actividades completadas:
     * - Se considera “completada” si existe AL MENOS una evidencia approved
     *   asociada a esa actividad para el usuario.
     * - Aggregate:
     *   1) match (user + approved)
     *   2) group por activity (distinct)
     *   3) count
     */
    const completedAgg = await Evidence.aggregate([
      { $match: { user: userId, status: "approved" } },
      { $group: { _id: "$activity" } },
      { $count: "completed" },
    ]);
    const completedActivities = completedAgg?.[0]?.completed || 0;

    /**
     * Respuesta:
     * - Incluye “Max” para que el frontend pueda renderizar barras / metas.
     * - approvedReportsMax: aquí lo fijas en 3 (480/160) para UI.
     */
    return res.status(200).json({
      totalHours,
      totalHoursMax: TOTAL_HOURS,
      approvedReports,
      approvedReportsMax: 3,
      hoursPerReport: HOURS_PER_REPORT,
      progressPercent,
      evidences: {
        pending: pendingEv,
        approved: approvedEv,
        rejected: rejectedEv,
      },
      activities: {
        joined: joinedActivities,
        completed: completedActivities,
      },
    });
  } catch (error) {
    console.error("USER DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Error al cargar dashboard user" });
  }
});

// =========================
// ADMIN DASHBOARD
// GET /api/dashboard/admin
// =========================
/**
 * Qué devuelve (para frontend):
 * - KPIs:
 *   - pendingReports, totalUsers
 *   - evidencias por status (pending/approved/rejected)
 *   - tickets por status (open/in_progress/resolved)
 * - Rankings:
 *   - topActivities (por número de participantes)
 *   - usersActive (top usuarios por cantidad de evidencias)
 *
 * Seguridad:
 * - JWT obligatorio (`protect`)
 * - Solo rol admin (validación manual)
 *
 * Performance:
 * - Promise.all para KPIs base
 * - Aggregates para rankings (reduce procesamiento del lado servidor)
 */
router.get("/admin", protect, async (req, res) => {
  try {
    // Control de acceso (solo admin)
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    /**
     * KPIs base:
     * - Conteos en paralelo para reducir latencia total
     */
    const [
      pendingReports,
      totalUsers,

      pendingEvidences,
      approvedEvidences,
      rejectedEvidences,

      openTickets,
      inProgressTickets,
      resolvedTickets,
    ] = await Promise.all([
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "user" }),

      Evidence.countDocuments({ status: "pending" }),
      Evidence.countDocuments({ status: "approved" }),
      Evidence.countDocuments({ status: "rejected" }),

      Ticket.countDocuments({ status: "open" }),
      Ticket.countDocuments({ status: "in_progress" }),
      Ticket.countDocuments({ status: "resolved" }),
    ]);

    /**
     * Top actividades por participantes:
     * - $project: calcula participantsCount sin depender de campo persistente
     * - $ifNull: evita error si participants no existe
     * - sort: más inscritos primero; luego fecha asc (desempate)
     */
    const topActivities = await Activity.aggregate([
      {
        $project: {
          titulo: 1,
          fecha: 1,
          estado: 1,
          cupoTotal: 1,
          participantsCount: { $size: { $ifNull: ["$participants", []] } },
        },
      },
      { $sort: { participantsCount: -1, fecha: 1 } },
      { $limit: 5 },
    ]);

    /**
     * Usuarios activos:
     * - Se define “activo” por cantidad de evidencias creadas (cualquier status).
     *
     * Aggregate:
     * - group por user y suma 1 por evidencia
     * - sort desc y top 5
     *
     * Nota: aquí hay un pequeño detalle de formato en tu código original:
     * - Lo dejo igual en lógica, solo comento:
     *   { $group: { _id: "$user", evidences: { $sum: 1 } }, },
     *   funciona, pero el bloque está un poco raro de llaves; ideal es mantenerlo limpio.
     */
    const topUsers = await Evidence.aggregate([
      {
        $group: { _id: "$user", evidences: { $sum: 1 } },
      },
      { $sort: { evidences: -1 } },
      { $limit: 5 },
    ]);

    /**
     * Enriquecer info de usuarios:
     * - Se hace un find con $in para traer nombre/apellido/email de esos topUsers.
     * - select limita campos (mejor performance + seguridad).
     */
    const usersInfo = await User.find({
      _id: { $in: topUsers.map((u) => u._id) },
    }).select("nombre apellido email");

    /**
     * Merge:
     * - Se junta el resultado del aggregate (conteo evidences)
     *   con la información del usuario.
     *
     * Nota:
     * - Si algún usuario no se encuentra (edge case), se pone fallback.
     */
    const usersActive = topUsers.map((u) => {
      const info = usersInfo.find((x) => x._id.toString() === u._id.toString());
      return {
        userId: u._id,
        nombre: info ? `${info.nombre} ${info.apellido}` : "Usuario",
        email: info?.email || "",
        evidences: u.evidences,
      };
    });

    /**
     * Respuesta final:
     * - Datos listos para KPIs y gráficas en admin dashboard.
     */
    return res.status(200).json({
      pendingReports,
      totalUsers,

      // ✅ evidencias por status (para gráficas)
      pendingEvidences,
      approvedEvidences,
      rejectedEvidences,

      // ✅ tickets (para KPI + gráficas)
      openTickets,
      inProgressTickets,
      resolvedTickets,

      topActivities,
      usersActive,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Error al cargar dashboard admin" });
  }
});

module.exports = router;
