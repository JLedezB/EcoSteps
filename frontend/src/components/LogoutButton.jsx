// ==============================
// LogoutButton.jsx
// Botón de cierre de sesión
// - Cierra sesión Firebase (Google)
// - Limpia sesión local (JWT / role / userId)
// - Redirige a login
// ==============================

import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../services/firebase";
import { clearSession } from "../services/authSession";

// ==============================
// Componente
// ==============================
function LogoutButton() {
  const navigate = useNavigate();

  // ==============================
  // 1) Handler de logout
  // ==============================
  const handleLogout = async () => {
    try {
      // 🔹 Si la sesión fue con Google (Firebase)
      await signOut(auth);
    } catch (e) {
      // 🔹 Si no había sesión Firebase activa, se ignora
    } finally {
      // ==============================
      // 2) Limpieza de sesión local
      // ==============================
      clearSession();

      // ==============================
      // 3) Redirección al login
      // ==============================
      navigate("/", { replace: true });
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn btn-outline-danger"
    >
      Cerrar sesión
    </button>
  );
}

export default LogoutButton;
