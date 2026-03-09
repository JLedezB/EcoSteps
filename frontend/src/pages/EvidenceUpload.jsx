import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
        setAlert({ type: "danger", text: `❌ ${err}` });
        setFile(null);
        resetFileInput();
        return;
      }
      setAlert(null);
      setFile(f);
    },
    [validateFile, resetFileInput]
  );

  // Si cambias tab y ya no coincide el archivo -> se limpia
  useEffect(() => {
    if (!file) return;
    if (!allowedSet.has(file.type)) {
      setFile(null);
      resetFileInput();
      setAlert({
        type: "danger",
        text: `❌ Cambiaste el tipo a ${activeTab.label}. Selecciona un archivo ${activeTab.label}.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
        setAlert({ type: "danger", text: `❌ ${err2?.message || "Error al subir evidencia"}` });
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
        <section className="ev-card" aria-label="Subir evidencia">
          {/* Header */}
          <header className="ev-head">
            <div>
              <h2 className="ev-title">Subir evidencia</h2>
              <p className="ev-subtitle">
                Formatos: <strong>JPG/PNG/WEBP</strong> · Máximo <strong>{MAX_MB}MB</strong>
              </p>
            </div>

            <div className="ev-head-actions">
              <button className="ev-btn ev-btn-ghost" type="button" onClick={() => navigate("/user")} disabled={uploading}>
                Volver
              </button>
            </div>
          </header>

          {alert?.text ? (
            <div className={`ev-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
              {alert.text}
            </div>
          ) : null}

          {/* Tabs */}
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
            <div className="ev-tabs-hint">
              Permitido: <strong>{activeTab.label}</strong>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="ev-grid">
            {/* LEFT: form */}
            <form className="ev-form" onSubmit={handleSubmit} noValidate>
              <div className="ev-block">
                <div className="ev-label">Imagen *</div>

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
                  <div className="ev-drop-ico" aria-hidden="true">⬆️</div>

                  <div className="ev-drop-main">
                    <div className="ev-drop-title">
                      Arrastra tu imagen aquí o <span>selecciona un archivo</span>
                    </div>

                    <div className="ev-drop-sub">
                      {file
                        ? `Seleccionado: ${file.name} • ${formatBytes(file.size)} • ${extHint(file.type)}`
                        : `Máx. ${MAX_MB}MB · ${activeTab.label}`}
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
                    <span className="ev-pill ev-pill-ok">Lista para subir</span>
                    <button className="ev-btn ev-btn-ghost" type="button" onClick={clearFile} disabled={uploading}>
                      Quitar imagen
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="ev-block">
                <div className="ev-label">Descripción (opcional)</div>
                <textarea
                  className="ev-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej. Foto del voluntariado… (qué hiciste, dónde, fecha)"
                  disabled={uploading}
                />
                <div className="ev-help">
                  Tip: agrega <strong>qué hiciste</strong> y <strong>dónde</strong> para que el admin apruebe más rápido.
                </div>
              </div>

              <div className="ev-actions">
                <button className="ev-btn ev-btn-primary" type="submit" disabled={uploading || !file}>
                  {uploading ? "Subiendo..." : "Subir evidencia"}
                </button>
                <button className="ev-btn ev-btn-ghost" type="button" onClick={() => navigate("/user")} disabled={uploading}>
                  Cancelar
                </button>
              </div>
            </form>

            {/* RIGHT: preview */}
            <aside className="ev-previewSide" aria-label="Vista previa">
              <div className="ev-panel">
                <div className="ev-panel-head">
                  <div className="ev-panel-title">Vista previa</div>
                  <div className="ev-panel-sub">Verifica que se vea claro antes de subir.</div>
                </div>

                <div className="ev-panel-body">
                  {previewUrl ? (
                    <img className="ev-previewImg" src={previewUrl} alt="Vista previa de evidencia" />
                  ) : (
                    <div className="ev-empty">
                      <div className="ev-empty-ico" aria-hidden="true">🖼️</div>
                      <div className="ev-empty-title">Sin imagen</div>
                      <div className="ev-empty-sub">Selecciona un archivo para ver la vista previa.</div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}