import "../styles/auth.css";

import { FaLeaf } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { requestRegisterCode } from "../services/authService";

const RegisterSchema = Yup.object().shape({
  nombre: Yup.string().required("Obligatorio"),
  apellido: Yup.string().required("Obligatorio"),
  email: Yup.string().email("Correo inválido").required("Obligatorio"),
  password: Yup.string().min(6, "Mínimo 6 caracteres").required("Obligatorio"),
  telefono: Yup.string().required("Obligatorio"),
});

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-elevated auth-card-animate">
        <div className="auth-brand">
          <h1 className="auth-title">
            EcoSteps SGSS <FaLeaf className="auth-leaf" />
          </h1>
          <p className="auth-subtitle">Verifica tu correo para crear tu cuenta</p>
        </div>

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

              // 1) pedir código
              await requestRegisterCode(values.email);

              // 2) guardar datos temporalmente (para confirmación)
              sessionStorage.setItem(
                "pendingRegister",
                JSON.stringify({
                  nombre: values.nombre,
                  apellido: values.apellido,
                  email: values.email,
                  password: values.password,
                  telefono: values.telefono,
                })
              );

              // 3) ir a confirmación
              navigate("/confirm-email", { replace: true });
            } catch (error) {
              setStatus(error?.message || "Error al enviar código");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ status, isSubmitting, errors, touched }) => (
            <Form className="auth-form">
              <div className="auth-grid-2">
                <div className="mb-3">
                  <label className="auth-label" htmlFor="nombre">
                    Nombre
                  </label>

                  <div className={`auth-input-wrap ${touched.nombre && errors.nombre ? "is-invalid" : ""}`}>
                    <span className="auth-input-icon">
                      <HiOutlineUser />
                    </span>

                    <Field
                      id="nombre"
                      name="nombre"
                      className="form-control auth-input"
                      placeholder="Tu nombre"
                      autoComplete="given-name"
                    />
                  </div>

                  <ErrorMessage name="nombre" component="div" className="text-danger small mt-1" />
                </div>

                <div className="mb-3">
                  <label className="auth-label" htmlFor="apellido">
                    Apellido
                  </label>

                  <div className={`auth-input-wrap ${touched.apellido && errors.apellido ? "is-invalid" : ""}`}>
                    <span className="auth-input-icon">
                      <HiOutlineUser />
                    </span>

                    <Field
                      id="apellido"
                      name="apellido"
                      className="form-control auth-input"
                      placeholder="Tu apellido"
                      autoComplete="family-name"
                    />
                  </div>

                  <ErrorMessage name="apellido" component="div" className="text-danger small mt-1" />
                </div>
              </div>

              <div className="mb-3">
                <label className="auth-label" htmlFor="email">
                  Correo
                </label>

                <div className={`auth-input-wrap ${touched.email && errors.email ? "is-invalid" : ""}`}>
                  <span className="auth-input-icon">
                    <HiOutlineMail />
                  </span>

                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="form-control auth-input"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                  />
                </div>

                <ErrorMessage name="email" component="div" className="text-danger small mt-1" />
              </div>

              <div className="mb-3">
                <label className="auth-label" htmlFor="password">
                  Contraseña
                </label>

                <div className={`auth-input-wrap ${touched.password && errors.password ? "is-invalid" : ""}`}>
                  <span className="auth-input-icon">
                    <HiOutlineLockClosed />
                  </span>

                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="form-control auth-input"
                    placeholder="Mínimo 6 caracteres"
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

                <ErrorMessage name="password" component="div" className="text-danger small mt-1" />
              </div>

              <div className="mb-3">
                <label className="auth-label" htmlFor="telefono">
                  Teléfono
                </label>

                <div className={`auth-input-wrap ${touched.telefono && errors.telefono ? "is-invalid" : ""}`}>
                  <span className="auth-input-icon">
                    <HiOutlinePhone />
                  </span>

                  <Field
                    id="telefono"
                    name="telefono"
                    className="form-control auth-input"
                    placeholder="3312345678"
                    autoComplete="tel"
                  />
                </div>

                <ErrorMessage name="telefono" component="div" className="text-danger small mt-1" />
              </div>

              {status && (
                <div className="auth-alert" role="alert">
                  {status}
                </div>
              )}

              <button type="submit" className="btn btn-eco w-100" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="d-inline-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Enviando código...
                  </span>
                ) : (
                  "Enviar código al correo"
                )}
              </button>

              <div className="auth-link">
                <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Register;
