import "../styles/forgotpassword.css";
import { FaLeaf } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordResetCode } from "../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setStatus(null);
      setLoading(true);

      // ✅ backend devuelve 404 si no existe
      await requestPasswordResetCode(email.trim());

      sessionStorage.setItem("pendingReset", JSON.stringify({ email: email.trim().toLowerCase() }));

      setStatus("✅ Código enviado. Revisa tu bandeja.");
      navigate("/reset-password", { replace: true });
    } catch (e) {
      setStatus(e?.message || "Error al enviar código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-elevated auth-card-animate">
        <div className="auth-brand">
          <h1 className="auth-title">
            Restablecer contraseña <FaLeaf className="auth-leaf" />
          </h1>
          <p className="auth-subtitle">Ingresa tu correo y te enviaremos un código</p>
        </div>

        <div className="auth-form">
          <label className="auth-label">Correo</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <HiOutlineMail />
            </span>
            <input
              className="form-control auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              type="email"
            />
          </div>

          {status && <div className="auth-alert mt-3">{status}</div>}

          <button
            className="btn btn-eco w-100 mt-3"
            type="button"
            disabled={loading || email.trim().length < 5}
            onClick={onSubmit}
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>

          <div className="auth-link mt-2">
            <Link to="/login">Volver a iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}