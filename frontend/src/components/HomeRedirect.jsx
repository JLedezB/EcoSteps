// ==============================
// HomeRedirect.jsx
// Redirección inicial según sesión y rol
// - Sin token → Login
// - Admin → /admin
// - User → /user
// ==============================

import { Navigate } from "react-router-dom";
import { getToken, getRole } from "../services/authSession";

// ==============================
// Componente
// ==============================
function HomeRedirect() {
  // ==============================
  // 1) Estado de sesión
  // ==============================
  const token = getToken();
  const role = getRole();

  // ==============================
  // 2) Sin sesión → Login
  // ==============================
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ==============================
  // 3) Con sesión → Dashboard por rol
  // ==============================
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // Default: usuario normal
  return <Navigate to="/user" replace />;
}

export default HomeRedirect;
