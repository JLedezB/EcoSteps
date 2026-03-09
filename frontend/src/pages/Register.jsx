import "../styles/auth.css";

import { FaLeaf } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { requestRegisterCode } from "../services/authService";

// ✅ Policy (igual que backend)
// Nota: el backend puede limitar a 72; aquí lo mantenemos en regex,
// pero en UI ya NO mostramos "72", solo "mínimo 8".
const STRONG_PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*\s).{8,72}$/;

const RegisterSchema = Yup.object().shape({
  nombre: Yup.string().trim().required("El nombre es obligatorio"),
  apellido: Yup.string().trim().required("El apellido es obligatorio"),
  email: Yup.string().email("Correo inválido").required("El correo es obligatorio"),
  password: Yup.string()
    .required("La contraseña es obligatoria")
    .matches(
      STRONG_PWD_REGEX,
      "Contraseña insegura: mínimo 8 caracteres, mayúscula, minúscula, número y caracter especial (sin espacios)."
    ),
  telefono: Yup.string()
    .trim()
    .matches(/^[0-9()+\-\s]*$/, "Teléfono inválido")
    .required("El teléfono es obligatorio"),
});

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

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <aside className="auth-side" aria-hidden="true">
          <div className="auth-side-inner">
            <div className="auth-side-badge">
              <HiOutlineShieldCheck />
              Verificación por correo
            </div>

            <h2 className="auth-side-title">
              Crea tu cuenta en <span>EcoSteps</span>
            </h2>

            <p className="auth-side-text">
              Te enviaremos un código a tu correo para confirmar que eres tú. Tarda unos segundos y te deja listo para
              usar la plataforma.
            </p>

            <div className="auth-side-cards">
              <div className="auth-side-card">
                <div className="auth-side-k">Paso 1</div>
                <div className="auth-side-v">Llena tus datos</div>
              </div>
              <div className="auth-side-card">
                <div className="auth-side-k">Paso 2</div>
                <div className="auth-side-v">Recibe el código en tu correo</div>
              </div>
              <div className="auth-side-card">
                <div className="auth-side-k">Paso 3</div>
                <div className="auth-side-v">Confirma y entra</div>
              </div>
            </div>

            <div className="auth-side-foot">© {year} EcoSteps SGSS</div>
          </div>
          <div className="auth-side-glow" />
        </aside>

        <main className="auth-card auth-card-pro auth-pop">
          <header className="auth-head">
            <div className="auth-brand">
              <div className="auth-mark" aria-hidden="true">
                <FaLeaf />
              </div>

              <div>
                <h1 className="auth-title">Crear cuenta</h1>
                <p className="auth-subtitle">Verifica tu correo para finalizar el registro</p>
              </div>
            </div>
          </header>

          <Formik
            initialValues={{
              nombre: "",
              apellido: "",
              email: "",
              password: "",
              telefono: "",
            }}
            validationSchema={RegisterSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                setStatus(null);

                await requestRegisterCode(values.email);

                sessionStorage.setItem(
                  "pendingRegister",
                  JSON.stringify({
                    nombre: values.nombre.trim(),
                    apellido: values.apellido.trim(),
                    email: values.email.trim(),
                    password: values.password,
                    telefono: values.telefono.trim(),
                  })
                );

                navigate("/confirm-email", { replace: true });
              } catch (error) {
                setStatus(error?.message || "No se pudo enviar el código. Inténtalo otra vez.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ status, isSubmitting, errors, touched, values }) => {
              const nombreInvalid = Boolean(touched.nombre && errors.nombre);
              const apellidoInvalid = Boolean(touched.apellido && errors.apellido);
              const emailInvalid = Boolean(touched.email && errors.email);
              const passInvalid = Boolean(touched.password && errors.password);
              const telInvalid = Boolean(touched.telefono && errors.telefono);

              const pwd = values.password || "";
              const checks = {
                len: pwd.length >= 8, // ✅ ya no mostramos 72 en UI
                lower: /[a-z]/.test(pwd),
                upper: /[A-Z]/.test(pwd),
                num: /[0-9]/.test(pwd),
                special: /[^\w\s]/.test(pwd),
                nospace: !/\s/.test(pwd),
              };
              const allOk = Object.values(checks).every(Boolean);

              // score simple para “barra”
              const score = Object.values(checks).filter(Boolean).length; // 0..6
              const pct = Math.round((score / 6) * 100);

              const meterLabel =
                pct >= 100 ? "Fuerte" : pct >= 67 ? "Buena" : pct >= 34 ? "Regular" : "Débil";

              return (
                <Form className="auth-form" noValidate>
                  <div className="auth-grid-2">
                    <div className="auth-field">
                      <label className="auth-label" htmlFor="nombre">
                        Nombre
                      </label>

                      <div className={`auth-input-wrap ${nombreInvalid ? "is-invalid" : ""}`}>
                        <span className="auth-input-icon" aria-hidden="true">
                          <HiOutlineUser />
                        </span>

                        <Field
                          id="nombre"
                          name="nombre"
                          className="auth-input"
                          placeholder="Tu nombre"
                          autoComplete="given-name"
                          aria-invalid={nombreInvalid ? "true" : "false"}
                        />
                      </div>

                      <ErrorMessage name="nombre" component="div" className="auth-error" />
                    </div>

                    <div className="auth-field">
                      <label className="auth-label" htmlFor="apellido">
                        Apellido
                      </label>

                      <div className={`auth-input-wrap ${apellidoInvalid ? "is-invalid" : ""}`}>
                        <span className="auth-input-icon" aria-hidden="true">
                          <HiOutlineUser />
                        </span>

                        <Field
                          id="apellido"
                          name="apellido"
                          className="auth-input"
                          placeholder="Tu apellido"
                          autoComplete="family-name"
                          aria-invalid={apellidoInvalid ? "true" : "false"}
                        />
                      </div>

                      <ErrorMessage name="apellido" component="div" className="auth-error" />
                    </div>
                  </div>

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
                        name="email"
                        type="email"
                        className="auth-input"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        inputMode="email"
                        aria-invalid={emailInvalid ? "true" : "false"}
                      />
                    </div>

                    <ErrorMessage name="email" component="div" className="auth-error" />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="password">
                      Contraseña (segura)
                    </label>

                    <div className={`auth-input-wrap ${passInvalid ? "is-invalid" : ""}`}>
                      <span className="auth-input-icon" aria-hidden="true">
                        <HiOutlineLockClosed />
                      </span>

                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className="auth-input"
                        placeholder="Ej: EcoSteps#2026"
                        autoComplete="new-password"
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

                    <ErrorMessage name="password" component="div" className="auth-error" />

                    {/* ✅ Bloque profesional: barra + chips */}
                    <div className="pwd-box" aria-live="polite">
                      <div className="pwd-top">
                        <div className="pwd-title">
                          Requisitos <span className={`pwd-state ${allOk ? "ok" : "warn"}`}>{allOk ? "Cumplidos" : "Pendientes"}</span>
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
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="telefono">
                      Teléfono
                    </label>

                    <div className={`auth-input-wrap ${telInvalid ? "is-invalid" : ""}`}>
                      <span className="auth-input-icon" aria-hidden="true">
                        <HiOutlinePhone />
                      </span>

                      <Field
                        id="telefono"
                        name="telefono"
                        className="auth-input"
                        placeholder="3312345678"
                        autoComplete="tel"
                        inputMode="tel"
                        aria-invalid={telInvalid ? "true" : "false"}
                      />
                    </div>

                    <ErrorMessage name="telefono" component="div" className="auth-error" />
                  </div>

                  {status && (
                    <div className="auth-alert" role="alert" aria-live="polite">
                      {status}
                    </div>
                  )}

                  <button type="submit" className="auth-btn auth-btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="auth-btn-loading">
                        <span className="auth-spinner" aria-hidden="true" />
                        Enviando código...
                      </span>
                    ) : (
                      "Enviar código al correo"
                    )}
                  </button>

                  <div className="auth-link">
                    <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
                  </div>

                  <div className="auth-footer-note">
                    <small>Te enviaremos un código de verificación. Si no lo ves, revisa spam.</small>
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

export default Register;