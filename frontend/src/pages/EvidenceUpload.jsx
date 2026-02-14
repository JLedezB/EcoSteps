// ==============================
// EvidenceUpload.jsx
// User: Subida de evidencia por actividad
// - Validación: tipo + tamaño (JPG/PNG/WEBP, max 6MB)
// - Preview con URL.createObjectURL + cleanup (evita memory leaks)
// - Upload multipart al backend (activityId + caption + file)
// ==============================

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ==============================
// Services (API)
// ==============================
import { uploadEvidence } from "../services/evidenceService";

// ==============================
// Styles
// ==============================
import "../styles/dashboard.css";

// ==============================
// Config
// ==============================

const MAX_MB = 6;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ✅ Alineado con lo que ya validas
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

// ==============================
// Small Utils
// ==============================

function formatKB(bytes) {
  // UI rápida: KB redondeado
  return `${Math.round(bytes / 1024)} KB`;
}

function EvidenceUpload() {
  // ==============================
  // Router / Params
  // ==============================
  const { activityId } = useParams();
  const navigate = useNavigate();

  // ==============================
  // State: form
  // ==============================
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);

  // ==============================
  // State: UI
  // ==============================
  const [alert, setAlert] = useState(null); // { type: "success"|"danger"|"info", text }
  const [uploading, setUploading] = useState(false);

  // ==============================
  // Preview (memoized)
  // - Crea URL temporal para mostrar imagen
  // ==============================
  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Cleanup: revoca la URL cuando cambia o se desmonta el componente
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ==============================
  // DOM helpers (manteniendo tu enfoque actual)
  // ==============================
  const resetFileInput = () => {
    const el = document.getElementById("evidenceFileInput");
    if (el) el.value = "";
  };

  // ==============================
  // Validations
  // ==============================
  const validateFile = (f) => {
    if (!f) return "Selecciona una imagen.";
    if (!ALLOWED.has(f.type)) return "Solo se permiten imágenes (jpg, png, webp).";
    if (f.size > MAX_BYTES) return `Máximo ${MAX_MB}MB.`;
    return null;
  };

  // ==============================
  // Handlers
  // ==============================
  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Revalida antes de subir (seguridad)
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

      // Reset de form
      setCaption("");
      setFile(null);
      resetFileInput();

      // UX: delay para que el usuario vea el success
      setTimeout(() => navigate("/user"), 900);
    } catch (err2) {
      setAlert({ type: "danger", text: `❌ ${err2?.message || "Error al subir evidencia"}` });
    } finally {
      setUploading(false);
    }
  };

  // ==============================
  // Render
  // ==============================
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* =========================
            Header
           ========================= */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title mb-0">Subir evidencia</h1>
            <div className="text-muted small">
              Formatos: <strong>JPG/PNG/WEBP</strong> · Máximo <strong>{MAX_MB}MB</strong>
            </div>
          </div>

          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => navigate("/user")}
            disabled={uploading}
          >
            Volver
          </button>
        </div>

        {/* =========================
            Alert (feedback)
           ========================= */}
        {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

        {/* =========================
            Form
           ========================= */}
        <form onSubmit={handleSubmit} className="row g-3">
          {/* File */}
          <div className="col-12">
            <label className="input-label">Imagen *</label>

            <input
              id="evidenceFileInput"
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleFileChange}
              disabled={uploading}
            />

            {file && (
              <div className="small text-muted mt-1">
                📎 <strong>{file.name}</strong> · {formatKB(file.size)}
              </div>
            )}
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="col-12">
              <div className="input-label">Vista previa</div>

              <div className="card-soft p-2">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="img-fluid"
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                />
              </div>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setFile(null);
                    resetFileInput();
                    setAlert(null);
                  }}
                  disabled={uploading}
                >
                  Quitar imagen
                </button>
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="col-12">
            <label className="input-label">Descripción (opcional)</label>

            <textarea
              className="eco-textarea w-100"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej. Foto del voluntariado en la actividad…"
              disabled={uploading}
            />

            <div className="small text-muted mt-1">
              Tip: escribe qué hiciste y dónde, para que el admin apruebe rápido.
            </div>
          </div>

          {/* Actions */}
          <div className="col-12 d-flex gap-2 flex-wrap">
            <button className="btn-eco-solid" type="submit" disabled={uploading || !file}>
              {uploading ? "Subiendo..." : "Subir evidencia"}
            </button>

            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => navigate("/user")}
              disabled={uploading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EvidenceUpload;
