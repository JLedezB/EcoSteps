import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { uploadEvidence } from "../services/evidenceService";
import "../styles/evidenceupload.css";

const MAX_MB = 6;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
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

  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const validateFile = (f) => {
    if (!f) return "Selecciona una imagen.";
    if (!ALLOWED.has(f.type)) return "Solo se permiten imágenes (JPG, PNG, WEBP).";
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

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFileSafe(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (uploading) return;

    const f = e.dataTransfer?.files?.[0] || null;
    if (!f) return;
    setFileSafe(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const clearFile = () => {
    setFile(null);
    setAlert(null);
    resetFileInput();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validateFile(file);
    if (err) {
      setAlert({ type: "danger", text: `❌ ${err}` });
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
        text: `✅ ${res?.message || "Evidencia subida"} (pendiente de revisión)`,
      });

      setCaption("");
      setFile(null);
      resetFileInput();

      setTimeout(() => navigate("/user"), 900);
    } catch (err2) {
      setAlert({
        type: "danger",
        text: `❌ ${err2?.message || "Error al subir evidencia"}`,
      });
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <div className="dash-page">
      {/* ✅ IMPORTANTE: modo single (sin sidebar) */}
      <div className="dash-shell dash-shell--single">
        <main className="dash-main" aria-label="Subir evidencia">
          <section className="dash-card dash-card--narrow">
            <div className="dash-top">
              <div>
                <h2 className="dash-title">Subir evidencia</h2>
                <p className="dash-subtitle">
                  Formatos: <strong>JPG/PNG/WEBP</strong> · Máximo{" "}
                  <strong>{MAX_MB}MB</strong>
                </p>
              </div>

              <div className="dash-top-actions">
                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={() => navigate("/user")}
                  disabled={uploading}
                >
                  Volver
                </button>
              </div>
            </div>

            {alert?.text && (
              <div
                className={`dash-alert ${
                  alert.type === "success"
                    ? "is-success"
                    : alert.type === "danger"
                    ? "is-danger"
                    : ""
                }`}
                role="alert"
              >
                {alert.text}
              </div>
            )}

            <form className="dash-upload" onSubmit={handleSubmit} noValidate>
              <div className="dash-upload-block">
                <div className="dash-upload-label">Imagen *</div>

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
                  aria-label="Zona para arrastrar y soltar imagen"
                >
                  <div className="dash-drop-icon" aria-hidden="true">
                    ⬆️
                  </div>

                  <div className="dash-drop-main">
                    <div className="dash-drop-title">
                      Arrastra tu imagen aquí o <span>selecciona un archivo</span>
                    </div>
                    <div className="dash-drop-sub">
                      {file
                        ? `Seleccionado: ${file.name} • ${formatBytes(
                            file.size
                          )} • ${extHint(file.type)}`
                        : `Máx. ${MAX_MB}MB · JPG/PNG/WEBP`}
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="dash-file"
                  />
                </div>

                {file && (
                  <div className="dash-upload-meta">
                    <span className="dash-pill dash-pill-ok">
                      Lista para subir
                    </span>
                    <button
                      type="button"
                      className="dash-btn dash-btn-ghost"
                      onClick={clearFile}
                      disabled={uploading}
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="dash-upload-block">
                  <div className="dash-upload-label">Vista previa</div>
                  <div className="dash-preview">
                    <img
                      className="dash-preview-img"
                      src={previewUrl}
                      alt="Vista previa de evidencia"
                    />
                  </div>
                </div>
              )}

              <div className="dash-upload-block">
                <div className="dash-upload-label">Descripción (opcional)</div>
                <textarea
                  className="dash-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej. Foto del voluntariado… (qué hiciste, dónde, fecha)"
                  disabled={uploading}
                />
                <div className="dash-help">
                  Tip: agrega <strong>qué hiciste</strong> y <strong>dónde</strong>{" "}
                  para que el admin apruebe más rápido.
                </div>
              </div>

              <div className="dash-upload-actions">
                <button
                  className="dash-btn dash-btn-primary"
                  type="submit"
                  disabled={uploading || !file}
                >
                  {uploading ? "Subiendo..." : "Subir evidencia"}
                </button>

                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={() => navigate("/user")}
                  disabled={uploading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}