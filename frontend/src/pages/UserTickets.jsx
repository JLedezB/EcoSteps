import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";

import { getMyTickets, createTicket } from "../services/ticketService";
import { getMyActivities } from "../services/activityService";

import "../styles/usertickets.css";

const ROUTES = {
  dashboard: "/user",
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
};

const STATUS = {
  open: { label: "ABIERTO", pill: "dash-pill dash-pill-muted" },
  in_progress: { label: "EN PROCESO", pill: "dash-pill dash-pill-warn" },
  resolved: { label: "RESUELTO", pill: "dash-pill dash-pill-ok" },
};

function fmtDateShort(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SkeletonTickets() {
  return (
    <div className="dash-skel" aria-label="Cargando tickets">
      <div className="dash-skel-row">
        <div className="dash-skel-bar w40" />
        <div className="dash-skel-bar w22" />
      </div>
      <div className="dash-skel-card tall" />
    </div>
  );
}

export default function UserTickets() {
  const navigate = useNavigate();
  const go = useCallback((path) => navigate(path), [navigate]);

  const { user } = useContext(AuthContext);
  const subjectRef = useRef(null);

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
    return full || user?.email || "Usuario";
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
      subjectRef.current?.focus();
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

      setAlert({ type: "success", text: `✅ ${res?.message || "Ticket creado"}` });
      setForm({ subject: "", description: "", activityId: "" });

      await load();
      subjectRef.current?.focus();
    } catch (e2) {
      setAlert({ type: "danger", text: `❌ ${e2?.message || "Error al crear ticket"}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-shell">
        {/* SIDEBAR */}
        <aside className="dash-sidebar" aria-label="Navegación">
          <div className="dash-sidebar-head">
            <div className="dash-brand">
              <span className="dash-brand-icon" aria-hidden="true">🌿</span>
              <div>
                <div className="dash-brand-name">EcoSteps</div>
                <div className="dash-brand-sub">SGSS • Panel estudiante</div>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.dashboard)}>
              Dashboard
            </button>
            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.report)}>
              Subir reporte
            </button>
            <button type="button" className="dash-nav-item is-active" onClick={() => go(ROUTES.tickets)}>
              Tickets
            </button>
            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.help)}>
              EcoBot
            </button>
          </nav>

          <div className="dash-sidebar-foot">
            <div className="dash-profile">
              <div className="dash-profile-label">Sesión</div>
              <div className="dash-profile-name">{userName}</div>
              <div className="dash-profile-sub">Soporte y seguimiento</div>
              <div className="dash-profile-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="dash-main" aria-label="Tickets">
          <section className="dash-card">
            <div className="dash-top">
              <div>
                <h2 className="dash-title">Mis tickets</h2>
                <p className="dash-subtitle">Crea tickets y da seguimiento en el chat.</p>
              </div>

              <div className="dash-top-actions">
                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={load}
                  disabled={loading || submitting}
                  aria-busy={loading ? "true" : "false"}
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="dash-btn dash-btn-primary"
                  type="button"
                  onClick={() => go(ROUTES.dashboard)}
                  disabled={loading || submitting}
                >
                  Volver
                </button>
              </div>
            </div>

            {alert?.text && (
              <div
                className={`dash-alert ${alert.type === "success" ? "is-success" : "is-danger"}`}
                role="alert"
              >
                {alert.text}
              </div>
            )}

            {loading ? (
              <SkeletonTickets />
            ) : (
              <div className="dash-grid">
                {/* LEFT: create */}
                <section className="dash-panel">
                  <div className="dash-panel-head">
                    <div>
                      <div className="dash-panel-title">Crear ticket</div>
                      <div className="dash-panel-sub">
                        Describe el problema con claridad para una respuesta más rápida.
                      </div>
                    </div>
                  </div>

                  <div className="dash-panel-body">
                    <form className="dash-upload" onSubmit={submit} noValidate>
                      <div className="dash-upload-block">
                        <div className="dash-upload-label">Asunto *</div>
                        <input
                          ref={subjectRef}
                          className="dash-textarea"
                          style={{ minHeight: 0, height: "52px", resize: "none" }}
                          placeholder="Ej. Problema en actividad"
                          value={form.subject}
                          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                          disabled={submitting}
                          autoComplete="off"
                        />
                      </div>

                      <div className="dash-upload-block">
                        <div className="dash-upload-label">Actividad (opcional)</div>
                        <select
                          className="dash-select"
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
                        <div className="dash-help">Si el ticket es sobre una actividad, selecciónala.</div>
                      </div>

                      <div className="dash-upload-block">
                        <div className="dash-upload-label">Descripción *</div>
                        <textarea
                          className="dash-textarea"
                          rows={5}
                          placeholder="Describe tu problema… (qué estabas haciendo, qué esperabas, qué pasó)"
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                          disabled={submitting}
                        />
                        <div className="dash-help">Tip: incluye pasos y capturas si aplica.</div>
                      </div>

                      <div className="dash-upload-actions">
                        <button
                          className="dash-btn dash-btn-primary"
                          type="submit"
                          disabled={!canSubmit || submitting}
                        >
                          {submitting ? "Creando..." : "Crear ticket"}
                        </button>

                        <button
                          className="dash-btn dash-btn-ghost"
                          type="button"
                          onClick={() => setForm({ subject: "", description: "", activityId: "" })}
                          disabled={submitting}
                        >
                          Limpiar
                        </button>

                        {!canSubmit && <span className="dash-help">Completa asunto y descripción.</span>}
                      </div>

                      <div className="dash-note">
                        <div className="dash-note-title">✅ Recomendación</div>
                        <div className="dash-note-text">
                          Después de crearlo, entra al ticket para chatear y adjuntar evidencia si hace falta.
                        </div>
                      </div>
                    </form>
                  </div>
                </section>

                {/* RIGHT: list */}
                <aside className="dash-panel dash-panel-side" aria-label="Lista de tickets">
                  <div className="dash-panel-head">
                    <div>
                      <div className="dash-panel-title">Tus tickets</div>
                      <div className="dash-panel-sub">Abre un ticket para ver el chat y el historial</div>
                    </div>
                  </div>

                  <div className="dash-panel-body">
                    {tickets.length === 0 ? (
                      <div className="dash-empty" role="status" aria-live="polite">
                        <div className="dash-empty-icon" aria-hidden="true">🎫</div>
                        <h3 className="dash-empty-title">Aún no tienes tickets</h3>
                        <p className="dash-empty-text">Crea tu primer ticket y te damos seguimiento por chat.</p>
                        <div className="dash-empty-actions">
                          <button
                            className="dash-btn dash-btn-primary"
                            type="button"
                            onClick={() => subjectRef.current?.focus()}
                          >
                            Crear mi primer ticket
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ticket-list">
                        {tickets.map((t) => {
                          const st = STATUS[t?.status] || STATUS.open;

                          return (
                            <button
                              key={t._id}
                              type="button"
                              className="ticket-row"
                              onClick={() => navigate(`/user/tickets/${t._id}`)}
                              title="Abrir detalle / chat"
                            >
                              <div className="ticket-row-main">
                                <div className="ticket-row-title">{t?.subject || "Ticket"}</div>

                                <div className="ticket-meta">
                                  <span className={st.pill}>{st.label}</span>
                                  <span className="dash-pill dash-pill-muted">{fmtDateShort(t?.createdAt)}</span>
                                  <span className="dash-pill dash-pill-muted">
                                    {t?.activity?.titulo || "Sin actividad"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}