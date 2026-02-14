/**
 * Tickets Routes (EcoSteps)
 * ------------------------------------------------------------
 * Este archivo implementa un sistema de tickets tipo soporte:
 * - USER: crear ticket (opcional ligado a una actividad)
 * - USER: listar mis tickets
 * - ADMIN: listar tickets (con filtro por status)
 * - USER/ADMIN: ver detalle de un ticket (con control de acceso)
 * - USER/ADMIN: agregar mensajes al ticket (con adjunto opcional)
 * - ADMIN: cambiar status (y si resolved => borrar ticket)
 *
 * Buenas prácticas aplicadas (sin cambiar tu lógica):
 * - `protect` en todas las rutas (autenticación JWT)
 * - Validaciones tempranas (early returns) y mensajes claros
 * - Validación de ObjectId antes de consultar Mongo
 * - `populate` con campos mínimos para no traer data innecesaria
 * - Multer memoryStorage + límites + fileFilter (control de tipos y tamaño)
 * - safeName para nombres de archivo seguros en Storage
 * - Logs en servidor; respuestas genéricas al cliente
 *
 * Nota de diseño importante:
 * - En tu PATCH /:id/status si status === "resolved" eliminas el ticket.
 *   Eso es válido si quieres “bandeja limpia”, pero pierdes historial/auditoría.
 *   (No lo cambio, solo lo dejo documentado.)
 */

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const { protect } = require("../middlewares/authMiddleware");
const supabase = require("../config/supabase");

const router = express.Router();

/**
 * Helper: validar ObjectId
 * - Evita queries innecesarias y errores por ids malformados
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Config Multer:
 * - memoryStorage: sube directo a Supabase sin guardar en disco
 * - fileSize 6MB: limita adjuntos
 * - fileFilter: solo tipos permitidos (jpg/png/webp/pdf/docx)
 *
 * Nota:
 * - Si fileFilter rechaza, Multer lanza error; requiere handler global para responder 400.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB
  fileFilter: (req, file, cb) => {
    // acepta imágenes + pdf + docx (ajusta si quieres)
    const ok = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.mimetype);

    if (!ok) return cb(new Error("Archivo no permitido (jpg/png/webp/pdf/docx)"));
    cb(null, true);
  },
});

/**
 * safeName:
 * - Normaliza nombres para evitar caracteres problemáticos en rutas de Storage.
 */
const safeName = (name = "file") => name.replace(/[^\w.\-]/g, "_").slice(0, 120);

/**
 * =========================
 * USER: crear ticket
 * POST /api/tickets
 * body: { subject, description, activityId? }
 * =========================
 *
 * Qué hace:
 * - Crea un ticket con status "open"
 * - Crea el primer mensaje en `messages` con el texto de description
 *
 * Reglas:
 * - Solo user
 * - subject y description obligatorios (no vacíos)
 * - Si activityId viene:
 *   - debe ser ObjectId válido
 *   - la actividad debe existir
 *   - el usuario debe estar inscrito
 */
router.post("/", protect, async (req, res) => {
  try {
    // Control de acceso: solo usuarios crean tickets
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const { subject, description, activityId } = req.body;

    // Validación mínima: strings no vacíos
    if (!subject || !String(subject).trim() || !description || !String(description).trim()) {
      return res.status(400).json({ message: "Faltan subject o description" });
    }

    let activity = null;

    /**
     * activityId opcional:
     * - Si lo mandas, el ticket se “asocia” a la actividad
     * - Se valida y se verifica inscripción del user
     */
    if (activityId) {
      if (!isValidObjectId(activityId)) {
        return res.status(400).json({ message: "activityId inválido" });
      }

      const a = await Activity.findById(activityId);
      if (!a) return res.status(404).json({ message: "Actividad no encontrada" });

      // exigir que esté inscrito
      const isJoined = (a.participants || []).some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (!isJoined) {
        return res.status(403).json({ message: "No estás inscrito en esta actividad" });
      }

      activity = a._id;
    }

    /**
     * Crea ticket:
     * - messages inicia con el mensaje del usuario (description)
     * - senderRole ayuda a diferenciar UI (user/admin)
     */
    const ticket = await Ticket.create({
      user: req.user._id,
      activity,
      subject: String(subject).trim(),
      description: String(description).trim(),
      status: "open",
      messages: [
        {
          senderRole: "user",
          sender: req.user._id,
          text: String(description).trim(),
        },
      ],
    });

    return res.status(201).json({ message: "Ticket creado", ticket });
  } catch (error) {
    console.error("CREATE TICKET ERROR:", error);
    return res.status(500).json({ message: "Error al crear ticket" });
  }
});

/**
 * =========================
 * USER: listar mis tickets
 * GET /api/tickets/mine
 * =========================
 *
 * Qué hace:
 * - Lista tickets del usuario autenticado
 * - populate activity (campos mínimos)
 * - sort por más recientes primero
 */
router.get("/mine", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const tickets = await Ticket.find({ user: req.user._id })
      .populate("activity", "titulo fecha lugar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("MY TICKETS ERROR:", error);
    return res.status(500).json({ message: "Error al obtener tickets" });
  }
});

/**
 * =========================
 * ADMIN: listar tickets (+ filtro por status)
 * GET /api/tickets?status=open|in_progress|resolved
 * =========================
 *
 * Qué hace:
 * - Lista todos los tickets
 * - Permite filtrar por query param `status`
 *
 * Validación:
 * - status debe ser uno de los permitidos si viene
 *
 * populate:
 * - user: para ver nombre/email en bandeja
 * - activity: para contexto
 */
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { status } = req.query;

    const allowed = ["open", "in_progress", "resolved"];
    const filter = {};

    if (status) {
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Filtro status inválido" });
      }
      filter.status = status;
    }

    const tickets = await Ticket.find(filter)
      .populate("user", "nombre apellido email")
      .populate("activity", "titulo fecha lugar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("ALL TICKETS ERROR:", error);
    return res.status(500).json({ message: "Error al obtener tickets" });
  }
});

/**
 * =========================
 * USER/ADMIN: detalle ticket
 * GET /api/tickets/:id
 * =========================
 *
 * Qué hace:
 * - Devuelve un ticket con:
 *   - user, activity, messages.sender (para mostrar nombres en chat)
 *
 * Control de acceso:
 * - ADMIN: puede ver cualquiera
 * - USER: solo si es dueño del ticket
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const ticket = await Ticket.findById(id)
      .populate("user", "nombre apellido email")
      .populate("activity", "titulo fecha lugar")
      .populate("messages.sender", "nombre apellido email role");

    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    // Si es user, solo puede ver sus tickets
    if (req.user.role === "user" && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No tienes acceso a este ticket" });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("TICKET DETAIL ERROR:", error);
    return res.status(500).json({ message: "Error al obtener ticket" });
  }
});

/**
 * =========================
 * USER/ADMIN: agregar mensaje + adjunto opcional
 * POST /api/tickets/:id/messages
 * form-data: text, file?
 * =========================
 *
 * Reglas:
 * - USER solo si es dueño del ticket
 * - ADMIN puede responder cualquiera
 * - Debe venir texto o archivo (o ambos)
 *
 * Archivos:
 * - Se suben a Supabase Storage en carpeta tickets/<ticketId>/
 * - Se guarda fileUrl y metadatos en el mensaje
 *
 * Auto-status:
 * - Si admin responde y el ticket está "open" => pasa a "in_progress"
 */
router.post("/:id/messages", protect, upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const text = req.body?.text || "";

    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    // USER solo si es dueño
    if (req.user.role === "user" && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No tienes acceso a este ticket" });
    }

    // Debe venir texto o archivo
    if (!String(text).trim() && !req.file) {
      return res.status(400).json({ message: "Escribe un mensaje o adjunta un archivo" });
    }

    // Metadatos del archivo (default)
    let fileUrl = null;
    let filePath = "";
    let fileName = "";
    let mimeType = "";
    let size = 0;

    /**
     * Si viene archivo:
     * - Se sube a Supabase
     * - Se guarda su URL pública y metadatos en el mensaje
     */
    if (req.file) {
      const bucket = process.env.SUPABASE_BUCKET || "evidences"; // mismo bucket que evidencias
      const safe = safeName(req.file.originalname || "file");

      // fileName final evita colisiones básicas con timestamp
      fileName = `${Date.now()}_${safe}`;
      filePath = `tickets/${ticket._id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("SUPABASE TICKET UPLOAD ERROR:", uploadError);
        return res.status(500).json({ message: "Error al subir archivo del ticket" });
      }

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      fileUrl = publicData?.publicUrl || null;

      mimeType = req.file.mimetype;
      size = req.file.size;

      // Guardar bucket/path (mismo estilo que evidencias)
      filePath = `${bucket}/${filePath}`;
    }

    /**
     * Agregar mensaje al arreglo:
     * - senderRole ayuda a UI (badge admin/user)
     * - sender = userId
     * - text trim para evitar espacios inútiles
     */
    ticket.messages.push({
      senderRole: req.user.role,
      sender: req.user._id,
      text: String(text || "").trim(),
      fileUrl,
      filePath,
      fileName,
      mimeType,
      size,
    });

    // Auto status si admin responde
    if (req.user.role === "admin" && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    // Devuelves ticketId para que el front refresque detalle si quiere
    return res.status(200).json({ message: "Mensaje enviado", ticketId: ticket._id });
  } catch (error) {
    console.error("TICKET MESSAGE ERROR:", error);
    return res.status(500).json({ message: error?.message || "Error al enviar mensaje" });
  }
});

/**
 * =========================
 * ADMIN: cambiar estado (y si resolved => borrar)
 * PATCH /api/tickets/:id/status
 * body: { status }
 * =========================
 *
 * Reglas:
 * - Solo admin
 * - status whitelist: open | in_progress | resolved
 *
 * Comportamiento actual:
 * - Si status === "resolved": elimina el ticket de la BD
 * - Si no: actualiza ticket.status
 *
 * Nota:
 * - Eliminar al resolver borra el historial de mensajes.
 *   Si en el futuro quieres mantener auditoría, lo ideal es marcar "resolved"
 *   sin borrar (o archivar).
 */
router.patch("/:id/status", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Status inválido" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    // ✅ Si resolved => borra el ticket (tu lógica actual)
    if (status === "resolved") {
      await Ticket.deleteOne({ _id: ticket._id });
      return res.status(200).json({ message: "Ticket resuelto y eliminado" });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({ message: "Estado actualizado", ticket });
  } catch (error) {
    console.error("TICKET STATUS ERROR:", error);
    return res.status(500).json({ message: "Error al actualizar estado" });
  }
});

module.exports = router;
