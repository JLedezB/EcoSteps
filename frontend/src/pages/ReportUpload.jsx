import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import LogoutButton from "../components/LogoutButton";
import { uploadReport } from "../services/reportService";

import "../styles/dashboard.css";

const ROUTES = {
  dashboard: "/user",
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
};

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ReportUpload() {
  const navigate = useNavigate();
  const go = (path) => navigate(path);

  const { user } = useContext(AuthContext);

  const [bimestre, setBimestre] = useState("1");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const userName = useMemo(() => {
    const nombre = user?.nombre || user?.name || "";
    const apellido = user?.apellido || "";
    const full = `${nombre} ${apellido}`.trim();
    if (full) return full;
    return user?.email || "Usuario";
  }, [user]);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size),
      type: file.type || "—",
    };
  }, [file]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setAlert({ type: "danger", text: "Selecciona un archivo (PDF o imagen)." });
      return;
    }

    try {
      setAlert(null);
      setLoading(true);

      const res = await uploadReport({ bimestre, file });

      setAlert({
        type: "success",
        text: res?.message || "Reporte enviado correctamente.",
      });

      setTimeout(() => go(ROUTES.dashboard), 700);
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al subir el reporte." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        {/* Sidebar */}
        <aside className="eco-sidebar" aria-label="Navegación">
          <div className="eco-sidebar-head">
            <span aria-hidden="true">🌿</span>
            <div className="eco-sidebar-brand">EcoSteps SGSS</div>
          </div>

          <nav className="eco-sidebar-nav">
            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.dashboard)}>
              <span aria-hidden="true">▦</span> Dashboard
            </button>

            <button type="button" className="eco-nav-item is-active" onClick={() => go(ROUTES.report)}>
              <span aria-hidden="true">⬆</span> Subir reporte
            </button>

            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.tickets)}>
              <span aria-hidden="true">🎫</span> Tickets
            </button>

            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.help)}>
              <span aria-hidden="true">🤖</span> EcoBot
            </button>
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-level-card">
              <div className="eco-level-label">Perfil</div>
              <div className="eco-level-name">{userName}</div>
              <div className="eco-level-sub">Servicio Social Activo</div>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="eco-main" aria-label="Contenido principal">
          <div className="eco-main-card">
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title">Subir reporte bimestral</h2>
                <p className="eco-greet-sub">
                  El administrador debe aprobarlo para sumar horas.
                </p>
              </div>

              <div className="eco-topbar-right">
                <button
                  className="btn btn-eco-ghost btn-sm"
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
              <div className={`alert alert-${alert.type} py-2 mt-2 mb-0`}>{alert.text}</div>
            )}

            <form onSubmit={onSubmit} className="mt-3">
              <div className="card-soft p-3">
                <div className="row g-3">
                  <div className="col-lg-4">
                    <label className="input-label" htmlFor="bimestre">
                      Bimestre
                    </label>
                    <select
                      id="bimestre"
                      className="form-select"
                      value={bimestre}
                      onChange={(e) => setBimestre(e.target.value)}
                      disabled={loading}
                    >
                      <option value="1">Bimestre 1 (160h)</option>
                      <option value="2">Bimestre 2 (160h)</option>
                      <option value="3">Bimestre 3 (160h)</option>
                    </select>

                    <div className="small text-muted mt-2">
                      Sube el archivo correspondiente al bimestre elegido.
                    </div>
                  </div>

                  <div className="col-lg-8">
                    <label className="input-label" htmlFor="file">
                      Archivo (PDF o imagen)
                    </label>

                    <input
                      id="file"
                      type="file"
                      className="form-control"
                      accept="application/pdf,image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      disabled={loading}
                    />

                    {fileMeta ? (
                      <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                        <span className="eco-chip eco-chip-ok">LISTO</span>
                        <div className="small text-muted">
                          <span className="fw-semibold">{fileMeta.name}</span> · {fileMeta.size}
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setFile(null)}
                          disabled={loading}
                          title="Quitar archivo"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="small text-muted mt-2">
                        Formatos permitidos: PDF / imagen. Máximo según tu backend.
                      </div>
                    )}
                  </div>

                  <div className="col-12 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-1">
                    <div className="text-muted small">
                      Tip: usa un PDF legible con tu nombre completo para acelerar la revisión.
                    </div>

                    <button className="btn btn-success" type="submit" disabled={loading}>
                      {loading ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Subiendo...
                        </span>
                      ) : (
                        "Enviar reporte"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Mini bloque estilo “slide” para guiar */}
            <div className="mt-3 card-soft p-3">
              <div className="d-flex align-items-start gap-2">
                <span aria-hidden="true">✅</span>
                <div className="small text-muted">
                  Cuando el admin apruebe tu reporte, se sumarán horas automáticamente a tu progreso.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
