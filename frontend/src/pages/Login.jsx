import "../styles/auth.css";

// Icons
import { FaLeaf, FaGoogle } from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
} from "react-icons/hi";

// Router
import { Link, useNavigate } from "react-router-dom";

// React
import { useContext, useEffect, useMemo, useState } from "react";

// Context
import { AuthContext } from "../context/AuthContext";

// Form / Validation
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

// Services
import { login, googleAuth } from "../services/authService";

// Firebase
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";

// Session helpers
import { setSession, getToken, getRole } from "../services/authSession";

// Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: Yup.string().required("La contraseña es obligatoria"),
});

function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (token) {
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/user", { replace: true });
    }
  }, [navigate]);

  const routeByRole = (role) => (role === "admin" ? "/admin" : "/user");

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await googleAuth(idToken);

      setSession({ token: res.token, role: res.user.role });
      setUser(res.user);
      localStorage.setItem("userId", res.user.id);

      navigate(routeByRole(res.user.role), { replace: true });
    } catch (err) {
      console.error("GOOGLE LOGIN FRONT ERROR:", err);
      alert(err?.message || "No se pudo iniciar sesión con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        {/* Panel visual */}
        <aside className="auth-side" aria-hidden="true">
          <div className="auth-side-inner">
            <div className="auth-side-badge">
              <HiOutlineShieldCheck />
              Acceso seguro
            </div>

            <h2 className="auth-side-title">
              Bienvenido a <span>EcoSteps</span>
            </h2>

            <p className="auth-side-text">
              Gestiona tu Servicio Social con orden: actividades, evidencias, reportes y soporte.
            </p>

            <div className="auth-side-cards">
              <div className="auth-side-card">
                <div className="auth-side-k">Evidencias</div>
                <div className="auth-side-v">Con estatus y comentarios</div>
              </div>

              <div className="auth-side-card">
                <div className="auth-side-k">Reportes</div>
                <div className="auth-side-v">Entrega centralizada</div>
              </div>

              <div className="auth-side-card">
                <div className="auth-side-k">Soporte</div>
                <div className="auth-side-v">EcoBot + Tickets</div>
              </div>
            </div>

            <div className="auth-side-foot">© {year} EcoSteps SGSS</div>
          </div>

          <div className="auth-side-glow" />
        </aside>

        {/* Card login */}
        <main className="auth-card auth-card-pro auth-pop">
          <header className="auth-head">
            <div className="auth-brand">
              <div className="auth-mark" aria-hidden="true">
                <FaLeaf />
              </div>

              <div className="auth-brand-copy">
                <h1 className="auth-title">EcoSteps SGSS</h1>
                <p className="auth-subtitle">Inicia sesión para continuar</p>
              </div>
            </div>
          </header>

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

                setSession({ token: res.token, role: res.user.role });
                setUser(res.user);
                localStorage.setItem("userId", res.user.id);

                navigate(routeByRole(res.user.role), { replace: true });
              } catch (error) {
                setStatus(error?.message || "Credenciales incorrectas. Verifica e inténtalo de nuevo.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ status, isSubmitting, errors, touched }) => {
              const disabled = isSubmitting || googleLoading;
              const emailInvalid = Boolean(touched.email && errors.email);
              const passInvalid = Boolean(touched.password && errors.password);

              return (
                <Form className="auth-form" noValidate>
                  {/* Correo */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="email">
                      Correo
                    </label>

                    <div className={`auth-input-wrap ${emailInvalid ? "is-invalid" : ""}`}>
                      <span className="auth-input-icon" aria-hidden="true">
                        <HiOutlineMail />
                      </span>

                      <Field
                        id="email"
                        type="email"
                        name="email"
                        className="auth-input"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={emailInvalid ? "true" : "false"}
                      />
                    </div>

                    <ErrorMessage name="email" component="div" className="auth-error" />
                  </div>

                  {/* Contraseña */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="password">
                      Contraseña
                    </label>

                    <div className={`auth-input-wrap ${passInvalid ? "is-invalid" : ""}`}>
                      <span className="auth-input-icon" aria-hidden="true">
                        <HiOutlineLockClosed />
                      </span>

                      <Field
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="auth-input"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        aria-invalid={passInvalid ? "true" : "false"}
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

                    <div className="auth-row">
                      <ErrorMessage name="password" component="div" className="auth-error" />
                      <Link to="/forgot-password" className="auth-mini-link">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  </div>

                  {/* Error general */}
                  {status && (
                    <div className="auth-alert" role="alert" aria-live="polite">
                      {status}
                    </div>
                  )}

                  {/* Botón login */}
                  <button type="submit" className="auth-btn auth-btn-primary" disabled={disabled}>
                    {isSubmitting ? (
                      <span className="auth-btn-loading">
                        <span className="auth-spinner" aria-hidden="true" />
                        Ingresando...
                      </span>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="auth-divider" role="separator" aria-label="o continuar con Google">
                    <span>o</span>
                  </div>

                  {/* Google */}
                  <button
                    type="button"
                    className="auth-btn auth-btn-google"
                    onClick={handleGoogleLogin}
                    disabled={disabled}
                    aria-busy={googleLoading ? "true" : "false"}
                  >
                    <FaGoogle />
                    <span>{googleLoading ? "Conectando..." : "Iniciar sesión con Google"}</span>
                  </button>

                  <div className="auth-link">
                    <Link to="/register">¿No tienes cuenta? Regístrate</Link>
                  </div>

                  <div className="auth-footer-note">
                    <small>Al ingresar, aceptas el uso responsable de la plataforma.</small>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </main>
      </div>
    </div>
  );
}

export default Login;