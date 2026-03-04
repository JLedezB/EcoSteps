import "../styles/resetpassword.css";
import { FaLeaf } from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordResetCode, verifyPasswordResetCode } from "../services/authService";

// ✅ policy igual al backend
const STRONG_PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*\s).{8,72}$/;

export default function ResetPassword() {
  const navigate = useNavigate();

  const pending = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("pendingReset") || "null");
    } catch {
      return null;
    }
  }, []);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pending?.email) navigate("/forgot-password", { replace: true });
  }, [pending, navigate]);

  const pwd = newPassword || "";
  const checks = {
    len: pwd.length >= 8 && pwd.length <= 72,
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    num: /[0-9]/.test(pwd),
    special: /[^\w\s]/.test(pwd),
    nospace: !/\s/.test(pwd),
  };
  const isStrong = STRONG_PWD_REGEX.test(pwd);

  const onVerify = async () => {
    try {
      setStatus(null);

      if (!isStrong) {
        setStatus(
          "⚠️ Contraseña insegura: mínimo 8 caracteres, mayúscula, minúscula, número y caracter especial (sin espacios)."
        );
        return;
      }

      setLoading(true);

      await verifyPasswordResetCode({
        email: pending.email,
        code: code.trim(),
        newPassword,
      });

      sessionStorage.removeItem("pendingReset");
      setStatus("✅ Contraseña actualizada. Ahora inicia sesión.");
      navigate("/login", { replace: true });
    } catch (e) {
      setStatus(e?.message || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      setStatus(null);
      setLoading(true);
      await requestPasswordResetCode(pending.email);
      setStatus("✅ Código reenviado.");
    } catch (e) {
      setStatus(e?.message || "Error al reenviar");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && code.trim().length >= 4 && isStrong;

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-elevated auth-card-animate">
        <div className="auth-brand">
          <h1 className="auth-title">
            Confirmar y cambiar <FaLeaf className="auth-leaf" />
          </h1>
          <p className="auth-subtitle">
            Código enviado a: <b>{pending?.email || "—"}</b>
          </p>
        </div>

        <div className="auth-form">
          <label className="auth-label">Código (6 dígitos)</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <HiOutlineMail />
            </span>
            <input
              className="form-control auth-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
          </div>

          <label className="auth-label mt-3">Nueva contraseña (segura)</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">
              <HiOutlineLockClosed />
            </span>

            <input
              className="form-control auth-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ej: EcoSteps#2026"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
            </button>
          </div>

          <div className="auth-alert mt-2" style={{ opacity: 0.95 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {isStrong ? "✅ Contraseña segura" : "⚠️ Requisitos de seguridad"}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.35 }}>
              • {checks.len ? "✅" : "❌"} 8–72 caracteres{" "}
              • {checks.upper ? "✅" : "❌"} mayúscula{" "}
              • {checks.lower ? "✅" : "❌"} minúscula{" "}
              • {checks.num ? "✅" : "❌"} número{" "}
              • {checks.special ? "✅" : "❌"} especial{" "}
              • {checks.nospace ? "✅" : "❌"} sin espacios
            </div>
          </div>

          {status && <div className="auth-alert mt-3">{status}</div>}

          <button className="btn btn-eco w-100 mt-3" type="button" disabled={!canSubmit} onClick={onVerify}>
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </button>

          <button className="btn btn-outline-secondary w-100 mt-2" type="button" disabled={loading} onClick={onResend}>
            Reenviar código
          </button>

          <div className="auth-link mt-2">
            <Link
              to="/forgot-password"
              onClick={() => {
                sessionStorage.removeItem("pendingReset");
              }}
            >
              Cambiar correo
            </Link>
          </div>

          <div className="auth-link mt-1">
            <Link to="/login">Volver a iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}