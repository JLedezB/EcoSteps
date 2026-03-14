// backend/src/routes/chatbot.routes.js

const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middlewares/authMiddleware");
const {
  askChatbot,
  createTicketFromChatbot,
} = require("../controllers/chatbot.controller");

router.post("/ask", protect, requireRole("user", "admin"), askChatbot);
router.post("/create-ticket", protect, requireRole("user"), createTicketFromChatbot);

module.exports = router;