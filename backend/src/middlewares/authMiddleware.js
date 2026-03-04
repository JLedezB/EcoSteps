// ==============================
// authMiddleware.js
// Protección JWT + control de roles
// ==============================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==============================
// Middleware: protect
// Valida JWT y carga el usuario en req.user
// Header requerido: Authorization: Bearer <token>
// ==============================
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Debe venir: Authorization: Bearer <token>
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No autorizado: falta token",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario (sin password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "No autorizado: usuario no existe",
      });
    }

    // Inyectar usuario en request
    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o expirado",
    });
  }
};

// ==============================
// Middleware: requireRole
// Restringe acceso por rol
// Uso: requireRole("user", "admin")
// ==============================
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // protect debe ejecutarse antes
    if (!req.user) {
      return res.status(401).json({
        message: "No autorizado: falta usuario",
      });
    }

    const role = req.user.role;

    if (!role) {
      return res.status(401).json({
        message: "No autorizado: rol no definido",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Prohibido: rol insuficiente",
      });
    }

    return next();
  };
};

// ==============================
// Export
// ==============================
module.exports = { protect, requireRole };