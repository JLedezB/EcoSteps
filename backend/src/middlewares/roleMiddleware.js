// ==============================
// allowRoles.js
// Middleware de autorización por rol
// ==============================

/**
 * allowRoles
 * Permite el acceso solo a los roles indicados
 * ⚠️ Requiere que `protect` se ejecute antes
 *
 * Uso:
 *   allowRoles("admin")
 *   allowRoles("user", "admin")
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // protect debe ejecutarse antes
    if (!req.user) {
      return res.status(401).json({
        message: "No autorizado",
      });
    }

    // Validar rol
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Prohibido: sin permisos",
      });
    }

    return next();
  };
};

// ==============================
// Export
// ==============================
module.exports = { allowRoles };
