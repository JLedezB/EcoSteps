// ==============================
// ProtectedRoute.jsx
// Protección de rutas por autenticación y rol
// ==============================

import { Navigate } from "react-router-dom";

// ==============================
// Componente
// ==============================
function ProtectedRoute({ children, role }) {
  // ==========================
  // 1) Sesión almacenada
  // ==========================
  const token = localStorage.getItem("token");
  const savedRole = localStorage.getItem("role");

  // ==========================
  // 2) Sin sesión → login
  // ==========================
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ==========================
  // 3) Validación de rol (si aplica)
  // ==========================
  if (role && savedRole !== role) {
    if (savedRole === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (savedRole === "user") {
      return <Navigate to="/user" replace />;
    }

    return <Navigate to="/" replace />;
  }

  // ==========================
  // 4) Acceso permitido
  // ==========================
  return children;
}

export default ProtectedRoute;
