import "../styles/auth.css";

import { FaLeaf } from "react-icons/fa";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { register } from "../services/authService";

const RegisterSchema = Yup.object().shape({
  nombre: Yup.string().required("Obligatorio"),
  apellido: Yup.string().required("Obligatorio"),
  email: Yup.string().email("Correo inválido").required("Obligatorio"),
  password: Yup.string().min(6, "Mínimo 6 caracteres").required("Obligatorio"),
  telefono: Yup.string().required("Obligatorio"),
  rol: Yup.string().required("Selecciona un rol"),
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
          <p className="auth-subtitle">Crea tu cuenta en menos de un minuto</p>
        </div>

        <Formik
          initialValues={{
            nombre: "",
            apellido: "",
            email: "",
            password: "",
            telefono: "",
            rol: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              setStatus(null);

              await register({
                nombre: values.nombre,
                apellido: values.apellido,
                email: values.email,
                password: values.password,
                telefono: values.telefono,
                role: values.rol,
              });

              navigate("/login", { replace: true });
            } catch (error) {
              setStatus(error?.message || "Error al registrar usuario");
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

                  <div
                    className={`auth-input-wrap ${
                      touched.nombre && errors.nombre ? "is-invalid" : ""
                    }`}
                  >
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

                  <ErrorMessage
                    name="nombre"
                    component="div"
                    className="text-danger small mt-1"
                  />
                </div>

                <div className="mb-3">
                  <label className="auth-label" htmlFor="apellido">
                    Apellido
                  </label>

                  <div
                    className={`auth-input-wrap ${
                      touched.apellido && errors.apellido ? "is-invalid" : ""
                    }`}
                  >
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

                  <ErrorMessage
                    name="apellido"
                    component="div"
                    className="text-danger small mt-1"
                  />
                </div>
              </div>

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
                    name="email"
                    type="email"
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

              <div className="mb-3">
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

                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-danger small mt-1"
                />
              </div>

              <div className="mb-3">
                <label className="auth-label" htmlFor="telefono">
                  Teléfono
                </label>

                <div
                  className={`auth-input-wrap ${
                    touched.telefono && errors.telefono ? "is-invalid" : ""
                  }`}
                >
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

                <ErrorMessage
                  name="telefono"
                  component="div"
                  className="text-danger small mt-1"
                />
              </div>

              <div className="mb-2">
                <label className="auth-label" htmlFor="rol">
                  Rol
                </label>

                <div
                  className={`auth-input-wrap ${
                    touched.rol && errors.rol ? "is-invalid" : ""
                  }`}
                >
                  <span className="auth-input-icon">
                    <HiOutlineIdentification />
                  </span>

                  <Field as="select" id="rol" name="rol" className="form-select auth-select">
                    <option value="">Selecciona rol</option>
                    <option value="user">Voluntario</option>
                    <option value="admin">Administrador</option>
                  </Field>
                </div>

                <ErrorMessage
                  name="rol"
                  component="div"
                  className="text-danger small mt-1"
                />
              </div>

              {status && (
                <div className="auth-alert" role="alert">
                  {status}
                </div>
              )}

              <button type="submit" className="btn btn-eco w-100" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="d-inline-flex align-items-center justify-content-center gap-2">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Registrando...
                  </span>
                ) : (
                  "Registrarse"
                )}
              </button>

              <div className="auth-link">
                <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
              </div>

              <div className="auth-footer-note">
                <small>Tu información se usa únicamente para la gestión de EcoSteps.</small>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Register;
