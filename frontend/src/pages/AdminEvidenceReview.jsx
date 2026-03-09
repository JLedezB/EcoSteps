import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineFunnel,
  HiOutlinePhoto,
  HiOutlineSquares2X2,
  HiOutlineTicket,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import { getEvidencesByActivity, updateEvidenceStatus } from "../services/evidenceAdminService";
import "../styles/adminevidencereview.css";

const STATUS = {
  pending: { label: "PENDIENTE", chip: "evidence-badge evidence-badge-pending" },
  approved: { label: "APROBADA", chip: "evidence-badge evidence-badge-approved" },
  rejected: { label: "RECHAZADA", chip: "evidence-badge evidence-badge-rejected" },
};

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function Kpi({ title, value, hint }) {
  return (
    <article className="evidence-kpi-card">
      <div className="evidence-kpi-title">{title}</div>
      <div className="evidence-kpi-value">{value}</div>
      {hint ? <div className="evidence-kpi-hint">{hint}</div> : null}
    </article>
  );
}

function SidebarItem({ icon, label, active = false, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`evidence-nav-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="evidence-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function AdminEvidenceReview() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState("all");

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
        setAlert({ type: "success", text: res?.message || "Estado actualizado correctamente" });

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
    <div className="evidence-page">
      <div className="evidence-shell">
        {/* Sidebar */}
        <aside className="evidence-sidebar" aria-label="Navegación admin evidencias">
          <div className="evidence-sidebar-head">
            <div className="evidence-brand-mark">
              <FaLeaf />
            </div>

            <div className="evidence-brand-copy">
              <div className="evidence-sidebar-brand">EcoSteps SGSS</div>
              <div className="evidence-sidebar-subbrand">Administración</div>
            </div>
          </div>

          <nav className="evidence-sidebar-nav">
            <SidebarItem
              icon={<HiOutlineSquares2X2 />}
              label="Dashboard"
              onClick={() => navigate("/admin")}
              disabled={loading || !!busyId}
            />

            <SidebarItem
              icon={<HiOutlinePhoto />}
              label="Evidencias"
              active
              onClick={() => navigate(`/admin/evidences/${activityId}`)}
              disabled={loading || !!busyId}
            />

            <SidebarItem
              icon={<HiOutlineTicket />}
              label="Tickets"
              onClick={() => navigate("/admin/tickets")}
              disabled={loading || !!busyId}
            />
          </nav>

          <div className="evidence-sidebar-foot">
            <div className="evidence-module-card">
              <div className="evidence-module-label">Módulo</div>
              <div className="evidence-module-title">Evidencias</div>
              <div className="evidence-module-subtitle">Revisión por actividad</div>
            </div>

            <button
              className="evidence-back-btn"
              onClick={() => navigate("/admin")}
              type="button"
              disabled={loading || !!busyId}
            >
              <HiOutlineArrowLeft />
              Volver al panel
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="evidence-main" aria-label="Contenido admin evidencias">
          <div className="evidence-main-card">
            {/* Hero */}
            <section className="evidence-hero">
              <div className="evidence-hero-copy">
                <div className="evidence-hero-eyebrow">Gestión administrativa</div>
                <h1 className="evidence-hero-title">Revisión de evidencias</h1>
                <p className="evidence-hero-subtitle">
                  Visualiza, valida y cambia el estado de las evidencias enviadas por los usuarios
                  para una actividad específica.
                </p>
                <div className="evidence-hero-activity">
                  <span className="evidence-hero-activity-label">Actividad</span>
                  <span className="evidence-hero-activity-value">{activityId}</span>
                </div>
              </div>

              <div className="evidence-hero-actions">
                <button
                  className="btn btn-light evidence-ghost-btn"
                  onClick={load}
                  type="button"
                  disabled={loading || !!busyId}
                  title="Actualizar lista"
                >
                  <HiOutlineArrowPath />
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="btn btn-light evidence-ghost-btn"
                  onClick={() => navigate("/admin")}
                  type="button"
                  disabled={loading || !!busyId}
                >
                  <HiOutlineArrowLeft />
                  Volver
                </button>
              </div>
            </section>

            {/* Alert */}
            {alert?.text && <div className={`alert alert-${alert.type} evidence-alert`}>{alert.text}</div>}

            {/* KPIs */}
            <section className="evidence-kpis-grid">
              <Kpi title="Pendientes" value={counts.pending} hint="Por revisar" />
              <Kpi title="Aprobadas" value={counts.approved} hint="Correctas" />
              <Kpi title="Rechazadas" value={counts.rejected} hint="Requieren corrección" />
            </section>

            {/* Filter */}
            <section className="evidence-filter-wrap">
              <div className="evidence-filter-head">
                <div className="evidence-filter-title">
                  <HiOutlineFunnel />
                  Filtrar evidencias
                </div>
                <div className="evidence-filter-subtitle">
                  Mostrando: <strong>{filterLabel}</strong> ({filtered.length})
                </div>
              </div>

              <div className="evidence-segment" role="group" aria-label="Filtro de evidencias">
                <button
                  type="button"
                  className={`evidence-segment-btn ${filter === "all" ? "is-active" : ""}`}
                  onClick={() => setFilter("all")}
                  disabled={loading}
                >
                  Todas
                </button>

                <button
                  type="button"
                  className={`evidence-segment-btn ${filter === "pending" ? "is-active" : ""}`}
                  onClick={() => setFilter("pending")}
                  disabled={loading}
                >
                  Pendientes
                </button>

                <button
                  type="button"
                  className={`evidence-segment-btn ${filter === "approved" ? "is-active" : ""}`}
                  onClick={() => setFilter("approved")}
                  disabled={loading}
                >
                  Aprobadas
                </button>

                <button
                  type="button"
                  className={`evidence-segment-btn ${filter === "rejected" ? "is-active" : ""}`}
                  onClick={() => setFilter("rejected")}
                  disabled={loading}
                >
                  Rechazadas
                </button>
              </div>
            </section>

            {/* List */}
            <section className="evidence-section">
              <div className="evidence-section-head">
                <div>
                  <div className="evidence-section-eyebrow">Listado</div>
                  <h2 className="evidence-section-title">Evidencias registradas</h2>
                  <p className="evidence-section-subtitle">
                    Revisa la imagen enviada, consulta el detalle y define el estado correspondiente.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="evidence-empty-card">
                  <div className="evidence-empty-title">Cargando evidencias...</div>
                  <div className="evidence-empty-subtitle">Espera mientras se obtiene la información.</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="evidence-empty-card">
                  <div className="evidence-empty-title">No hay evidencias para este filtro</div>
                  <div className="evidence-empty-subtitle">
                    Cambia el filtro o refresca para verificar nuevas evidencias.
                  </div>
                </div>
              ) : (
                <div className="evidence-list">
                  {filtered.map((ev) => {
                    const st = STATUS[ev.status] || STATUS.pending;
                    const isBusy = busyId === ev._id;

                    return (
                      <article key={ev._id} className="evidence-card">
                        <div className="evidence-card-top">
                          <div className="evidence-user-block">
                            <div className="evidence-user-avatar">
                              {(ev.user?.nombre?.[0] || "U").toUpperCase()}
                            </div>

                            <div>
                              <h3 className="evidence-user-name">
                                {ev.user?.nombre || "Usuario"} {ev.user?.apellido || ""}
                              </h3>
                              <p className="evidence-user-email">{ev.user?.email || "Sin correo registrado"}</p>
                            </div>
                          </div>

                          <span className={st.chip}>{st.label}</span>
                        </div>

                        <div className="evidence-meta-grid">
                          <div className="evidence-meta-card">
                            <div className="evidence-meta-label">Fecha</div>
                            <div className="evidence-meta-value">{fmtDate(ev.createdAt)}</div>
                          </div>

                          <div className="evidence-meta-card">
                            <div className="evidence-meta-label">Estado actual</div>
                            <div className="evidence-meta-value">{st.label}</div>
                          </div>
                        </div>

                        {ev.caption ? (
                          <div className="evidence-caption-box">
                            <div className="evidence-caption-label">Descripción</div>
                            <div className="evidence-caption-text">{ev.caption}</div>
                          </div>
                        ) : null}

                        <div className="evidence-media">
                          <img src={ev.fileUrl} alt="evidencia" className="evidence-media-img" loading="lazy" />
                        </div>

                        <div className="evidence-view-row">
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="evidence-view-link"
                          >
                            <HiOutlineEye />
                            Ver imagen completa
                          </a>
                        </div>

                        <div className="evidence-actions">
                          <button
                            className="btn btn-success btn-sm evidence-approve-btn"
                            type="button"
                            onClick={() => setStatus(ev._id, "approved")}
                            disabled={ev.status === "approved" || isBusy}
                          >
                            <HiOutlineCheckCircle />
                            {isBusy ? "Procesando..." : "Aprobar"}
                          </button>

                          <button
                            className="btn btn-danger btn-sm evidence-reject-btn"
                            type="button"
                            onClick={() => setStatus(ev._id, "rejected")}
                            disabled={ev.status === "rejected" || isBusy}
                          >
                            <HiOutlineXCircle />
                            {isBusy ? "Procesando..." : "Rechazar"}
                          </button>

                          <button
                            className="btn btn-outline-secondary btn-sm evidence-pending-btn"
                            type="button"
                            onClick={() => setStatus(ev._id, "pending")}
                            disabled={ev.status === "pending" || isBusy}
                            title="Regresar a pendiente"
                          >
                            <HiOutlineClock />
                            {isBusy ? "Procesando..." : "Pendiente"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}