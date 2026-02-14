/**
 * Evidence Routes (EcoSteps)
 * ------------------------------------------------------------
 * Este archivo maneja:
 * - USER: subir evidencia (imagen) a Supabase Storage + crear registro Evidence
 * - USER: ver mis evidencias
 * - ADMIN: ver evidencias por actividad
 * - ADMIN: cambiar status de evidencia
 *
 * Buenas prácticas usadas aquí (sin cambiar lógica):
 * - `protect` + `requireRole` por endpoint
 * - Validación/sanitización de inputs (params y body)
 * - Multer en memoria con límites + fileFilter por MIME
 * - Nombres de archivos “seguros” (safeName) para evitar caracteres raros
 * - Respuestas JSON consistentes + códigos HTTP correctos
 * - Logs de error en servidor, mensajes genéricos al cliente
 *
 * Nota de seguridad:
 * - En producción, evita retornar `error.message` al cliente si contiene detalles internos.
 */

const express = require("express");
const multer = require("multer");

const Evidence = require("../models/Evidence");
const Activity = require("../models/Activity");
const { protect, requireRole } = require("../middlewares/authMiddleware");
const supabase = require("../config/supabase");

const { validateObjectId, sanitizeString } = require("../middlewares/validate");

const router = express.Router();

/**
 * Configuración de Multer
 * - memoryStorage: el archivo vive en RAM (ideal para subir directo a cloud sin escribir a disco)
 * - limits.fileSize: evita uploads enormes (DoS y costos)
 * - fileFilter: limita tipos permitidos (solo imágenes)
 *
 * Nota:
 * - Si el usuario sube un tipo no permitido, se lanza Error.
 *   (Tu app debe tener un error handler global o capturar errores de multer.)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!ok) return cb(new Error("Solo se permiten imágenes (jpg, png, webp)"));
    cb(null, true);
  },
});

/**
 * safeName
 * - Normaliza el nombre para evitar caracteres peligrosos o incompatibles con storage
 * - Reemplaza lo que no sea [a-zA-Z0-9_ . -] por "_"
 * - Recorta a 120 chars
 *
 * Nota:
 * - Aquí solo se usa para el fileName final (que tú construyes), no el original del usuario.
 */
const safeName = (name = "file") => name.replace(/[^\w.\-]/g, "_").slice(0, 120);

/**
 * =========================
 * USER: subir evidencia
 * POST /api/evidences/upload   (depende de tu mount)
 * =========================
 *
 * Requiere:
 * - multipart/form-data
 * - file (campo "file")
 * - activityId (en body)
 * Opcional:
 * - caption (en body)
 *
 * Reglas de negocio:
 * - El usuario debe estar inscrito en la actividad
 * - No permitir más uploads si ya existe evidence approved para esa activity/user
 * - No permitir duplicados si ya existe alguna evidencia para esa activity/user (pending/rejected)
 *
 * Storage:
 * - Sube la imagen a Supabase bucket (por defecto "evidences")
 * - Genera public URL y la guarda en Evidence
 */
router.post(
  "/upload",
  protect,
  requireRole("user"),
  upload.single("file"),
  async (req, res) => {
    try {
      // Sanitizar inputs del body (evita strings enormes / raros)
      const activityId = sanitizeString(req.body.activityId, 60);
      const caption = sanitizeString(req.body.caption, 300);

      if (!activityId) return res.status(400).json({ message: "Falta activityId" });

      /**
       * Validación de ObjectId manual:
       * - activityId viene en body, no en params => no aplica validateObjectId("...")
       * - Se valida con mongoose.Types.ObjectId.isValid
       *
       * Nota:
       * - Requieres mongoose solo aquí para no acoplar todo el archivo.
       */
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(activityId)) {
        return res.status(400).json({ message: "activityId inválido" });
      }

      // Archivo requerido (multer lo coloca en req.file)
      if (!req.file) return res.status(400).json({ message: "Falta archivo (file)" });

      // Verifica que la actividad exista
      const activity = await Activity.findById(activityId);
      if (!activity) return res.status(404).json({ message: "Actividad no encontrada" });

      /**
       * Verificar inscripción:
       * - participants es un arreglo de ObjectId
       * - Se compara por string para evitar mismatch ObjectId vs string
       */
      const isJoined = (activity.participants || []).some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (!isJoined) {
        return res.status(403).json({ message: "No estás inscrito en esta actividad" });
      }

      /**
       * Regla: si ya existe evidencia aprobada para esta actividad/usuario,
       * se considera “completada” y no se permiten más evidencias.
       */
      const alreadyApproved = await Evidence.findOne({
        activity: activityId,
        user: req.user._id,
        status: "approved",
      });
      if (alreadyApproved) {
        return res.status(400).json({
          message:
            "Esta actividad ya fue completada (evidencia aprobada). No puedes subir más evidencias.",
        });
      }

      /**
       * Regla: no permitir otra evidencia si ya existe cualquier evidencia
       * (pending o rejected). Esto fuerza 1 evidencia por actividad por usuario.
       */
      const existingAny = await Evidence.findOne({
        activity: activityId,
        user: req.user._id,
      });
      if (existingAny) {
        return res.status(400).json({
          message: "Ya enviaste evidencia para esta actividad. Espera revisión del admin.",
        });
      }

      /**
       * Bucket:
       * - configurable por env
       * - fallback "evidences"
       */
      const bucket = process.env.SUPABASE_BUCKET || "evidences";

      /**
       * Determinar extensión por MIME
       * - Esto evita confiar en el nombre del archivo del usuario.
       */
      const ext =
        req.file.mimetype === "image/png"
          ? "png"
          : req.file.mimetype === "image/webp"
          ? "webp"
          : "jpg";

      /**
       * Nombre y ruta en storage:
       * - fileName: userId + activityId + timestamp
       * - filePath: carpeta por activityId para organización
       */
      const fileName = safeName(`${req.user._id}_${activityId}_${Date.now()}.${ext}`);
      const filePath = `${activityId}/${fileName}`;

      /**
       * Upload a Supabase Storage
       * - upsert:false evita sobreescrituras accidentales
       * - contentType sirve para que el browser lo interprete bien
       */
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("SUPABASE UPLOAD ERROR:", uploadError);
        return res.status(500).json({ message: "Error al subir a Storage" });
      }

      /**
       * Obtener URL pública:
       * - getPublicUrl no falla “hard”, pero puede no traer publicUrl
       * - Validamos que exista
       */
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const fileUrl = publicData?.publicUrl;

      if (!fileUrl) {
        return res.status(500).json({ message: "No se pudo obtener URL pública" });
      }

      /**
       * Crear documento Evidence
       * - status inicial: pending
       * - guardas metadatos útiles (mimeType, size, caption)
       * - filePath: guardas bucket + path para rastrear/posible borrado futuro
       */
      const evidence = await Evidence.create({
        activity: activityId,
        user: req.user._id,
        fileUrl,
        filePath: `${bucket}/${filePath}`,
        fileName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        caption,
        status: "pending",
      });

      return res.status(201).json({ message: "Evidencia subida", evidence });
    } catch (error) {
      console.error("UPLOAD EVIDENCE ERROR:", error);

      // Nota: devolver error.message puede filtrar info interna (se deja igual para no romper).
      return res.status(500).json({ message: "Error al subir evidencia", error: error.message });
    }
  }
);

/**
 * =========================
 * USER: ver mis evidencias
 * GET /api/evidences/mine
 * =========================
 *
 * Qué hace:
 * - Lista evidencias del usuario autenticado
 *
 * Buenas prácticas:
 * - populate limitado (solo campos necesarios de activity)
 * - sort descendente para mostrar lo más reciente primero
 */
router.get("/mine", protect, requireRole("user"), async (req, res) => {
  try {
    const evidences = await Evidence.find({ user: req.user._id })
      .populate("activity", "titulo fecha lugar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ evidences });
  } catch (error) {
    console.error("MINE EVIDENCES ERROR:", error);
    return res.status(500).json({ message: "Error al obtener evidencias" });
  }
});

/**
 * =========================
 * ADMIN: ver evidencias por actividad
 * GET /api/evidences/activity/:activityId
 * =========================
 *
 * Qué hace:
 * - Devuelve todas las evidencias asociadas a una actividad
 *
 * Seguridad:
 * - Solo admin
 *
 * Validación:
 * - validateObjectId("activityId") asegura :activityId válido
 *
 * Buenas prácticas:
 * - populate limitado (solo nombre/apellido/email)
 */
router.get(
  "/activity/:activityId",
  protect,
  requireRole("admin"),
  validateObjectId("activityId"),
  async (req, res) => {
    try {
      const { activityId } = req.params;

      const evidences = await Evidence.find({ activity: activityId })
        .populate("user", "nombre apellido email")
        .sort({ createdAt: -1 });

      return res.status(200).json({ evidences });
    } catch (error) {
      console.error("ACTIVITY EVIDENCES ERROR:", error);
      return res.status(500).json({ message: "Error al obtener evidencias de actividad" });
    }
  }
);

/**
 * =========================
 * ADMIN: cambiar estado evidencia
 * PATCH /api/evidences/:id/status
 * =========================
 *
 * Qué hace:
 * - Actualiza el campo `status` de una evidencia (approved/rejected/pending)
 *
 * Validación:
 * - validateObjectId("id")
 * - status whitelist (evita valores arbitrarios)
 *
 * Nota:
 * - Si en tu negocio “approved” debería ser final, aquí podrías bloquear
 *   volver a pending/rejected, pero eso ya sería cambiar reglas.
 */
router.patch(
  "/:id/status",
  protect,
  requireRole("admin"),
  validateObjectId("id"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const status = sanitizeString(req.body.status, 20);

      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const evidence = await Evidence.findById(id);
      if (!evidence) return res.status(404).json({ message: "Evidencia no encontrada" });

      evidence.status = status;
      await evidence.save();

      return res.status(200).json({ message: "Estado actualizado", evidence });
    } catch (error) {
      console.error("UPDATE EVIDENCE STATUS ERROR:", error);
      return res.status(500).json({ message: "Error al actualizar estado" });
    }
  }
);

module.exports = router;
