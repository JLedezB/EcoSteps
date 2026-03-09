import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineTicket,
  HiOutlineArrowPath,
  HiOutlineArrowLeft,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineInbox,
  HiOutlineFunnel,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import { getAllTickets, updateTicketStatus } from "../services/ticketService";

import "../styles/admintickets.css";

const STATUS = {
  open: { label: "ABIERTO", chip: "ticket-badge ticket-badge-open" },
  in_progress: { label: "EN PROCESO", chip: "ticket-badge ticket-badge-progress" },
  resolved: { label: "RESUELTO", chip: "ticket-badge ticket-badge-resolved" },
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
    <article className="tickets-kpi-card">
      <div className="tickets-kpi-title">{title}</div>
      <div className="tickets-kpi-value">{value}</div>
      {hint ? <div className="tickets-kpi-hint">{hint}</div> : null}
    </article>
  );
}

function SidebarItem({ icon, label, active = false, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`tickets-nav-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="tickets-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function AdminTickets() {
  const navigate = useNavigate();
  const listRef = useRef(null);

  const [filter, setFilter] = useState("");
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [alert, setAlert] = useState(null);

  const load = useCallback(
    async (selectedFilter = filter) => {
      try {
        setLoading(true);
        setAlert(null);

        const res = await getAllTickets(selectedFilter);
        setTickets(res?.tickets || []);
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || "Error al cargar tickets" });
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setTicketStatus = useCallback(
    async (id, status) => {
      try {
        setAlert(null);
        setBusyId(id);

        const res = await updateTicketStatus(id, status);
        setAlert({ type: "success", text: res?.message || "Estado actualizado correctamente" });

        await load(filter);
        queueMicrotask(() =>
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || "Error al actualizar estado" });
      } finally {
        setBusyId(null);
      }
    },
    [filter, load]
  );

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0 };
    for (const t of tickets) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tickets]);

  const filterLabel = useMemo(() => {
    if (filter === "open") return "Abiertos";
    if (filter === "in_progress") return "En proceso";
    if (filter === "resolved") return "Resueltos";
    return "Todos";
  }, [filter]);

  return (
    <div className="tickets-page">
      <div className="tickets-shell">
        {/* Sidebar */}
        <aside className="tickets-sidebar" aria-label="Navegación admin tickets">
          <div className="tickets-sidebar-head">
            <div className="tickets-brand-mark">
              <FaLeaf />
            </div>

            <div className="tickets-brand-copy">
              <div className="tickets-sidebar-brand">EcoSteps SGSS</div>
              <div className="tickets-sidebar-subbrand">Administración</div>
            </div>
          </div>

          <nav className="tickets-sidebar-nav">
            <SidebarItem
              icon={<HiOutlineSquares2X2 />}
              label="Dashboard"
              onClick={() => navigate("/admin")}
              disabled={loading || !!busyId}
            />

            <SidebarItem
              icon={<HiOutlineTicket />}
              label="Tickets"
              active
              onClick={() => navigate("/admin/tickets")}
              disabled={loading || !!busyId}
            />
          </nav>

          <div className="tickets-sidebar-foot">
            <div className="tickets-module-card">
              <div className="tickets-module-label">Módulo</div>
              <div className="tickets-module-title">Tickets</div>
              <div className="tickets-module-subtitle">Gestión y seguimiento</div>
            </div>

            <button
              className="tickets-back-btn"
              type="button"
              onClick={() => navigate("/admin")}
              disabled={loading || !!busyId}
            >
              <HiOutlineArrowLeft />
              Volver al panel
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="tickets-main" aria-label="Contenido admin tickets">
          <div className="tickets-main-card">
            {/* Hero */}
            <section className="tickets-hero">
              <div className="tickets-hero-copy">
                <div className="tickets-hero-eyebrow">Gestión administrativa</div>
                <h1 className="tickets-hero-title">Tickets</h1>
                <p className="tickets-hero-subtitle">
                  Gestiona los estados de atención, consulta el detalle de cada ticket y mantén
                  seguimiento del soporte.
                </p>
              </div>

              <div className="tickets-hero-actions">
                <button
                  className="btn btn-light tickets-ghost-btn"
                  type="button"
                  onClick={() => load(filter)}
                  disabled={loading || !!busyId}
                  title="Actualizar lista"
                >
                  <HiOutlineArrowPath />
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="btn btn-light tickets-ghost-btn"
                  type="button"
                  onClick={() => navigate("/admin")}
                  disabled={loading || !!busyId}
                >
                  <HiOutlineArrowLeft />
                  Volver
                </button>
              </div>
            </section>

            {/* Alert */}
            {alert?.text && <div className={`alert alert-${alert.type} tickets-alert`}>{alert.text}</div>}

            {/* KPIs */}
            <section className="tickets-kpis-grid">
              <Kpi title="Total" value={tickets.length} hint={`Filtro actual: ${filterLabel}`} />
              <Kpi title="Abiertos" value={counts.open} hint="Pendientes de atención" />
              <Kpi title="En proceso" value={counts.in_progress} hint="Atendiéndose" />
            </section>

            {/* Filter */}
            <section className="tickets-filter-wrap">
              <div className="tickets-filter-head">
                <div className="tickets-filter-title">
                  <HiOutlineFunnel />
                  Filtrar tickets
                </div>
                <div className="tickets-filter-subtitle">Selecciona un estado para refinar la vista.</div>
              </div>

              <div className="tickets-segment" role="group" aria-label="Filtro de tickets">
                <button
                  type="button"
                  className={`tickets-segment-btn ${filter === "" ? "is-active" : ""}`}
                  onClick={() => setFilter("")}
                  disabled={loading}
                >
                  Todos
                </button>

                <button
                  type="button"
                  className={`tickets-segment-btn ${filter === "open" ? "is-active" : ""}`}
                  onClick={() => setFilter("open")}
                  disabled={loading}
                >
                  Abiertos
                </button>

                <button
                  type="button"
                  className={`tickets-segment-btn ${filter === "in_progress" ? "is-active" : ""}`}
                  onClick={() => setFilter("in_progress")}
                  disabled={loading}
                >
                  En proceso
                </button>

                <button
                  type="button"
                  className={`tickets-segment-btn ${filter === "resolved" ? "is-active" : ""}`}
                  onClick={() => setFilter("resolved")}
                  disabled={loading}
                >
                  Resueltos
                </button>
              </div>
            </section>

            {/* Tickets list */}
            <section className="tickets-section" ref={listRef}>
              <div className="tickets-section-head">
                <div>
                  <div className="tickets-section-eyebrow">Listado</div>
                  <h2 className="tickets-section-title">Tickets registrados</h2>
                  <p className="tickets-section-subtitle">
                    Revisa el estado, accede al detalle y cambia el seguimiento de cada solicitud.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="tickets-empty-card">
                  <div className="tickets-empty-title">Cargando tickets...</div>
                  <div className="tickets-empty-subtitle">Espera mientras se obtiene la información.</div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="tickets-empty-card">
                  <div className="tickets-empty-title">No hay tickets para este filtro</div>
                  <div className="tickets-empty-subtitle">
                    Cambia el filtro o refresca para verificar nuevos tickets.
                  </div>
                </div>
              ) : (
                <div className="tickets-list">
                  {tickets.map((t) => {
                    const st = STATUS[t.status] || STATUS.open;
                    const isBusy = busyId === t._id;

                    return (
                      <article key={t._id} className="ticket-card">
                        <div className="ticket-card-top">
                          <div className="ticket-subject-wrap">
                            <div className="ticket-icon-box">
                              <HiOutlineInbox />
                            </div>

                            <div>
                              <h3 className="ticket-subject">{t.subject || "Sin asunto"}</h3>
                              <p className="ticket-created">Creado: {fmtDate(t.createdAt)}</p>
                            </div>
                          </div>

                          <span className={st.chip}>{st.label}</span>
                        </div>

                        <div className="ticket-meta-grid">
                          <div className="ticket-meta-card">
                            <div className="ticket-meta-label">Usuario</div>
                            <div className="ticket-meta-value">
                              {t.user?.nombre} {t.user?.apellido}
                            </div>
                            <div className="ticket-meta-subvalue">{t.user?.email || "Sin correo"}</div>
                          </div>

                          <div className="ticket-meta-card">
                            <div className="ticket-meta-label">Actividad</div>
                            <div className="ticket-meta-value">{t.activity?.titulo || "—"}</div>
                            <div className="ticket-meta-subvalue">Relacionado al ticket</div>
                          </div>

                          <div className="ticket-meta-card">
                            <div className="ticket-meta-label">Seguimiento</div>
                            <div className="ticket-meta-value">{st.label}</div>
                            <div className="ticket-meta-subvalue">Estado actual del soporte</div>
                          </div>
                        </div>

                        <div className="ticket-actions">
                          <button
                            className="btn btn-outline-success btn-sm ticket-detail-btn"
                            type="button"
                            onClick={() => navigate(`/admin/tickets/${t._id}`)}
                            disabled={isBusy}
                          >
                            <HiOutlineEye />
                            Ver detalle
                          </button>

                          <button
                            className="btn btn-warning btn-sm ticket-progress-btn"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "in_progress")}
                            disabled={t.status === "in_progress" || isBusy}
                            title="Marcar en proceso"
                          >
                            <HiOutlineClock />
                            {isBusy ? "Procesando..." : "En proceso"}
                          </button>

                          <button
                            className="btn btn-success btn-sm ticket-resolve-btn"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "resolved")}
                            disabled={t.status === "resolved" || isBusy}
                            title="Marcar como resuelto"
                          >
                            <HiOutlineCheckCircle />
                            {isBusy ? "Procesando..." : "Resuelto"}
                          </button>

                          <button
                            className="btn btn-outline-secondary btn-sm ticket-open-btn"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "open")}
                            disabled={t.status === "open" || isBusy}
                            title="Regresar a abierto"
                          >
                            <HiOutlineClipboardDocumentList />
                            {isBusy ? "Procesando..." : "Abrir"}
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