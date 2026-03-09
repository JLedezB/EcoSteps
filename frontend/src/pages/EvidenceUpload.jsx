import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowUpTray,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

import { uploadEvidence } from "../services/evidenceService";
import "../styles/evidenceupload.css";

const MAX_MB = 6;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const TYPE_TABS = [
  { key: "jpeg", label: "JPG", accept: "image/jpeg" },
  { key: "png", label: "PNG", accept: "image/png" },
  { key: "webp", label: "WEBP", accept: "image/webp" },
];

function formatBytes(bytes = 0) {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function extHint(mime) {
  if (mime === "image/jpeg") return "JPG";
  if (mime === "image/png") return "PNG";
  if (mime === "image/webp") return "WEBP";
  return mime || "";
}

export default function EvidenceUpload() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const fileRef = useRef(null);

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [tab, setTab] = useState("jpeg");

  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const activeTab = useMemo(() => TYPE_TABS.find((t) => t.key === tab) || TYPE_TABS[0], [tab]);
  const allowedSet = useMemo(() => new Set([activeTab.accept]), [activeTab]);
  const acceptStr = activeTab.accept;

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetFileInput = useCallback(() => {
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const validateFile = useCallback(
    (f) => {
      if (!f) return "Selecciona una imagen.";
      if (!allowedSet.has(f.type)) return `Formato inválido. Selecciona ${activeTab.label}.`;
      if (f.size > MAX_BYTES) return `Máximo ${MAX_MB}MB.`;
      return null;
    },
    [allowedSet, activeTab]
  );

  const setFileSafe = useCallback(
    (f) => {
      const err = validateFile(f);
      if (err) {
        setAlert({ type: "danger", text: err });
        setFile(null);
        resetFileInput();
        return;
      }
      setAlert(null);
      setFile(f);
    },
    [validateFile, resetFileInput]
  );

  useEffect(() => {
    if (!file) return;
    if (!allowedSet.has(file.type)) {
      setFile(null);
      resetFileInput();
      setAlert({
        type: "danger",
        text: `Cambiaste el tipo a ${activeTab.label}. Selecciona un archivo ${activeTab.label}.`,
      });
    }
  }, [tab, file, allowedSet, activeTab, resetFileInput]);

  const handleFileChange = useCallback(
    (e) => {
      const f = e.target.files?.[0] || null;
      if (!f) return;
      setFileSafe(f);
    },
    [setFileSafe]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (uploading) return;

      const f = e.dataTransfer?.files?.[0] || null;
      if (!f) return;
      setFileSafe(f);
    },
    [setFileSafe, uploading]
  );

  const onDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!uploading) setDragOver(true);
    },
    [uploading]
  );

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setAlert(null);
    resetFileInput();
  }, [resetFileInput]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const err = validateFile(file);
      if (err) {
        setAlert({ type: "danger", text: err });
        return;
      }

      try {
        setUploading(true);
        setAlert(null);

        const res = await uploadEvidence({
          activityId,
          caption: caption?.trim(),
          file,
        });

        setAlert({
          type: "success",
          text: res?.message || "Evidencia subida correctamente. Quedó pendiente de revisión.",
        });

        setCaption("");
        setFile(null);
        resetFileInput();

        setTimeout(() => navigate("/user"), 900);
      } catch (err2) {
        setAlert({ type: "danger", text: err2?.message || "Error al subir evidencia" });
      } finally {
        setUploading(false);
        setDragOver(false);
      }
    },
    [validateFile, file, activityId, caption, resetFileInput, navigate]
  );

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <section className="ev-shell" aria-label="Subir evidencia">
          <header className="ev-hero">
            <div className="ev-hero-copy">
              <span className="ev-kicker">EVIDENCIAS</span>
              <h1 className="ev-title">Subir evidencia</h1>
              <p className="ev-subtitle">
                Adjunta una imagen clara de tu actividad para que el administrador pueda revisarla
                y aprobarla más rápido.
              </p>
            </div>

            <div className="ev-hero-actions">
              <button
                className="ev-btn ev-btn-ghost"
                type="button"
                onClick={() => navigate("/user")}
                disabled={uploading}
              >
                <HiOutlineArrowLeft />
                <span>Volver</span>
              </button>
            </div>
          </header>

          {alert?.text ? (
            <div className={`ev-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
              <span className="ev-alert-icon" aria-hidden="true">
                {alert.type === "success" ? <HiOutlineCheckCircle /> : <HiOutlineInformationCircle />}
              </span>
              <span>{alert.text}</span>
            </div>
          ) : null}

          <div className="ev-main-card">
            <div className="ev-main-head">
              <div>
                <div className="ev-main-chip">CONFIGURACIÓN DE ARCHIVO</div>
                <h2 className="ev-main-title">Selecciona el formato permitido</h2>
              </div>

              <div className="ev-format-note">
                Máximo <strong>{MAX_MB}MB</strong> · Permitido ahora: <strong>{activeTab.label}</strong>
              </div>
            </div>

            <div className="ev-tabs" role="tablist" aria-label="Tipo de archivo">
              {TYPE_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`ev-tab ${tab === t.key ? "is-active" : ""}`}
                  onClick={() => setTab(t.key)}
                  disabled={uploading}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ev-grid">
              <form className="ev-form" onSubmit={handleSubmit} noValidate>
                <section className="ev-block ev-upload-block">
                  <div className="ev-block-head">
                    <div>
                      <div className="ev-label">Imagen *</div>
                      <div className="ev-block-sub">
                        Arrastra un archivo o selecciónalo manualmente desde tu equipo.
                      </div>
                    </div>
                  </div>

                  <div
                    className={`ev-drop ${dragOver ? "is-over" : ""} ${file ? "has-file" : ""}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                    }}
                    aria-label="Zona para arrastrar y soltar imagen"
                  >
                    <div className="ev-drop-ico" aria-hidden="true">
                      <HiOutlineArrowUpTray />
                    </div>

                    <div className="ev-drop-main">
                      <div className="ev-drop-title">
                        Arrastra tu imagen aquí o <span>selecciona un archivo</span>
                      </div>

                      <div className="ev-drop-sub">
                        {file
                          ? `${file.name} · ${formatBytes(file.size)} · ${extHint(file.type)}`
                          : `Solo ${activeTab.label} · Máximo ${MAX_MB}MB`}
                      </div>
                    </div>

                    <input
                      ref={fileRef}
                      type="file"
                      accept={acceptStr}
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="ev-file"
                    />
                  </div>

                  {file ? (
                    <div className="ev-meta">
                      <span className="ev-pill ev-pill-ok">
                        <HiOutlineCheckCircle />
                        <span>Archivo listo para subir</span>
                      </span>

                      <button
                        className="ev-btn ev-btn-ghost ev-btn-sm"
                        type="button"
                        onClick={clearFile}
                        disabled={uploading}
                      >
                        <HiOutlineXMark />
                        <span>Quitar imagen</span>
                      </button>
                    </div>
                  ) : null}
                </section>

                <section className="ev-block">
                  <div className="ev-block-head">
                    <div>
                      <div className="ev-label">Descripción (opcional)</div>
                      <div className="ev-block-sub">
                        Agrega contexto breve para facilitar la aprobación.
                      </div>
                    </div>
                  </div>

                  <textarea
                    className="ev-textarea"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ej. Participé en jornada de limpieza del parque, recolecté residuos y apoyé en organización del área. Guadalajara, 13/03/2026."
                    disabled={uploading}
                  />

                  <div className="ev-help">
                    Incluye <strong>qué hiciste</strong>, <strong>dónde</strong> y, si aplica, la{" "}
                    <strong>fecha</strong>.
                  </div>
                </section>

                <div className="ev-actions">
                  <button className="ev-btn ev-btn-primary" type="submit" disabled={uploading || !file}>
                    <HiOutlineArrowUpTray />
                    <span>{uploading ? "Subiendo..." : "Subir evidencia"}</span>
                  </button>

                  <button
                    className="ev-btn ev-btn-ghost"
                    type="button"
                    onClick={() => navigate("/user")}
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              <aside className="ev-side" aria-label="Vista previa">
                <div className="ev-panel">
                  <div className="ev-panel-head">
                    <div className="ev-panel-title">Vista previa</div>
                    <div className="ev-panel-sub">Confirma que la imagen sea clara antes de enviarla.</div>
                  </div>

                  <div className="ev-panel-body">
                    {previewUrl ? (
                      <img className="ev-previewImg" src={previewUrl} alt="Vista previa de evidencia" />
                    ) : (
                      <div className="ev-empty">
                        <div className="ev-empty-ico" aria-hidden="true">
                          <HiOutlinePhoto />
                        </div>
                        <div className="ev-empty-title">Sin imagen seleccionada</div>
                        <div className="ev-empty-sub">
                          Cuando elijas un archivo, aquí aparecerá la vista previa.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ev-panel ev-panel-mini">
                  <div className="ev-panel-head">
                    <div className="ev-panel-title">Recomendaciones</div>
                  </div>

                  <div className="ev-panel-body">
                    <ul className="ev-tips">
                      <li>Usa una imagen nítida y bien iluminada.</li>
                      <li>Evita capturas borrosas o recortadas.</li>
                      <li>Procura que la actividad sea fácil de identificar.</li>
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}