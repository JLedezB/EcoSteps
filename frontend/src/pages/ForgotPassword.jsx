import "../styles/forgotpassword.css";
import { FaLeaf } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordResetCode } from "../services/authService";

const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email).trim());

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const emailTrim = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailOk = useMemo(() => isValidEmail(emailTrim), [emailTrim]);

  const onSubmit = async () => {
    try {
      setStatus(null);

      if (!emailOk) {
        setStatus("⚠️ Ingresa un correo válido.");
        return;
      }

      setLoading(true);

      // ✅ backend devuelve 404 si no existe
      await requestPasswordResetCode(emailTrim);

      sessionStorage.setItem("pendingReset", JSON.stringify({ email: emailTrim }));

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
              inputMode="email"
            />
          </div>

          {status && <div className="auth-alert mt-3">{status}</div>}

          <button className="btn btn-eco w-100 mt-3" type="button" disabled={loading || !emailOk} onClick={onSubmit}>
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