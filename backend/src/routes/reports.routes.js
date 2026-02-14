/**
 * Reports Routes (EcoSteps)
 * ------------------------------------------------------------
 * Este archivo maneja reportes bimestrales (PDF o imagen) con flujo:
 * - USER: subir reporte (status inicial pending)
 * - USER: ver mis reportes
 * - USER: ver progreso (barra) basado en campos del User
 * - ADMIN: listar reportes pendientes
 * - ADMIN: cambiar status (approved/rejected/pending) y acreditar horas si aprueba
 *
 * Buenas prácticas aplicadas (sin cambiar lógica):
 * - `protect` para autenticar con JWT
 * - Validación de rol (user/admin) por endpoint
 * - Multer en memoria con límites + fileFilter por MIME
 * - Nombres de archivo “seguros” (safeName)
 * - Estructura consistente de respuestas JSON
 * - Logs detallados en servidor, mensajes genéricos en cliente
 *
 * Nota:
 * - Si Multer falla (fileFilter o fileSize), se requiere un error handler global
 *   para devolver 400. (Aquí solo se comenta para no alterar tu flujo.)
 */

const express = require("express");
const multer = require("multer");

const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");
const supabase = require("../config/supabase");

const router = express.Router();

/**
 * Configuración Multer (subida de archivos)
 * - memoryStorage: no escribe a disco, ideal para subir directo a Supabase
 * - limits.fileSize: 10MB máximo
 * - fileFilter: solo PDF o imágenes (jpg/png/webp)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(file.mimetype);

    if (!ok) return cb(new Error("Solo PDF o imágenes (jpg, png, webp)"));
    cb(null, true);
  },
});

/**
 * safeName
 * - Normaliza nombre para evitar caracteres raros / inseguros
 * - Mantiene longitud acotada
 */
const safeName = (name = "file") => name.replace(/[^\w.\-]/g, "_").slice(0, 120);

/**
 * =========================
 * ✅ USER: subir reporte bimestral
 * POST /api/reports/upload
 * =========================
 *
 * Requiere:
 * - multipart/form-data
 * - file (campo "file")
 * - bimestre (1, 2 o 3)
 *
 * Reglas de negocio:
 * - Solo usuarios (role user)
 * - No permitir duplicados si ya existe reporte pending/approved en ese bimestre
 *
 * Storage:
 * - Bucket por env (SUPABASE_BUCKET) o fallback "EcoSteps"
 * - filePath organizado por usuario y bimestre
 *
 * DB:
 * - Crea Report con status "pending" y credited=false (para acreditar horas una sola vez)
 */
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    // Control de acceso: solo usuarios
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const { bimestre } = req.body;
    const b = Number(bimestre);

    // Validación: solo bimestres permitidos
    if (![1, 2, 3].includes(b)) {
      return res.status(400).json({ message: "Bimestre inválido (1,2,3)" });
    }

    // Archivo requerido
    if (!req.file) return res.status(400).json({ message: "Falta archivo (file)" });

    /**
     * Evitar duplicados:
     * - Si existe un reporte del mismo bimestre en pending/approved, bloquea.
     * - Esto permite que si el anterior fue rejected, el user pueda reenviar.
     */
    const exists = await Report.findOne({
      user: req.user._id,
      bimestre: b,
      status: { $in: ["pending", "approved"] },
    });

    if (exists) {
      return res.status(400).json({
        message: `Ya tienes un reporte del Bimestre ${b} en estado ${exists.status}.`,
      });
    }

    /**
     * Bucket:
     * - configurable por env
     * - fallback "EcoSteps"
     *
     * Nota: Asegúrate de que ese bucket exista en Supabase Storage.
     */
    const bucket = process.env.SUPABASE_BUCKET || "EcoSteps";

    /**
     * Extensión derivada de MIME:
     * - No confiar en el nombre original del archivo.
     */
    const ext =
      req.file.mimetype === "application/pdf"
        ? "pdf"
        : req.file.mimetype === "image/png"
        ? "png"
        : req.file.mimetype === "image/webp"
        ? "webp"
        : "jpg";

    /**
     * fileName y filePath:
     * - fileName: userId + bimestre + timestamp
     * - filePath: jerarquía por user y bimestre para facilitar búsquedas y limpieza
     */
    const fileName = safeName(`${req.user._id}_b${b}_${Date.now()}.${ext}`);
    const filePath = `reports/${req.user._id}/bimestre_${b}/${fileName}`;

    /**
     * Upload a Supabase Storage
     * - upsert:false evita sobreescritura accidental
     * - contentType correcto para descargas/preview
     */
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("SUPABASE REPORT UPLOAD ERROR:", uploadError);
      return res.status(500).json({ message: "Error al subir reporte a Storage" });
    }

    /**
     * Obtener URL pública:
     * - getPublicUrl normalmente retorna { data: { publicUrl } }
     * - Validamos existencia
     */
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const fileUrl = publicData?.publicUrl;

    if (!fileUrl) {
      return res
        .status(500)
        .json({ message: "No se pudo obtener URL pública del reporte" });
    }

    /**
     * Crear Report en BD:
     * - hours fijo 160 por bimestre
     * - credited=false para evitar duplicar acreditación al aprobar
     * - status inicial pending
     */
    const report = await Report.create({
      user: req.user._id,
      bimestre: b,
      hours: 160,
      fileUrl,
      filePath: `${bucket}/${filePath}`,
      fileName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "pending",
      credited: false,
    });

    return res.status(201).json({ message: "Reporte enviado (pendiente)", report });
  } catch (error) {
    console.error("UPLOAD REPORT ERROR:", error);
    return res.status(500).json({ message: "Error al subir reporte", error: error.message });
  }
});

/**
 * =========================
 * ✅ USER: ver mis reportes
 * GET /api/reports/mine
 * =========================
 *
 * Qué hace:
 * - Lista reportes del usuario autenticado
 * - Ordena más recientes primero
 */
router.get("/mine", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ reports });
  } catch (error) {
    console.error("MINE REPORTS ERROR:", error);
    return res.status(500).json({ message: "Error al obtener reportes" });
  }
});

/**
 * =========================
 * ✅ USER: progreso (barra)
 * GET /api/reports/progress
 * =========================
 *
 * Qué hace:
 * - Devuelve progreso basado en campos guardados en User:
 *   - bimestersApproved, serviceHours, serviceCompleted
 *
 * Nota de diseño:
 * - Aquí el progreso NO se recalcula desde Report; se confía en el User.
 * - Eso está bien para UI rápida, siempre que admin/status actualice esos campos (lo haces).
 */
router.get("/progress", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const user = await User.findById(req.user._id);
    return res.status(200).json({
      totalHours: 480,
      segmentHours: 160,
      bimestersApproved: user.bimestersApproved || 0,
      serviceHours: user.serviceHours || 0,
      serviceCompleted: !!user.serviceCompleted,
    });
  } catch (error) {
    console.error("PROGRESS ERROR:", error);
    return res.status(500).json({ message: "Error al obtener progreso" });
  }
});

/**
 * =========================
 * ✅ ADMIN: listar reportes pendientes
 * GET /api/reports/pending
 * =========================
 *
 * Qué hace:
 * - Lista reportes con status pending
 * - populate del usuario (campos mínimos)
 *
 * Seguridad:
 * - Solo admin
 */
router.get("/pending", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const reports = await Report.find({ status: "pending" })
      .populate("user", "nombre apellido email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error("PENDING REPORTS ERROR:", error);
    return res.status(500).json({ message: "Error al obtener reportes pendientes" });
  }
});

/**
 * =========================
 * ✅ ADMIN: aprobar/rechazar reporte
 * PATCH /api/reports/:id/status
 * =========================
 *
 * Requiere:
 * - body.status en ["approved","rejected","pending"]
 *
 * Qué hace:
 * - Actualiza status del Report
 * - Si pasa a approved y aún no estaba acreditado (credited=false):
 *   - Incrementa bimestersApproved (cap 3)
 *   - Calcula serviceHours = bimestersApproved * 160
 *   - Marca serviceCompleted si llega a 3
 *   - Marca report.credited = true para evitar duplicar horas
 *
 * Nota:
 * - Si después lo regresan a pending/rejected, NO restas horas (como comentas).
 *   Eso mantiene historial estable, pero puede dejar horas “infladas” si se des-aprueba.
 *   Para restar correctamente se necesita auditoría o recalcular desde Report aprobados.
 */
router.patch("/:id/status", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validación de whitelist: evita estados arbitrarios
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Reporte no encontrado" });

    report.status = status;

    /**
     * Acreditación:
     * - Solo cuando se aprueba y credited=false
     * - Evita acreditar 2 veces si se vuelve a aprobar el mismo reporte
     */
    if (status === "approved" && !report.credited) {
      const user = await User.findById(report.user);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      // Cap a 3 bimestres (480 hrs)
      const current = user.bimestersApproved || 0;
      const next = Math.min(3, current + 1);

      user.bimestersApproved = next;
      user.serviceHours = next * 160;
      user.serviceCompleted = next >= 3;

      await user.save();

      report.credited = true;
    }

    // Nota de negocio:
    // - Si se baja a pending/rejected, no se “des-acredita” (mantienes historial).
    // - Si a futuro quieres reversión, hay que agregar lógica + auditoría.

    await report.save();

    return res.status(200).json({ message: "Estado actualizado", report });
  } catch (error) {
    console.error("UPDATE REPORT STATUS ERROR:", error);
    return res.status(500).json({ message: "Error al actualizar reporte", error: error.message });
  }
});

module.exports = router;
