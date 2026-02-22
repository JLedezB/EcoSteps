const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const { protect } = require("../middlewares/authMiddleware");
const supabase = require("../config/supabase");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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

const safeName = (name = "file") => name.replace(/[^\w.\-]/g, "_").slice(0, 120);

// =========================
// USER: crear ticket
// POST /api/tickets
// =========================
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Prohibido: solo usuarios" });
    }

    const { subject, description, activityId } = req.body;

    if (!subject || !String(subject).trim() || !description || !String(description).trim()) {
      return res.status(400).json({ message: "Faltan subject o description" });
    }

    let activity = null;

    if (activityId) {
      if (!isValidObjectId(activityId)) {
        return res.status(400).json({ message: "activityId inválido" });
      }

      const a = await Activity.findById(activityId);
      if (!a) return res.status(404).json({ message: "Actividad no encontrada" });

      const isJoined = (a.participants || []).some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (!isJoined) {
        return res.status(403).json({ message: "No estás inscrito en esta actividad" });
      }

      activity = a._id;
    }

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

// =========================
// USER: listar mis tickets
// GET /api/tickets/mine
// =========================
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

// =========================
// ADMIN: listar tickets (+ filtro por status)
// GET /api/tickets?status=open|in_progress|canceled|resolved
// =========================
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { status } = req.query;

    // ✅ incluye canceled
    const allowed = ["open", "in_progress", "resolved", "canceled"];
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

// =========================
// USER/ADMIN: detalle ticket
// GET /api/tickets/:id
// =========================
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const ticket = await Ticket.findById(id)
      .populate("user", "nombre apellido email")
      .populate("activity", "titulo fecha lugar")
      .populate("messages.sender", "nombre apellido email role");

    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    if (req.user.role === "user" && ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No tienes acceso a este ticket" });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("TICKET DETAIL ERROR:", error);
    return res.status(500).json({ message: "Error al obtener ticket" });
  }
});

// =========================
// USER/ADMIN: agregar mensaje + adjunto opcional
// POST /api/tickets/:id/messages
// =========================
router.post("/:id/messages", protect, upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const text = req.body?.text || "";

    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    if (req.user.role === "user" && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No tienes acceso a este ticket" });
    }

    // ✅ Si está cancelado, no permitir mensajes (mejor UX)
    if (ticket.status === "canceled") {
      return res.status(400).json({ message: "Este ticket está cancelado y no admite mensajes." });
    }

    if (!String(text).trim() && !req.file) {
      return res.status(400).json({ message: "Escribe un mensaje o adjunta un archivo" });
    }

    let fileUrl = null;
    let filePath = "";
    let fileName = "";
    let mimeType = "";
    let size = 0;

    if (req.file) {
      const bucket = process.env.SUPABASE_BUCKET || "evidences";
      const safe = safeName(req.file.originalname || "file");

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

      filePath = `${bucket}/${filePath}`;
    }

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

    if (req.user.role === "admin" && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    return res.status(200).json({ message: "Mensaje enviado", ticketId: ticket._id });
  } catch (error) {
    console.error("TICKET MESSAGE ERROR:", error);
    return res.status(500).json({ message: error?.message || "Error al enviar mensaje" });
  }
});

// =========================
// ADMIN: cambiar estado
// PATCH /api/tickets/:id/status
// =========================
router.patch("/:id/status", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Prohibido: solo admin" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) return res.status(400).json({ message: "ID inválido" });

    // ✅ incluye canceled
    const allowed = ["open", "in_progress", "resolved", "canceled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Status inválido" });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket no encontrado" });

    // ✅ resolved => borra (tu lógica actual intacta)
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