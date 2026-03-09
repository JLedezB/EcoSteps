import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineInformationCircle,
  HiOutlineLifebuoy,
  HiOutlineClock,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

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
  open: { label: "ABIERTO", pill: "ut-chip ut-chip-muted" },
  in_progress: { label: "EN PROCESO", pill: "ut-chip ut-chip-warn" },
  resolved: { label: "RESUELTO", pill: "ut-chip ut-chip-ok" },
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

function Sidebar({ userName, go }) {
  const userInitial = (userName || "U").charAt(0).toUpperCase();

  return (
    <aside className="ut-sidebar" aria-label="Navegación principal">
      <div className="ut-sidebar-top">
        <button
          type="button"
          className="ut-brand"
          onClick={() => go(ROUTES.dashboard)}
          aria-label="Ir al dashboard"
        >
          <span className="ut-brand-icon" aria-hidden="true">
            <FaLeaf />
          </span>

          <span className="ut-brand-copy">
            <span className="ut-brand-title">EcoSteps</span>
            <span className="ut-brand-subtitle">SGSS • Panel estudiante</span>
          </span>
        </button>
      </div>

      <nav className="ut-nav" aria-label="Menú lateral">
        <button type="button" className="ut-nav-item" onClick={() => go(ROUTES.dashboard)}>
          <HiOutlineChartBar className="ut-nav-ico" />
          <span>Dashboard</span>
        </button>

        <button type="button" className="ut-nav-item" onClick={() => go(ROUTES.report)}>
          <HiOutlineDocumentText className="ut-nav-ico" />
          <span>Subir reporte</span>
        </button>

        <button type="button" className="ut-nav-item is-active" onClick={() => go(ROUTES.tickets)}>
          <HiOutlineTicket className="ut-nav-ico" />
          <span>Tickets</span>
        </button>

        <button type="button" className="ut-nav-item" onClick={() => go(ROUTES.help)}>
          <HiOutlineSparkles className="ut-nav-ico" />
          <span>EcoBot</span>
        </button>
      </nav>

      <div className="ut-sidebar-bottom">
        <div className="ut-usercard">
          <div className="ut-usercard-top">
            <div className="ut-user-avatar" aria-hidden="true">
              {userInitial}
            </div>

            <div className="ut-user-meta">
              <div className="ut-user-label">Sesión activa</div>
              <div className="ut-user-name">{userName}</div>
              <div className="ut-user-role">Soporte y seguimiento</div>
            </div>
          </div>

          <div className="ut-user-actions">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Alert({ alert }) {
  if (!alert?.text) return null;

  return (
    <div className={`ut-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
      {alert.text}
    </div>
  );
}

function SkeletonTickets() {
  return (
    <div className="ut-skel" aria-label="Cargando tickets">
      <div className="ut-skel-row">
        <div className="ut-skel-bar w40" />
        <div className="ut-skel-bar w22" />
      </div>
      <div className="ut-skel-card tall" />
    </div>
  );
}

function EmptyTickets({ onCreate }) {
  return (
    <div className="ut-empty" role="status" aria-live="polite">
      <div className="ut-empty-icon" aria-hidden="true">
        <HiOutlineChatBubbleLeftRight />
      </div>
      <h3 className="ut-empty-title">Aún no tienes tickets</h3>
      <p className="ut-empty-text">
        Crea tu primer ticket para recibir seguimiento por parte del equipo.
      </p>
      <div className="ut-empty-actions">
        <button className="ut-btn ut-btn-primary" type="button" onClick={onCreate}>
          <HiOutlinePlus />
          <span>Crear mi primer ticket</span>
        </button>
      </div>
    </div>
  );
}

function TicketRow({ ticket, onOpen }) {
  const st = STATUS[ticket?.status] || STATUS.open;

  return (
    <button type="button" className="ut-ticket" onClick={onOpen} title="Abrir ticket">
      <div className="ut-ticket-main">
        <div className="ut-ticket-top">
          <div className="ut-ticket-title">{ticket?.subject || "Ticket"}</div>
          <span className={st.pill}>{st.label}</span>
        </div>

        <div className="ut-ticket-meta">
          <span className="ut-chip ut-chip-muted">{fmtDateShort(ticket?.createdAt)}</span>
          <span className="ut-chip ut-chip-soft">{ticket?.activity?.titulo || "Sin actividad"}</span>
        </div>
      </div>
    </button>
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

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t?.status === "open").length;
    const inProgress = tickets.filter((t) => t?.status === "in_progress").length;
    const resolved = tickets.filter((t) => t?.status === "resolved").length;

    return { total, open, inProgress, resolved };
  }, [tickets]);

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

  const resetForm = () => {
    setForm({ subject: "", description: "", activityId: "" });
  };

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

      setAlert({ type: "success", text: `✅ ${res?.message || "Ticket creado correctamente."}` });
      resetForm();

      await load();
      subjectRef.current?.focus();
    } catch (e2) {
      setAlert({ type: "danger", text: `❌ ${e2?.message || "Error al crear ticket"}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ut-page">
      <div className="ut-shell">
        <Sidebar userName={userName} go={go} />

        <main className="ut-main" aria-label="Tickets">
          <section className="ut-hero">
            <div className="ut-hero-copy">
              <span className="ut-kicker">SOPORTE Y SEGUIMIENTO</span>
              <h1 className="ut-hero-title">Mis tickets</h1>
              <p className="ut-hero-text">
                Crea solicitudes de soporte, vincúlalas a una actividad si aplica y da seguimiento
                al historial desde un solo lugar.
              </p>

              <div className="ut-hero-actions">
                <button
                  className="ut-btn ut-btn-primary"
                  type="button"
                  onClick={() => subjectRef.current?.focus()}
                  disabled={loading || submitting}
                >
                  <HiOutlinePlus />
                  <span>Nuevo ticket</span>
                </button>

                <button
                  className="ut-btn ut-btn-secondary"
                  type="button"
                  onClick={load}
                  disabled={loading || submitting}
                >
                  <HiOutlineArrowPath />
                  <span>{loading ? "Cargando..." : "Refrescar"}</span>
                </button>

                <button
                  className="ut-btn ut-btn-secondary"
                  type="button"
                  onClick={() => go(ROUTES.dashboard)}
                  disabled={loading || submitting}
                >
                  <HiOutlineArrowLeft />
                  <span>Volver al dashboard</span>
                </button>
              </div>
            </div>
          </section>

          <Alert alert={alert} />

          {loading ? (
            <SkeletonTickets />
          ) : (
            <section className="ut-content-grid">
              <div className="ut-content-main">
                <form className="ut-card ut-form-card" onSubmit={submit} noValidate>
                  <div className="ut-card-head">
                    <div>
                      <div className="ut-card-kicker">Formulario</div>
                      <h2 className="ut-card-title">Crear ticket</h2>
                      <p className="ut-card-text">
                        Describe el problema con claridad para recibir una respuesta más rápida y precisa.
                      </p>
                    </div>
                  </div>

                  <div className="ut-form-grid">
                    <div className="ut-field">
                      <label className="ut-label" htmlFor="subject">
                        Asunto <span className="ut-req">*</span>
                      </label>
                      <input
                        id="subject"
                        ref={subjectRef}
                        className="ut-input"
                        placeholder="Ej. Problema al subir reporte"
                        value={form.subject}
                        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                        disabled={submitting}
                        autoComplete="off"
                        inputMode="text"
                      />
                    </div>

                    <div className="ut-field">
                      <label className="ut-label" htmlFor="activity">
                        Actividad vinculada
                      </label>
                      <select
                        id="activity"
                        className="ut-select"
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
                      <p className="ut-help">
                        Selecciónala solo si el problema pertenece a una actividad específica.
                      </p>
                    </div>
                  </div>

                  <div className="ut-field">
                    <label className="ut-label" htmlFor="desc">
                      Descripción <span className="ut-req">*</span>
                    </label>
                    <textarea
                      id="desc"
                      className="ut-textarea"
                      rows={7}
                      placeholder="Explica qué estabas haciendo, qué esperabas que ocurriera y qué sucedió realmente."
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      disabled={submitting}
                    />
                    <p className="ut-help">
                      Entre más claro sea el contexto, más rápido será el seguimiento.
                    </p>
                  </div>

                  <div className="ut-note">
                    <div className="ut-note-title">✅ Recomendación</div>
                    <div className="ut-note-text">
                      Después de crear el ticket, entra al detalle para continuar el chat y adjuntar
                      evidencia si hace falta.
                    </div>
                  </div>

                  <div className="ut-form-actions">
                    <button className="ut-btn ut-btn-primary" type="submit" disabled={!canSubmit || submitting}>
                      <HiOutlinePlus />
                      <span>{submitting ? "Creando..." : "Crear ticket"}</span>
                    </button>

                    <button
                      className="ut-btn ut-btn-secondary"
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Limpiar
                    </button>

                    {!canSubmit && <span className="ut-inline-help">Completa asunto y descripción.</span>}
                  </div>
                </form>
              </div>

              <aside className="ut-content-side" aria-label="Lista y ayuda de tickets">
                <div className="ut-card">
                  <div className="ut-side-head">
                    <HiOutlineClipboardDocumentList />
                    <h3>Resumen</h3>
                  </div>

                  <div className="ut-summary-list">
                    <div className="ut-summary-row">
                      <span>Tickets totales</span>
                      <strong>{stats.total}</strong>
                    </div>

                    <div className="ut-summary-row">
                      <span>Abiertos</span>
                      <strong>{stats.open}</strong>
                    </div>

                    <div className="ut-summary-row">
                      <span>En proceso</span>
                      <strong>{stats.inProgress}</strong>
                    </div>

                    <div className="ut-summary-row">
                      <span>Resueltos</span>
                      <strong>{stats.resolved}</strong>
                    </div>
                  </div>
                </div>

                <div className="ut-card">
                  <div className="ut-side-head">
                    <HiOutlineLifebuoy />
                    <h3>Tus tickets</h3>
                  </div>

                  <p className="ut-side-text">Abre un ticket para revisar el chat y el historial de seguimiento.</p>

                  <div className="ut-ticket-list-wrap">
                    {tickets.length === 0 ? (
                      <EmptyTickets onCreate={() => subjectRef.current?.focus()} />
                    ) : (
                      <div className="ut-ticket-list">
                        {tickets.map((t) => (
                          <TicketRow
                            key={t._id}
                            ticket={t}
                            onOpen={() => navigate(`/user/tickets/${t._id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ut-card ut-card-soft">
                  <div className="ut-side-head">
                    <HiOutlineInformationCircle />
                    <h3>Consejo</h3>
                  </div>

                  <p className="ut-side-text">
                    Usa un asunto corto y específico, por ejemplo:
                    <strong> “No puedo subir mi reporte del bimestre 2”</strong>.
                  </p>
                </div>

                <div className="ut-card">
                  <div className="ut-side-head">
                    <HiOutlineClock />
                    <h3>Seguimiento</h3>
                  </div>

                  <p className="ut-side-text">
                    Cuando tu ticket cambie de estado o reciba respuesta, podrás consultarlo desde el detalle del ticket.
                  </p>
                </div>
              </aside>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}