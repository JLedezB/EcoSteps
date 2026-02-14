import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvidencesByActivity, updateEvidenceStatus } from "../services/evidenceAdminService";
import "../styles/dashboard.css";

const STATUS = {
  pending: { label: "PENDIENTE", chip: "eco-chip eco-chip-muted" },
  approved: { label: "APROBADA", chip: "eco-chip eco-chip-ok" },
  rejected: { label: "RECHAZADA", chip: "eco-chip eco-chip-danger" },
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function Kpi({ title, value, hint }) {
  return (
    <div className="eco-kpi">
      <div className="eco-kpi-title">{title}</div>
      <div className="eco-kpi-value">{value}</div>
      {hint ? <div className="eco-kpi-hint">{hint}</div> : null}
    </div>
  );
}

export default function AdminEvidenceReview() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const e of evidences) c[e.status] = (c[e.status] || 0) + 1;
    return c;
  }, [evidences]);

  const filtered = useMemo(() => {
    if (filter === "all") return evidences;
    return evidences.filter((e) => e.status === filter);
  }, [evidences, filter]);

  const filterLabel = useMemo(() => {
    if (filter === "pending") return "Pendientes";
    if (filter === "approved") return "Aprobadas";
    if (filter === "rejected") return "Rechazadas";
    return "Todas";
  }, [filter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await getEvidencesByActivity(activityId);
      setEvidences(res?.evidences || []);
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al cargar evidencias" });
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback(
    async (evidenceId, newStatus) => {
      try {
        setAlert(null);
        setBusyId(evidenceId);

        const res = await updateEvidenceStatus(evidenceId, newStatus);
        setAlert({ type: "success", text: res?.message || "Estado actualizado" });

        await load();
      } catch (err) {
        setAlert({ type: "danger", text: err?.message || "Error al actualizar estado" });
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title mb-0">Revisión de evidencias</h1>
            <div className="text-muted small">Actividad: {activityId}</div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/admin")}
            type="button"
            disabled={loading || !!busyId}
          >
            Volver
          </button>
        </div>

        <div className="eco-actions">
          <div className="text-muted small">
            Mostrando: <span className="fw-semibold">{filterLabel}</span>{" "}
            <span className="ms-2">({filtered.length})</span>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm ms-auto"
            onClick={load}
            type="button"
            disabled={loading || !!busyId}
            title="Actualizar lista"
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

        <div className="eco-kpis mb-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <Kpi title="Pendientes" value={counts.pending} hint="Por revisar" />
          <Kpi title="Aprobadas" value={counts.approved} hint="Correctas" />
          <Kpi title="Rechazadas" value={counts.rejected} hint="Requieren corrección" />
        </div>

        <div className="eco-segment mb-3" role="group" aria-label="Filtro de evidencias">
          <button
            type="button"
            className={`eco-segment-btn ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
            disabled={loading}
          >
            Todas
          </button>
          <button
            type="button"
            className={`eco-segment-btn ${filter === "pending" ? "is-active" : ""}`}
            onClick={() => setFilter("pending")}
            disabled={loading}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`eco-segment-btn ${filter === "approved" ? "is-active" : ""}`}
            onClick={() => setFilter("approved")}
            disabled={loading}
          >
            Aprobadas
          </button>
          <button
            type="button"
            className={`eco-segment-btn ${filter === "rejected" ? "is-active" : ""}`}
            onClick={() => setFilter("rejected")}
            disabled={loading}
          >
            Rechazadas
          </button>
        </div>

        {loading ? (
          <div className="py-4 text-center text-muted">Cargando evidencias...</div>
        ) : filtered.length === 0 ? (
          <div className="card-soft p-3">
            <div className="fw-semibold">No hay evidencias para este filtro</div>
            <div className="text-muted small">Cambia el filtro o refresca para verificar nuevas evidencias.</div>
          </div>
        ) : (
          <div className="activity-list">
            {filtered.map((ev) => {
              const st = STATUS[ev.status] || STATUS.pending;
              const isBusy = busyId === ev._id;

              return (
                <div key={ev._id} className="activity-card">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="activity-title">
                        {ev.user?.nombre || "Usuario"} {ev.user?.apellido || ""}
                      </div>
                      <div className="text-muted small">{ev.user?.email || "sin email"}</div>
                    </div>

                    <span className={st.chip}>{st.label}</span>
                  </div>

                  <div className="activity-meta mt-2">
                    <div>
                      <strong>Fecha:</strong> {fmtDate(ev.createdAt)}
                    </div>
                  </div>

                  {ev.caption ? <div className="activity-desc mt-2">{ev.caption}</div> : null}

                  <div className="eco-media mt-2">
                    <img src={ev.fileUrl} alt="evidencia" className="eco-media-img" loading="lazy" />
                  </div>

                  <div className="eco-row-actions mt-3">
                    <button
                      className="btn btn-success btn-sm"
                      type="button"
                      onClick={() => setStatus(ev._id, "approved")}
                      disabled={ev.status === "approved" || isBusy}
                    >
                      {isBusy ? "..." : "Aprobar"}
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={() => setStatus(ev._id, "rejected")}
                      disabled={ev.status === "rejected" || isBusy}
                    >
                      {isBusy ? "..." : "Rechazar"}
                    </button>

                    <button
                      className="btn btn-outline-secondary btn-sm ms-auto"
                      type="button"
                      onClick={() => setStatus(ev._id, "pending")}
                      disabled={ev.status === "pending" || isBusy}
                      title="Regresar a pendiente"
                    >
                      {isBusy ? "..." : "Pendiente"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
