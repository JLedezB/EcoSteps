import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingReports, updateReportStatus } from "../services/reportService";
import "../styles/dashboard.css";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

export default function AdminReportsReview() {
  const navigate = useNavigate();
  const listRef = useRef(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [alert, setAlert] = useState(null);

  const pendingCount = useMemo(() => reports.length, [reports]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await getPendingReports();
      setReports(res?.reports || []);
    } catch (e) {
      setAlert({ type: "danger", text: e?.message || "Error al cargar reportes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setReportStatus = useCallback(
    async (id, s) => {
      try {
        setAlert(null);
        setBusyId(id);

        const res = await updateReportStatus(id, s);
        setAlert({ type: "success", text: res?.message || "Estado actualizado" });

        await load();
        queueMicrotask(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || "Error al actualizar reporte" });
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        <aside className="eco-sidebar" aria-label="Navegación admin">
          <div className="eco-sidebar-head">
            <span aria-hidden="true">🛡️</span>
            <div className="eco-sidebar-brand">EcoSteps SGSS</div>
          </div>

          <nav className="eco-sidebar-nav">
            <button
              type="button"
              className="eco-nav-item"
              onClick={() => navigate("/admin")}
              disabled={loading || !!busyId}
            >
              <span aria-hidden="true">▦</span> Dashboard
            </button>

            <button
              type="button"
              className="eco-nav-item is-active"
              onClick={() => navigate("/admin/reports")}
              disabled={loading || !!busyId}
            >
              <span aria-hidden="true">📄</span> Reportes
            </button>
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-level-card">
              <div className="eco-level-label">Módulo</div>
              <div className="eco-level-name">Reportes</div>
              <div className="eco-level-sub">Revisión bimestral</div>
            </div>

            <div className="mt-3 d-grid gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/admin")}
                type="button"
                disabled={loading || !!busyId}
              >
                Volver al panel
              </button>
            </div>
          </div>
        </aside>

        <main className="eco-main" aria-label="Contenido admin reportes">
          <div className="eco-main-card">
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title mb-0">Reportes bimestrales</h2>
                <p className="eco-greet-sub mb-0">Pendientes por revisión del administrador.</p>
              </div>

              <div className="eco-topbar-right d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-eco-ghost btn-sm"
                  onClick={load}
                  type="button"
                  disabled={loading || !!busyId}
                  title="Actualizar lista"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => navigate("/admin")}
                  type="button"
                  disabled={loading || !!busyId}
                >
                  Volver
                </button>
              </div>
            </div>

            {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

            <div className="eco-kpis mb-3" style={{ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }}>
              <div className="eco-kpi">
                <div className="eco-kpi-title">Pendientes</div>
                <div className="eco-kpi-value">{pendingCount}</div>
                <div className="eco-kpi-hint">Reportes por revisar</div>
              </div>
            </div>

            <div ref={listRef}>
              {loading ? (
                <div className="py-4 text-center text-muted">Cargando reportes...</div>
              ) : reports.length === 0 ? (
                <div className="card-soft p-3">
                  <div className="fw-semibold">No hay reportes pendientes</div>
                  <div className="text-muted small">Cuando un usuario suba un reporte, aparecerá aquí.</div>
                </div>
              ) : (
                <div className="activity-list">
                  {reports.map((r) => {
                    const isBusy = busyId === r._id;

                    return (
                      <div key={r._id} className="activity-card">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="activity-title">
                              {r.user?.nombre || "Usuario"} {r.user?.apellido || ""}
                            </div>
                            <div className="text-muted small">{r.user?.email || "sin email"}</div>
                          </div>

                          <span className="eco-chip eco-chip-muted">PENDIENTE</span>
                        </div>

                        <div className="activity-meta mt-2">
                          <div>
                            <strong>Bimestre:</strong> {r.bimestre}
                          </div>
                          <div>
                            <strong>Horas:</strong> {r.hours}
                          </div>
                          <div>
                            <strong>Fecha:</strong> {fmtDate(r.createdAt)}
                          </div>
                        </div>

                        <div className="d-flex gap-2 align-items-center flex-wrap mt-3">
                          <a className="eco-attach" href={r.fileUrl} target="_blank" rel="noreferrer">
                            Ver archivo
                          </a>

                          <button
                            className="btn btn-success btn-sm ms-auto"
                            onClick={() => setReportStatus(r._id, "approved")}
                            type="button"
                            disabled={isBusy}
                          >
                            {isBusy ? "..." : "Aprobar"}
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setReportStatus(r._id, "rejected")}
                            type="button"
                            disabled={isBusy}
                          >
                            {isBusy ? "..." : "Rechazar"}
                          </button>
                        </div>

                        <div className="small text-muted mt-2">
                          Al aprobar, se suman las horas correspondientes al usuario.
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ height: 8 }} />
          </div>
        </main>
      </div>
    </div>
  );
}
