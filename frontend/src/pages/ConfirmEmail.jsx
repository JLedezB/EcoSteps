import "../styles/auth.css";
import { FaLeaf } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestRegisterCode, verifyRegisterCode } from "../services/authService";

export default function ConfirmEmail() {
  const navigate = useNavigate();

  const pending = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("pendingRegister") || "null");
    } catch {
      return null;
    }
  }, []);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pending?.email) {
      navigate("/register", { replace: true });
    }
  }, [pending, navigate]);

  const onVerify = async () => {
    try {
      setStatus(null);
      setLoading(true);

      const payload = {
        code: code.trim(),
        nombre: pending.nombre,
        apellido: pending.apellido,
        email: pending.email,
        password: pending.password,
        telefono: pending.telefono,
      };

      const res = await verifyRegisterCode(payload);

      // guardar sesión
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.user?.role || "user");

      // limpiar
      sessionStorage.removeItem("pendingRegister");

      navigate("/user", { replace: true });
    } catch (e) {
      setStatus(e?.message || "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      setStatus(null);
      setLoading(true);
      await requestRegisterCode(pending.email);
      setStatus("✅ Código reenviado");
    } catch (e) {
      setStatus(e?.message || "Error al reenviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-elevated auth-card-animate">
        <div className="auth-brand">
          <h1 className="auth-title">
            Confirmar correo <FaLeaf className="auth-leaf" />
          </h1>
          <p className="auth-subtitle">
            Te enviamos un código a: <b>{pending?.email || "—"}</b>
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

          {status && <div className="auth-alert mt-3">{status}</div>}

          <button
            className="btn btn-eco w-100 mt-3"
            type="button"
            disabled={loading || code.trim().length < 4}
            onClick={onVerify}
          >
            {loading ? "Verificando..." : "Verificar y crear cuenta"}
          </button>

          <button className="btn btn-outline-secondary w-100 mt-2" type="button" disabled={loading} onClick={onResend}>
            Reenviar código
          </button>

          <button
            className="btn btn-link w-100 mt-2"
            type="button"
            onClick={() => {
              sessionStorage.removeItem("pendingRegister");
              navigate("/register", { replace: true });
            }}
          >
            Cambiar correo
          </button>
        </div>
      </div>
    </div>
  );
}
