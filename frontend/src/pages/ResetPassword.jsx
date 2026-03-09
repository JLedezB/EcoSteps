import "../styles/resetpassword.css";

import { FaLeaf } from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordResetCode, verifyPasswordResetCode } from "../services/authService";

// ✅ policy igual al backend (mantener 8-72 a nivel validación)
const STRONG_PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*\s).{8,72}$/;

function ReqPill({ ok, children }) {
  return (
    <span className={`pwd-pill ${ok ? "is-ok" : "is-bad"}`}>
      <span className="pwd-pill-ic" aria-hidden="true">
        {ok ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
      </span>
      <span className="pwd-pill-tx">{children}</span>
    </span>
  );
}

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

  // ===== Password checks (UI NO muestra 72) =====
  const pwd = newPassword || "";
  const checks = {
    len: pwd.length >= 8, // ✅ solo mínimo 8 visible
    lower: /[a-z]/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    num: /[0-9]/.test(pwd),
    special: /[^\w\s]/.test(pwd),
    nospace: !/\s/.test(pwd),
  };

  const allOk = Object.values(checks).every(Boolean);
  const isStrong = STRONG_PWD_REGEX.test(pwd); // validación real contra policy backend

  // score para barra
  const score = Object.values(checks).filter(Boolean).length; // 0..6
  const pct = Math.round((score / 6) * 100);
  const meterLabel = pct >= 100 ? "Fuerte" : pct >= 67 ? "Buena" : pct >= 34 ? "Regular" : "Débil";

  const onVerify = async () => {
    try {
      setStatus(null);

      if (!isStrong) {
        setStatus(
          "Contraseña insegura: mínimo 8 caracteres, mayúscula, minúscula, número y caracter especial (sin espacios)."
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
      setStatus("Contraseña actualizada. Ahora inicia sesión.");
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
      setStatus("Código reenviado.");
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

          {/* ✅ Requisitos PRO (sin 72, sin emojis) */}
          <div className="pwd-box" aria-live="polite" style={{ marginTop: 10 }}>
            <div className="pwd-top">
              <div className="pwd-title">
                Requisitos{" "}
                <span className={`pwd-state ${allOk ? "ok" : "warn"}`}>
                  {allOk ? "Cumplidos" : "Pendientes"}
                </span>
              </div>

              <div className="pwd-meter" title={`${pct}%`}>
                <span className="pwd-meter-bar" style={{ width: `${pct}%` }} />
              </div>

              <div className="pwd-meter-meta">
                <span className={`pwd-badge ${allOk ? "ok" : pct >= 34 ? "mid" : "low"}`}>
                  {meterLabel}
                </span>
                <span className="pwd-pct">{pct}%</span>
              </div>
            </div>

            <div className="pwd-reqs">
              <ReqPill ok={checks.len}>Mínimo 8 caracteres</ReqPill>
              <ReqPill ok={checks.upper}>Mayúscula</ReqPill>
              <ReqPill ok={checks.lower}>Minúscula</ReqPill>
              <ReqPill ok={checks.num}>Número</ReqPill>
              <ReqPill ok={checks.special}>Especial</ReqPill>
              <ReqPill ok={checks.nospace}>Sin espacios</ReqPill>
            </div>
          </div>

          {status && <div className="auth-alert mt-3">{status}</div>}

          <button
            className="btn btn-eco w-100 mt-3"
            type="button"
            disabled={!canSubmit}
            onClick={onVerify}
          >
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </button>

          <button
            className="btn btn-outline-secondary w-100 mt-2"
            type="button"
            disabled={loading}
            onClick={onResend}
          >
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