import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";

import { getMyTickets, createTicket } from "../services/ticketService";
import { getMyActivities } from "../services/activityService";

import "../styles/dashboard.css";

const ROUTES = {
  dashboard: "/user",
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
};

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

export default function UserTickets() {
  const navigate = useNavigate();
  const go = (path) => navigate(path);

  const { user } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    activityId: "",
  });

  const userName = useMemo(() => {
    const nombre = user?.nombre || user?.name || "";
    const apellido = user?.apellido || "";
    const full = `${nombre} ${apellido}`.trim();
    if (full) return full;
    return user?.email || "Usuario";
  }, [user]);

  const canSubmit = useMemo(() => {
    return form.subject.trim().length > 0 && form.description.trim().length > 0;
  }, [form.subject, form.description]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const [t, a] = await Promise.all([getMyTickets(), getMyActivities()]);
      setTickets(t?.tickets || []);
      setActivities(a?.activities || []);
    } catch (e) {
      setAlert({ type: "danger", text: e?.message || "Error al cargar tickets" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      setAlert({ type: "danger", text: "Completa asunto y descripción." });
      return;
    }

    try {
      setSubmitting(true);
      setAlert(null);

      const payload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        activityId: form.activityId || undefined,
      };

      const res = await createTicket(payload);

      setAlert({ type: "success", text: res?.message || "Ticket creado" });
      setForm({ subject: "", description: "", activityId: "" });
      await load();
    } catch (e2) {
      setAlert({ type: "danger", text: e2?.message || "Error al crear ticket" });
    } finally {
      setSubmitting(false);
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

            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.report)}>
              <span aria-hidden="true">⬆</span> Subir reporte
            </button>

            <button type="button" className="eco-nav-item is-active" onClick={() => go(ROUTES.tickets)}>
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
              <div className="eco-level-sub">Soporte y seguimiento</div>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="eco-main" aria-label="Contenido principal">
          <div className="eco-main-card">
            {/* Top like slide */}
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title">Mis tickets</h2>
                <p className="eco-greet-sub">Crea tickets y da seguimiento en el chat.</p>
              </div>

              <div className="eco-topbar-right">
                <button
                  className="btn btn-eco-ghost btn-sm"
                  type="button"
                  onClick={load}
                  disabled={loading || submitting}
                  aria-busy={loading ? "true" : "false"}
                  title="Actualizar lista"
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>
              </div>
            </div>

            {alert?.text && (
              <div className={`alert alert-${alert.type} py-2 mt-2 mb-0`}>{alert.text}</div>
            )}

            {/* Slide-like grid: form left, list right (stacks on mobile) */}
            <div className="eco-main-grid mt-3">
              {/* Left: Create ticket */}
              <section>
                <div className="card-soft p-3">
                  <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-2">
                    <div>
                      <h5 className="mb-1">Crear ticket</h5>
                      <p className="text-muted small mb-0">
                        Describe el problema con claridad para una respuesta más rápida.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => go(ROUTES.dashboard)}
                      disabled={loading || submitting}
                      title="Volver al dashboard"
                    >
                      Volver
                    </button>
                  </div>

                  <form onSubmit={submit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="input-label" htmlFor="subject">
                          Asunto
                        </label>
                        <input
                          id="subject"
                          className="form-control"
                          placeholder="Ej. Problema en actividad"
                          value={form.subject}
                          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                          disabled={submitting}
                          autoComplete="off"
                        />
                      </div>

                      <div className="col-12">
                        <label className="input-label" htmlFor="activity">
                          Actividad (opcional)
                        </label>
                        <select
                          id="activity"
                          className="form-select"
                          value={form.activityId}
                          onChange={(e) => setForm((p) => ({ ...p, activityId: e.target.value }))}
                          disabled={submitting}
                        >
                          <option value="">Sin actividad vinculada</option>
                          {activities.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.titulo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="input-label" htmlFor="desc">
                          Descripción
                        </label>
                        <textarea
                          id="desc"
                          className="form-control"
                          rows={4}
                          placeholder="Describe tu problema..."
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                          disabled={submitting}
                        />
                        <div className="small text-muted mt-2">
                          Tip: incluye qué estabas haciendo y qué esperabas que pasara.
                        </div>
                      </div>

                      <div className="col-12 d-flex gap-2 align-items-center flex-wrap">
                        <button
                          className="btn btn-success"
                          type="submit"
                          disabled={!canSubmit || submitting}
                        >
                          {submitting ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Creando...
                            </span>
                          ) : (
                            "Crear ticket"
                          )}
                        </button>

                        {!canSubmit && (
                          <span className="small text-muted">Completa asunto y descripción.</span>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                {/* Small helper block like slide */}
                <div className="card-soft p-3 mt-3">
                  <div className="d-flex align-items-start gap-2">
                    <span aria-hidden="true">✅</span>
                    <div className="small text-muted">
                      Una vez creado, entra al ticket para chatear y adjuntar evidencia si hace falta.
                    </div>
                  </div>
                </div>
              </section>

              {/* Right: Tickets list */}
              <aside aria-label="Lista de tickets">
                <div className="card-soft p-3">
                  <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <h5 className="mb-0">Tus tickets</h5>
                    <button
                      type="button"
                      className="btn btn-eco-ghost btn-sm"
                      onClick={load}
                      disabled={loading || submitting}
                    >
                      Refrescar
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-4 text-center text-muted">Cargando...</div>
                  ) : tickets.length === 0 ? (
                    <div className="eco-empty-state mt-3">
                      <div className="eco-empty-icon" aria-hidden="true">
                        🎟️
                      </div>
                      <h5 className="eco-empty-title">Aún no tienes tickets</h5>
                      <p className="eco-empty-text">
                        Crea tu primer ticket y te damos seguimiento por chat.
                      </p>
                      <div className="eco-empty-actions">
                        <button
                          className="btn btn-success btn-sm"
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("subject");
                            if (el) el.focus();
                          }}
                        >
                          Crear mi primer ticket
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-grid gap-2 mt-3">
                      {tickets.map((t) => {
                        const st = STATUS[t.status] || STATUS.open;

                        return (
                          <button
                            key={t._id}
                            type="button"
                            className="eco-row"
                            onClick={() => navigate(`/user/tickets/${t._id}`)}
                            title="Abrir detalle / chat"
                            style={{ textAlign: "left" }}
                          >
                            <div className="eco-row-main">
                              <div className="d-flex align-items-start justify-content-between gap-2">
                                <div className="eco-row-title">{t.subject}</div>
                                <span className={st.chip}>{st.label}</span>
                              </div>

                              <div className="eco-row-sub">
                                <span className="small text-muted">
                                  <strong>Creado:</strong> {fmtDate(t.createdAt)}
                                </span>
                                <span className="small text-muted">
                                  <strong>Actividad:</strong> {t.activity?.titulo || "—"}
                                </span>
                              </div>
                            </div>

                            <div className="eco-row-actions">
                              <span className="btn btn-outline-success btn-sm">Abrir</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
