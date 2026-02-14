const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("../config/firebaseAdmin");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password, telefono, role } = req.body;

    if (!nombre || !apellido || !email || !password || !role) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Correo ya registrado" });
    }

    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      telefono: telefono || "",
      role,
      google: false,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: "Error en el login",
      error: error.message,
    });
  }
});

// =========================
// GOOGLE AUTH
// =========================
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Falta idToken" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    const email = decoded.email;
    const fullName = decoded.name || "Usuario Google";

    const parts = fullName.trim().split(" ");
    const nombre = parts[0] || "Usuario";
    const apellido = parts.slice(1).join(" ") || "Google";

    if (!email) {
      return res.status(400).json({ message: "Google no devolvió email" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        nombre,
        apellido,
        email,
        telefono: "",
        role: "user",
        google: true,
      });
    } else {
      if (!user.google) {
        user.google = true;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Google Auth OK",
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    return res.status(500).json({
      message: "Error en auth Google",
      error: error.message,
    });
  }
});

// =========================
// ME
// =========================
router.get("/me", protect, async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      email: req.user.email,
      telefono: req.user.telefono,
      role: req.user.role,
      google: req.user.google,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
