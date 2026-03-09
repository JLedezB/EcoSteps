import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowUpTray,
  HiOutlineArrowLeft,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineCheckCircle,
  HiOutlinePhoto,
  HiOutlineDocument,
  HiOutlineInformationCircle,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

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

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const MIME = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp"],
};

const ALL_ALLOWED = new Set([...MIME.pdf, ...MIME.image]);

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
  const [fileKind, setFileKind] = useState("any"); // any | pdf | image
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const userName = useMemo(() => {
    const nombre = user?.nombre || user?.name || "";
    const apellido = user?.apellido || "";
    const full = `${nombre} ${apellido}`.trim();
    return full || user?.email || "Usuario";
  }, [user]);

  const userInitial = useMemo(() => {
    return (userName || "U").charAt(0).toUpperCase();
  }, [userName]);

  const accept = useMemo(() => {
    if (fileKind === "pdf") return MIME.pdf.join(",");
    if (fileKind === "image") return MIME.image.join(",");
    return [...ALL_ALLOWED].join(",");
  }, [fileKind]);

  const allowedSet = useMemo(() => {
    if (fileKind === "pdf") return new Set(MIME.pdf);
    if (fileKind === "image") return new Set(MIME.image);
    return ALL_ALLOWED;
  }, [fileKind]);

  const typeLabel = useMemo(() => {
    if (fileKind === "pdf") return "PDF";
    if (fileKind === "image") return "Imágenes";
    return "PDF o imágenes";
  }, [fileKind]);

  const typeHint = useMemo(() => {
    if (fileKind === "pdf") return `Solo PDF · Máx. ${MAX_MB}MB`;
    if (fileKind === "image") return `JPG / PNG / WEBP · Máx. ${MAX_MB}MB`;
    return `PDF / JPG / PNG / WEBP · Máx. ${MAX_MB}MB`;
  }, [fileKind]);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
      type: mimeHint(file.type),
    };
  }, [file]);

  const currentBimestreLabel = useMemo(() => {
    if (bimestre === "1") return "Bimestre 1";
    if (bimestre === "2") return "Bimestre 2";
    return "Bimestre 3";
  }, [bimestre]);

  const acceptedFormatsText = useMemo(() => {
    if (fileKind === "pdf") return "PDF";
    if (fileKind === "image") return "JPG, PNG, WEBP";
    return "PDF, JPG, PNG, WEBP";
  }, [fileKind]);

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const validateFile = (f) => {
    if (!f) return "Selecciona un archivo.";
    if (!allowedSet.has(f.type)) {
      if (fileKind === "pdf") return "Formato no permitido. Selecciona un PDF.";
      if (fileKind === "image") return "Formato no permitido. Usa JPG, PNG o WEBP.";
      return "Formato no permitido. Usa PDF, JPG, PNG o WEBP.";
    }
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

  const onPickKind = (kind) => {
    if (loading) return;
    setFileKind(kind);
    if (file) setFileSafe(file);
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
        text: `✅ ${res?.message || "Reporte enviado correctamente."} Quedó pendiente de revisión.`,
      });

      setFile(null);
      resetFileInput();

      setTimeout(() => go(ROUTES.dashboard), 900);
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
    <div className="ru-page">
      <div className="ru-shell">
        {/* SIDEBAR */}
        <aside className="ru-sidebar" aria-label="Navegación principal">
          <div className="ru-sidebar-top">
            <button
              type="button"
              className="ru-brand"
              onClick={() => go(ROUTES.dashboard)}
              aria-label="Ir al dashboard"
            >
              <span className="ru-brand-icon" aria-hidden="true">
                <FaLeaf />
              </span>

              <span className="ru-brand-copy">
                <span className="ru-brand-title">EcoSteps</span>
                <span className="ru-brand-subtitle">SGSS • Panel estudiante</span>
              </span>
            </button>
          </div>

          <nav className="ru-nav" aria-label="Menú lateral">
            <button type="button" className="ru-nav-item" onClick={() => go(ROUTES.dashboard)}>
              <HiOutlineChartBar className="ru-nav-ico" />
              <span>Dashboard</span>
            </button>

            <button type="button" className="ru-nav-item is-active" onClick={() => go(ROUTES.report)}>
              <HiOutlineDocumentText className="ru-nav-ico" />
              <span>Subir reporte</span>
            </button>

            <button type="button" className="ru-nav-item" onClick={() => go(ROUTES.tickets)}>
              <HiOutlineTicket className="ru-nav-ico" />
              <span>Tickets</span>
            </button>

            <button type="button" className="ru-nav-item" onClick={() => go(ROUTES.help)}>
              <HiOutlineSparkles className="ru-nav-ico" />
              <span>EcoBot</span>
            </button>
          </nav>

          <div className="ru-sidebar-bottom">
            <div className="ru-usercard">
              <div className="ru-usercard-top">
                <div className="ru-user-avatar" aria-hidden="true">
                  {userInitial}
                </div>

                <div className="ru-user-meta">
                  <div className="ru-user-label">Sesión activa</div>
                  <div className="ru-user-name">{userName}</div>
                  <div className="ru-user-role">Servicio social activo</div>
                </div>
              </div>

              <div className="ru-user-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ru-main" aria-label="Subir reporte bimestral">
          {/* HERO / HEADER */}
          <section className="ru-hero">
            <div className="ru-hero-copy">
              <span className="ru-kicker">ENTREGA DE REPORTE</span>
              <h1 className="ru-hero-title">Subir reporte bimestral</h1>
              <p className="ru-hero-text">
                Envía tu archivo de forma clara y ordenada. Cuando sea aprobado por administración,
                las horas se reflejarán automáticamente en tu avance.
              </p>

              <div className="ru-hero-actions">
                <button
                  className="ru-btn ru-btn-primary"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                >
                  <HiOutlineArrowUpTray />
                  <span>Seleccionar archivo</span>
                </button>

                <button
                  className="ru-btn ru-btn-secondary"
                  type="button"
                  onClick={() => go(ROUTES.dashboard)}
                  disabled={loading}
                >
                  <HiOutlineArrowLeft />
                  <span>Volver al dashboard</span>
                </button>
              </div>
            </div>

            <div className="ru-hero-panel">
              <div className="ru-stat-card">
                <span className="ru-stat-label">Bimestre</span>
                <strong className="ru-stat-value">{currentBimestreLabel}</strong>
              </div>

              <div className="ru-stat-card">
                <span className="ru-stat-label">Formato</span>
                <strong className="ru-stat-value">{typeLabel}</strong>
              </div>

              <div className="ru-stat-card">
                <span className="ru-stat-label">Límite</span>
                <strong className="ru-stat-value">{MAX_MB} MB</strong>
              </div>
            </div>
          </section>

          {alert?.text && (
            <div
              className={`ru-alert ${alert.type === "success" ? "is-success" : "is-danger"}`}
              role="alert"
            >
              {alert.text}
            </div>
          )}

          {/* CONTENT GRID */}
          <section className="ru-content-grid">
            {/* LEFT */}
            <div className="ru-content-main">
              <form className="ru-card ru-form-card" onSubmit={onSubmit} noValidate>
                <div className="ru-card-head">
                  <div>
                    <div className="ru-card-kicker">Formulario</div>
                    <h2 className="ru-card-title">Configuración del reporte</h2>
                    <p className="ru-card-text">
                      Define el bimestre, el tipo de archivo y carga el documento que deseas enviar.
                    </p>
                  </div>
                </div>

                <div className="ru-form-grid">
                  {/* Bimestre */}
                  <div className="ru-field">
                    <label className="ru-label">Bimestre</label>
                    <select
                      className="ru-select"
                      value={bimestre}
                      onChange={(e) => setBimestre(e.target.value)}
                      disabled={loading}
                      aria-label="Selecciona bimestre"
                    >
                      <option value="1">Bimestre 1 (160h)</option>
                      <option value="2">Bimestre 2 (160h)</option>
                      <option value="3">Bimestre 3 (160h)</option>
                    </select>
                    <p className="ru-help">
                      Selecciona exactamente el periodo al que pertenece tu entrega.
                    </p>
                  </div>

                  {/* Tipo */}
                  <div className="ru-field">
                    <div className="ru-field-head">
                      <label className="ru-label">Tipo de archivo</label>
                      <span className="ru-field-mini">{acceptedFormatsText}</span>
                    </div>

                    <div className="ru-typebar" role="tablist" aria-label="Filtro de tipo de archivo">
                      <button
                        type="button"
                        className={`ru-typebtn ${fileKind === "any" ? "is-active" : ""}`}
                        onClick={() => onPickKind("any")}
                        disabled={loading}
                        role="tab"
                        aria-selected={fileKind === "any"}
                      >
                        Todos
                      </button>

                      <button
                        type="button"
                        className={`ru-typebtn ${fileKind === "pdf" ? "is-active" : ""}`}
                        onClick={() => onPickKind("pdf")}
                        disabled={loading}
                        role="tab"
                        aria-selected={fileKind === "pdf"}
                      >
                        PDF
                      </button>

                      <button
                        type="button"
                        className={`ru-typebtn ${fileKind === "image" ? "is-active" : ""}`}
                        onClick={() => onPickKind("image")}
                        disabled={loading}
                        role="tab"
                        aria-selected={fileKind === "image"}
                      >
                        Imágenes
                      </button>
                    </div>

                    <p className="ru-help">{typeHint}</p>
                  </div>
                </div>

                {/* Dropzone */}
                <div className="ru-field">
                  <label className="ru-label">Archivo</label>

                  <div
                    className={`ru-dropzone ${dragOver ? "is-over" : ""} ${file ? "has-file" : ""}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                    }}
                    aria-label="Zona para arrastrar y soltar archivo"
                  >
                    <div className="ru-drop-icon" aria-hidden="true">
                      <HiOutlineArrowUpTray />
                    </div>

                    <div className="ru-drop-copy">
                      <div className="ru-drop-title">
                        Arrastra tu archivo aquí o <span>haz clic para seleccionarlo</span>
                      </div>

                      <div className="ru-drop-subtitle">
                        {fileMeta
                          ? `${fileMeta.name} • ${fileMeta.size} • ${fileMeta.type}`
                          : `Formatos permitidos: ${acceptedFormatsText} · Máximo ${MAX_MB}MB`}
                      </div>
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept={accept}
                      onChange={onFileChange}
                      disabled={loading}
                      className="ru-file-input"
                    />
                  </div>

                  {!fileMeta && (
                    <p className="ru-help">
                      Recomendación: sube un archivo legible y con nombre claro para facilitar la revisión.
                    </p>
                  )}

                  {fileMeta && (
                    <div className="ru-file-card">
                      <div className="ru-file-card-left">
                        <div className="ru-file-badge" aria-hidden="true">
                          {file.type === "application/pdf" ? <HiOutlineDocument /> : <HiOutlinePhoto />}
                        </div>

                        <div className="ru-file-info">
                          <div className="ru-file-name">{fileMeta.name}</div>
                          <div className="ru-file-meta">
                            {fileMeta.type} · {fileMeta.size}
                          </div>
                        </div>
                      </div>

                      <div className="ru-file-card-right">
                        <span className="ru-chip ru-chip-success">
                          <HiOutlineCheckCircle />
                          <span>Listo para enviar</span>
                        </span>

                        <button
                          type="button"
                          className="ru-icon-btn"
                          onClick={clearFile}
                          disabled={loading}
                          aria-label="Quitar archivo"
                          title="Quitar archivo"
                        >
                          <HiOutlineXMark />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ru-form-actions">
                  <button className="ru-btn ru-btn-primary" type="submit" disabled={loading || !file}>
                    <HiOutlineArrowUpTray />
                    <span>{loading ? "Subiendo..." : "Enviar reporte"}</span>
                  </button>

                  <button
                    className="ru-btn ru-btn-secondary"
                    type="button"
                    onClick={() => go(ROUTES.dashboard)}
                    disabled={loading}
                  >
                    <HiOutlineArrowLeft />
                    <span>Cancelar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT */}
            <aside className="ru-content-side" aria-label="Resumen y ayuda">
              <div className="ru-card">
                <div className="ru-side-head">
                  <HiOutlineInformationCircle />
                  <h3>Resumen de envío</h3>
                </div>

                <div className="ru-summary-list">
                  <div className="ru-summary-row">
                    <span>Periodo</span>
                    <strong>{currentBimestreLabel}</strong>
                  </div>

                  <div className="ru-summary-row">
                    <span>Tipo seleccionado</span>
                    <strong>{typeLabel}</strong>
                  </div>

                  <div className="ru-summary-row">
                    <span>Tamaño máximo</span>
                    <strong>{MAX_MB} MB</strong>
                  </div>

                  <div className="ru-summary-row">
                    <span>Estado</span>
                    <strong>{file ? "Listo para envío" : "Pendiente de archivo"}</strong>
                  </div>
                </div>
              </div>

              <div className="ru-card">
                <div className="ru-side-head">
                  <HiOutlineShieldCheck />
                  <h3>Requisitos</h3>
                </div>

                <ul className="ru-list">
                  <li>Selecciona el bimestre correcto antes de enviar.</li>
                  <li>Usa archivos dentro del límite permitido.</li>
                  <li>Respeta el formato filtrado: {acceptedFormatsText}.</li>
                  <li>Verifica que el archivo sea legible y completo.</li>
                </ul>
              </div>

              <div className="ru-card">
                <div className="ru-side-head">
                  <HiOutlineClock />
                  <h3>Importante</h3>
                </div>

                <p className="ru-side-text">
                  Una vez aprobado por administración, el sistema reflejará automáticamente las horas
                  correspondientes en tu progreso de servicio social.
                </p>
              </div>

              <div className="ru-card ru-card-soft">
                <div className="ru-side-head">
                  <HiOutlineUserCircle />
                  <h3>Consejo</h3>
                </div>

                <p className="ru-side-text">
                  Para una revisión más rápida, nombra tu archivo con tu nombre completo y el bimestre,
                  por ejemplo: <strong>Joaquin_Ledezma_Bimestre1.pdf</strong>
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}