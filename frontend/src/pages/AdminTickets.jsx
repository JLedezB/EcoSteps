import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAllTickets, updateTicketStatus } from "../services/ticketService";

import "../styles/dashboard.css";

const STATUS = {
  open: { label: "ABIERTO", chip: "eco-chip eco-chip-muted" },
  in_progress: { label: "EN PROCESO", chip: "eco-chip eco-chip-warn" },
  resolved: { label: "RESUELTO", chip: "eco-chip eco-chip-ok" },
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
    async (id, s) => {
      try {
        setAlert(null);
        setBusyId(id);

        const res = await updateTicketStatus(id, s);
        setAlert({ type: "success", text: res?.message || "Estado actualizado" });

        await load(filter);
        queueMicrotask(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
              onClick={() => navigate("/admin/tickets")}
              disabled={loading || !!busyId}
            >
              <span aria-hidden="true">🎫</span> Tickets
            </button>
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-level-card">
              <div className="eco-level-label">Módulo</div>
              <div className="eco-level-name">Tickets</div>
              <div className="eco-level-sub">Gestión y seguimiento</div>
            </div>

            <div className="mt-3 d-grid gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={() => navigate("/admin")}
                disabled={loading || !!busyId}
              >
                Volver al panel
              </button>
            </div>
          </div>
        </aside>

        <main className="eco-main" aria-label="Contenido admin tickets">
          <div className="eco-main-card">
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title mb-0">Tickets</h2>
                <p className="eco-greet-sub mb-0">Gestiona estados y responde desde el detalle.</p>
              </div>

              <div className="eco-topbar-right d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-eco-ghost btn-sm"
                  type="button"
                  onClick={() => load(filter)}
                  disabled={loading || !!busyId}
                  title="Actualizar lista"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => navigate("/admin")}
                  disabled={loading || !!busyId}
                >
                  Volver
                </button>
              </div>
            </div>

            {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

            <div className="eco-kpis mb-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <Kpi title="Total" value={tickets.length} hint={`Filtro: ${filterLabel}`} />
              <Kpi title="Abiertos" value={counts.open} hint="Pendientes de atención" />
              <Kpi title="En proceso" value={counts.in_progress} hint="Atendiéndose" />
            </div>

            <div className="eco-segment mb-3" role="group" aria-label="Filtro de tickets">
              <button
                type="button"
                className={`eco-segment-btn ${filter === "" ? "is-active" : ""}`}
                onClick={() => setFilter("")}
                disabled={loading}
              >
                Todos
              </button>
              <button
                type="button"
                className={`eco-segment-btn ${filter === "open" ? "is-active" : ""}`}
                onClick={() => setFilter("open")}
                disabled={loading}
              >
                Abiertos
              </button>
              <button
                type="button"
                className={`eco-segment-btn ${filter === "in_progress" ? "is-active" : ""}`}
                onClick={() => setFilter("in_progress")}
                disabled={loading}
              >
                En proceso
              </button>
              <button
                type="button"
                className={`eco-segment-btn ${filter === "resolved" ? "is-active" : ""}`}
                onClick={() => setFilter("resolved")}
                disabled={loading}
              >
                Resueltos
              </button>
            </div>

            <div ref={listRef}>
              {loading ? (
                <div className="py-4 text-center text-muted">Cargando...</div>
              ) : tickets.length === 0 ? (
                <div className="card-soft p-3">
                  <div className="fw-semibold">No hay tickets para este filtro</div>
                  <div className="text-muted small">Cambia el filtro o refresca para verificar nuevos tickets.</div>
                </div>
              ) : (
                <div className="activity-list">
                  {tickets.map((t) => {
                    const st = STATUS[t.status] || STATUS.open;
                    const isBusy = busyId === t._id;

                    return (
                      <div key={t._id} className="activity-card">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="activity-title">{t.subject}</div>
                          <span className={st.chip}>{st.label}</span>
                        </div>

                        <div className="activity-meta mt-2">
                          <div>
                            <strong>Usuario:</strong> {t.user?.nombre} {t.user?.apellido} ({t.user?.email})
                          </div>
                          <div>
                            <strong>Actividad:</strong> {t.activity?.titulo || "—"}
                          </div>
                          <div>
                            <strong>Creado:</strong> {fmtDate(t.createdAt)}
                          </div>
                        </div>

                        <div className="eco-row-actions mt-3">
                          <button
                            className="btn btn-outline-success btn-sm"
                            type="button"
                            onClick={() => navigate(`/admin/tickets/${t._id}`)}
                            disabled={isBusy}
                          >
                            Ver detalle
                          </button>

                          <button
                            className="btn btn-warning btn-sm"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "in_progress")}
                            disabled={t.status === "in_progress" || isBusy}
                            title="Marcar en proceso"
                          >
                            {isBusy ? "..." : "En proceso"}
                          </button>

                          <button
                            className="btn btn-success btn-sm"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "resolved")}
                            disabled={t.status === "resolved" || isBusy}
                            title="Marcar como resuelto (puede eliminarse)"
                          >
                            {isBusy ? "..." : "Resuelto"}
                          </button>

                          <button
                            className="btn btn-outline-secondary btn-sm ms-auto"
                            type="button"
                            onClick={() => setTicketStatus(t._id, "open")}
                            disabled={t.status === "open" || isBusy}
                            title="Regresar a abierto"
                          >
                            {isBusy ? "..." : "Abrir"}
                          </button>
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
