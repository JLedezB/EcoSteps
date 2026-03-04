import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import LogoutButton from "../components/LogoutButton";
import { uploadReport } from "../services/reportService";

import "../styles/reportupload.css";

const ROUTES = {
  dashboard: "/user",
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
};

const MAX_MB = 10; // ajusta a tu backend si aplica
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function formatBytes(bytes = 0) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function mimeHint(mime) {
  if (mime === "application/pdf") return "PDF";
  if (mime === "image/jpeg") return "JPG";
  if (mime === "image/png") return "PNG";
  if (mime === "image/webp") return "WEBP";
  return mime || "—";
}

export default function ReportUpload() {
  const navigate = useNavigate();
  const go = useCallback((path) => navigate(path), [navigate]);

  const { user } = useContext(AuthContext);

  const fileRef = useRef(null);

  const [bimestre, setBimestre] = useState("1");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const userName = useMemo(() => {
    const nombre = user?.nombre || user?.name || "";
    const apellido = user?.apellido || "";
    const full = `${nombre} ${apellido}`.trim();
    return full || user?.email || "Usuario";
  }, [user]);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
      type: mimeHint(file.type),
    };
  }, [file]);

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const validateFile = (f) => {
    if (!f) return "Selecciona un archivo (PDF o imagen).";
    if (!ALLOWED_MIME.has(f.type))
      return "Formato no permitido. Usa PDF, JPG, PNG o WEBP.";
    if (f.size > MAX_BYTES) return `Máximo ${MAX_MB}MB.`;
    return null;
  };

  const setFileSafe = (f) => {
    const err = validateFile(f);
    if (err) {
      setAlert({ type: "danger", text: `❌ ${err}` });
      setFile(null);
      resetFileInput();
      return;
    }
    setAlert(null);
    setFile(f);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFileSafe(f);
  };

  const clearFile = () => {
    setFile(null);
    setAlert(null);
    resetFileInput();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (loading) return;

    const f = e.dataTransfer?.files?.[0] || null;
    if (!f) return;
    setFileSafe(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const err = validateFile(file);
    if (err) {
      setAlert({ type: "danger", text: `❌ ${err}` });
      return;
    }

    try {
      setAlert(null);
      setLoading(true);

      const res = await uploadReport({ bimestre, file });

      setAlert({
        type: "success",
        text: `✅ ${
          res?.message || "Reporte enviado correctamente."
        } (pendiente de revisión)`,
      });

      setFile(null);
      resetFileInput();

      setTimeout(() => go(ROUTES.dashboard), 800);
    } catch (err2) {
      setAlert({
        type: "danger",
        text: `❌ ${err2?.message || "Error al subir el reporte."}`,
      });
    } finally {
      setLoading(false);
      setDragOver(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        {/* SIDEBAR */}
        <aside className="dash-sidebar" aria-label="Navegación">
          <div className="dash-sidebar-head">
            <div className="dash-brand">
              <span className="dash-brand-icon" aria-hidden="true">
                🌿
              </span>
              <div>
                <div className="dash-brand-name">EcoSteps</div>
                <div className="dash-brand-sub">SGSS • Panel estudiante</div>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            <button
              type="button"
              className="dash-nav-item"
              onClick={() => go(ROUTES.dashboard)}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="dash-nav-item is-active"
              onClick={() => go(ROUTES.report)}
            >
              Subir reporte
            </button>

            <button
              type="button"
              className="dash-nav-item"
              onClick={() => go(ROUTES.tickets)}
            >
              Tickets
            </button>

            <button
              type="button"
              className="dash-nav-item"
              onClick={() => go(ROUTES.help)}
            >
              EcoBot
            </button>
          </nav>

          <div className="dash-sidebar-foot">
            <div className="dash-profile">
              <div className="dash-profile-label">Sesión</div>
              <div className="dash-profile-name">{userName}</div>
              <div className="dash-profile-sub">Servicio Social Activo</div>

              <div className="dash-profile-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="dash-main" aria-label="Subir reporte bimestral">
          <section className="dash-card">
            <div className="dash-top">
              <div>
                <h2 className="dash-title">Subir reporte bimestral</h2>
                <p className="dash-subtitle">
                  Sube tu <strong>PDF</strong> o <strong>imagen</strong>. El admin
                  debe aprobarlo para sumar horas.
                </p>
              </div>

              <div className="dash-top-actions">
                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={() => go(ROUTES.dashboard)}
                  disabled={loading}
                  title="Volver al dashboard"
                >
                  Volver
                </button>
              </div>
            </div>

            {alert?.text && (
              <div
                className={`dash-alert ${
                  alert.type === "success" ? "is-success" : "is-danger"
                }`}
                role="alert"
              >
                {alert.text}
              </div>
            )}

            <form className="dash-upload" onSubmit={onSubmit} noValidate>
              {/* Bimestre */}
              <div className="dash-upload-block">
                <div className="dash-upload-label">Bimestre *</div>

                {/* ✅ FIX: NO uses dash-textarea en select */}
                <select
                  className="dash-select"
                  value={bimestre}
                  onChange={(e) => setBimestre(e.target.value)}
                  disabled={loading}
                  aria-label="Selecciona bimestre"
                >
                  <option value="1">Bimestre 1 (160h)</option>
                  <option value="2">Bimestre 2 (160h)</option>
                  <option value="3">Bimestre 3 (160h)</option>
                </select>

                <div className="dash-help">
                  Sube el archivo correspondiente al bimestre elegido.
                </div>
              </div>

              {/* Archivo */}
              <div className="dash-upload-block">
                <div className="dash-upload-label">Archivo *</div>

                <div
                  className={`dash-drop ${dragOver ? "is-over" : ""} ${
                    file ? "has-file" : ""
                  }`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileRef.current?.click();
                  }}
                  aria-label="Zona para arrastrar y soltar archivo"
                >
                  <div className="dash-drop-icon" aria-hidden="true">
                    ⬆️
                  </div>

                  <div className="dash-drop-main">
                    <div className="dash-drop-title">
                      Arrastra tu archivo aquí o{" "}
                      <span>selecciona un archivo</span>
                    </div>

                    <div className="dash-drop-sub">
                      {fileMeta
                        ? `Seleccionado: ${fileMeta.name} • ${fileMeta.size} • ${fileMeta.type}`
                        : `PDF/JPG/PNG/WEBP · Máx. ${MAX_MB}MB`}
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={onFileChange}
                    disabled={loading}
                    className="dash-file"
                  />
                </div>

                {fileMeta ? (
                  <div className="dash-upload-meta">
                    <span className="dash-pill dash-pill-ok">
                      Listo para enviar
                    </span>

                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={clearFile}
                      disabled={loading}
                      title="Quitar archivo"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="dash-help">
                    Tip: usa un PDF legible con tu nombre completo para acelerar
                    la revisión.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="dash-upload-actions">
                <button
                  className="dash-btn dash-btn-primary"
                  type="submit"
                  disabled={loading || !file}
                >
                  {loading ? "Subiendo..." : "Enviar reporte"}
                </button>

                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={() => go(ROUTES.dashboard)}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>

              {/* Nota */}
              <div className="dash-note">
                <div className="dash-note-title">✅ Importante</div>
                <div className="dash-note-text">
                  Cuando el admin apruebe tu reporte, se sumarán horas
                  automáticamente a tu progreso.
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}