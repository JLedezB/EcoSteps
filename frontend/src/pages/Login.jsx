// ==============================
// Login.jsx
// Auth: Inicio de sesión (Email/Password + Google)
// - Formik + Yup para validación
// - Redirección si ya existe sesión (token)
// - Google Sign-In con Firebase (popup) + backend googleAuth
// - ✅ Guarda user completo en AuthContext (nombre/apellido/email/role)
// ==============================

import "../styles/auth.css";

// Icons
import { FaLeaf, FaGoogle } from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";

// Router
import { Link, useNavigate } from "react-router-dom";

// React
import { useContext, useEffect, useState } from "react";

// Context
import { AuthContext } from "../context/AuthContext";

// Form / Validation
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// Services (API)
import { login, googleAuth } from "../services/authService";

// Firebase (Google popup auth)
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";

// Session helpers
import { setSession, getToken, getRole } from "../services/authSession";

// Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: Yup.string().required("La contraseña es obligatoria"),
});

function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Session guard (si ya hay token)
  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (token) {
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/user", { replace: true });
    }
  }, [navigate]);

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await googleAuth(idToken);

      // Persistencia de sesión (token + role)
      setSession({ token: res.token, role: res.user.role });

      // ✅ Guardar user completo para UI (sidebar, etc.)
      setUser(res.user);

      // Extra: userId
      localStorage.setItem("userId", res.user.id);

      // Redirección por rol (por si algún día google pudiera ser admin)
      if (res.user.role === "admin") navigate("/admin", { replace: true });
      else navigate("/user", { replace: true });
    } catch (err) {
      console.error("GOOGLE LOGIN FRONT ERROR:", err);
      alert(err?.message || "No se pudo iniciar sesión con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-elevated auth-card-animate">
        <div className="auth-brand">
          <h1 className="auth-title">
            EcoSteps SGSS <FaLeaf className="auth-leaf" />
          </h1>
          <p className="auth-subtitle">Inicia sesión para continuar</p>
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              setStatus(null);

              const res = await login({
                email: values.email,
                password: values.password,
              });

              // Persistencia de sesión (token + role)
              setSession({ token: res.token, role: res.user.role });

              // ✅ Guardar user completo para UI
              setUser(res.user);

              // Extra: userId
              localStorage.setItem("userId", res.user.id);

              // Redirección por rol
              if (res.user.role === "admin") navigate("/admin", { replace: true });
              else navigate("/user", { replace: true });
            } catch (error) {
              setStatus(error?.message || "Credenciales incorrectas");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ status, isSubmitting, errors, touched }) => {
            const disabled = isSubmitting || googleLoading;

            return (
              <Form className="auth-form">
                {/* Email */}
                <div className="mb-3">
                  <label className="auth-label" htmlFor="email">
                    Correo
                  </label>

                  <div
                    className={`auth-input-wrap ${
                      touched.email && errors.email ? "is-invalid" : ""
                    }`}
                  >
                    <span className="auth-input-icon">
                      <HiOutlineMail />
                    </span>

                    <Field
                      id="email"
                      type="email"
                      name="email"
                      className="form-control auth-input"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                    />
                  </div>

                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-danger small mt-1"
                  />
                </div>

                {/* Password */}
                <div className="mb-2">
                  <label className="auth-label" htmlFor="password">
                    Contraseña
                  </label>

                  <div
                    className={`auth-input-wrap ${
                      touched.password && errors.password ? "is-invalid" : ""
                    }`}
                  >
                    <span className="auth-input-icon">
                      <HiOutlineLockClosed />
                    </span>

                    <Field
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control auth-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
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

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-danger small"
                    />

                    <Link to="#" className="auth-mini-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>

                {/* Status error */}
                {status && (
                  <div className="auth-alert" role="alert">
                    {status}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="btn btn-eco mb-3" disabled={disabled}>
                  {isSubmitting ? (
                    <span className="d-inline-flex align-items-center justify-content-center gap-2">
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Ingresando...
                    </span>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <span>o</span>
                </div>

                {/* Google */}
                <button
                  type="button"
                  className="btn btn-google mb-2"
                  onClick={handleGoogleLogin}
                  disabled={disabled}
                  aria-busy={googleLoading ? "true" : "false"}
                >
                  <FaGoogle />
                  <span className="ms-2">
                    {googleLoading ? "Conectando..." : "Iniciar sesión con Google"}
                  </span>
                </button>

                <div className="auth-link">
                  <Link to="/register">¿No tienes cuenta? Regístrate</Link>
                </div>
              </Form>
            );
          }}
        </Formik>

        <div className="auth-footer-note">
          <small>Al ingresar, aceptas el uso responsable de la plataforma.</small>
        </div>
      </div>
    </div>
  );
}

export default Login;
