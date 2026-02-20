const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const admin = require("../config/firebaseAdmin");
const { protect } = require("../middlewares/authMiddleware");

const EmailOtp = require("../models/EmailOtp");
const resend = require("../config/resend");

// ✅ NUEVO: Password Reset OTP
const PasswordResetOtp = require("../models/PasswordResetOtp");

const router = express.Router();

// =========================
// Helpers
// =========================
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

const isValidEmail = (email = "") => {
  const e = String(email).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e);
};

const genCode = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos

// =========================
// REGISTER (STEP 1) - REQUEST CODE
// POST /api/auth/register/request-code
// body: { email }
// =========================
router.post("/register/request-code", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Correo ya registrado" });
    }

    // Anti-spam simple: si ya se mandó hace < 45s, bloquear
    const last = await EmailOtp.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (last?.lastSentAt) {
      const diffMs = Date.now() - new Date(last.lastSentAt).getTime();
      if (diffMs < 45 * 1000) {
        return res.status(429).json({ message: "Espera unos segundos antes de reenviar el código" });
      }
    }

    // Crear OTP
    const code = genCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await EmailOtp.create({
      email,
      codeHash,
      expiresAt,
      used: false,
      attempts: 0,
      lastSentAt: new Date(),
    });

    // Enviar correo
    const from = process.env.RESEND_FROM || "EcoSteps <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: [email],
      subject: "Tu código de verificación EcoSteps",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.4">
          <h2>EcoSteps</h2>
          <p>Tu código de confirmación es:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 0;">
            ${code}
          </div>
          <p>Este código expira en <b>10 minutos</b>.</p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Código enviado al correo" });
  } catch (error) {
    console.error("REQUEST CODE ERROR:", error);
    return res.status(500).json({ message: "Error al enviar código" });
  }
});

// =========================
// REGISTER (STEP 2) - VERIFY CODE + CREATE USER
// POST /api/auth/register/verify-code
// body: { code, nombre, apellido, email, password, telefono }
// ✅ Al verificar: crea usuario con role "user" y regresa token
// =========================
router.post("/register/verify-code", async (req, res) => {
  try {
    const code = String(req.body?.code || "").trim();
    const nombre = String(req.body?.nombre || "").trim();
    const apellido = String(req.body?.apellido || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const telefono = String(req.body?.telefono || "").trim();

    if (!email || !isValidEmail(email)) return res.status(400).json({ message: "Correo inválido" });
    if (!code || code.length < 4) return res.status(400).json({ message: "Código inválido" });

    if (!nombre || !apellido || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Correo ya registrado" });

    const otp = await EmailOtp.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (!otp) return res.status(400).json({ message: "No hay código activo para este correo" });

    if (otp.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "El código expiró. Solicita uno nuevo" });
    }

    if ((otp.attempts || 0) >= 6) {
      return res.status(429).json({ message: "Demasiados intentos. Solicita un nuevo código" });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();

    if (!ok) {
      return res.status(400).json({ message: "Código incorrecto" });
    }

    // Marcar usado
    otp.used = true;
    await otp.save();

    // Crear user (forzamos role=user, Google=false)
    const user = await User.create({
      nombre,
      apellido,
      email,
      password,
      telefono: telefono || "",
      role: "user",
      google: false,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Cuenta verificada y registrada",
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
    console.error("VERIFY CODE ERROR:", error);
    return res.status(500).json({ message: "Error al verificar código" });
  }
});

// =========================
// ✅ PASSWORD RESET (STEP 1) - REQUEST CODE
// POST /api/auth/password/request-code
// body: { email }
// ✅ AHORA: valida si existe o no (devuelve 404 si no existe)
// =========================
router.post("/password/request-code", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Correo inválido" });
    }

    const user = await User.findOne({ email });

    // ✅ valida existencia
    if (!user) {
      return res.status(404).json({ message: "Correo no registrado" });
    }

    // Si es cuenta Google (y no tiene password local), bloquear
    // OJO: si tu User tiene password select:false, esto podría dar falso positivo.
    if (user.google && !user.password) {
      return res.status(400).json({ message: "Esta cuenta usa Google. Inicia sesión con Google" });
    }

    // Anti-spam simple: si ya se mandó hace < 45s, bloquear
    const last = await PasswordResetOtp.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (last?.lastSentAt) {
      const diffMs = Date.now() - new Date(last.lastSentAt).getTime();
      if (diffMs < 45 * 1000) {
        return res.status(429).json({ message: "Espera unos segundos antes de reenviar el código" });
      }
    }

    const code = genCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await PasswordResetOtp.create({
      email,
      codeHash,
      expiresAt,
      used: false,
      attempts: 0,
      lastSentAt: new Date(),
    });

    const from = process.env.RESEND_FROM || "EcoSteps <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: [email],
      subject: "Código para restablecer tu contraseña (EcoSteps)",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.4">
          <h2>EcoSteps</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Tu código es:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 0;">
            ${code}
          </div>
          <p>Este código expira en <b>10 minutos</b>.</p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Código enviado al correo" });
  } catch (error) {
    console.error("PASSWORD REQUEST CODE ERROR:", error);
    return res.status(500).json({ message: "Error al enviar código" });
  }
});

// =========================
// ✅ PASSWORD RESET (STEP 2) - VERIFY CODE + UPDATE PASSWORD
// POST /api/auth/password/verify-code
// body: { email, code, newPassword }
// =========================
router.post("/password/verify-code", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !isValidEmail(email)) return res.status(400).json({ message: "Correo inválido" });
    if (!code || code.length < 4) return res.status(400).json({ message: "Código inválido" });
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener mínimo 6 caracteres" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Correo no registrado" });

    if (user.google && !user.password) {
      return res.status(400).json({ message: "Esta cuenta usa Google. Inicia sesión con Google" });
    }

    const otp = await PasswordResetOtp.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (!otp) return res.status(400).json({ message: "Código inválido o expirado" });

    if (otp.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "El código expiró. Solicita uno nuevo" });
    }

    if ((otp.attempts || 0) >= 6) {
      return res.status(429).json({ message: "Demasiados intentos. Solicita uno nuevo" });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();

    if (!ok) return res.status(400).json({ message: "Código incorrecto" });

    otp.used = true;
    await otp.save();

    // Actualizar password (tu User model normalmente hashea en pre('save'))
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    console.error("PASSWORD VERIFY CODE ERROR:", error);
    return res.status(500).json({ message: "Error al restablecer contraseña" });
  }
});

// =========================
// LOGIN (igual)
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios" });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signToken(user);

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
    return res.status(500).json({ message: "Error en el login", error: error.message });
  }
});

// =========================
// GOOGLE AUTH (igual)
// =========================
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) return res.status(400).json({ message: "Falta idToken" });

    const decoded = await admin.auth().verifyIdToken(idToken);

    const email = decoded.email;
    const fullName = decoded.name || "Usuario Google";

    const parts = fullName.trim().split(" ");
    const nombre = parts[0] || "Usuario";
    const apellido = parts.slice(1).join(" ") || "Google";

    if (!email) return res.status(400).json({ message: "Google no devolvió email" });

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
    } else if (!user.google) {
      user.google = true;
      await user.save();
    }

    const token = signToken(user);

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
    return res.status(500).json({ message: "Error en auth Google", error: error.message });
  }
});

// =========================
// ME (igual)
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