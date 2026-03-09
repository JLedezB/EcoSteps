import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowPath,
  HiOutlineArrowUpTray,
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineMapPin,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import { AuthContext } from "../context/AuthContext";
import LogoutButton from "../components/LogoutButton";
import StatusBadge from "../components/StatusBadge";

import {
  getActivities,
  getMyActivities,
  joinActivity,
  leaveActivity,
} from "../services/activityService";
import { getMyEvidences } from "../services/evidenceService";
import { getUserDashboard } from "../services/dashboardService";

import "../styles/userdashboard.css";

const ROUTES = {
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
  evidence: (id) => `/user/evidence/${id}`,
};

const MODE = {
  all: {
    label: "Todas",
    fetchActivities: getActivities,
    fetchEvidences: async () => ({ evidences: [] }),
    showEvidences: false,
    helperText: "Explora actividades disponibles y participa cuando estés listo.",
  },
  mine: {
    label: "Mis actividades",
    fetchActivities: getMyActivities,
    fetchEvidences: getMyEvidences,
    showEvidences: true,
    helperText: "Aquí aparecen tus actividades inscritas y el estatus de tus evidencias.",
  },
};

function pickEvidence(prev, next) {
  if (!prev) return next;
  if (prev?.status === "approved") return prev;
  if (next?.status === "approved") return next;

  const a = new Date(prev.createdAt || 0).getTime();
  const b = new Date(next.createdAt || 0).getTime();
  return b > a ? next : prev;
}

function KpiCard({ title, value, hint }) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi-title">{title}</div>
      <div className="dash-kpi-value">{value}</div>
      <div className="dash-kpi-hint">{hint}</div>
    </div>
  );
}

function EvidenceRow({ title, evidence, onUpload }) {
  const approved = evidence?.status === "approved";

  return (
    <div className="dash-row">
      <div className="dash-row-main">
        <div className="dash-row-title">{title}</div>
        <div className="dash-row-sub">
          {evidence ? (
            <StatusBadge status={evidence.status} />
          ) : (
            <span className="dash-pill dash-pill-muted">SIN EVIDENCIA</span>
          )}
          {approved ? <span className="dash-pill dash-pill-ok">Completada</span> : null}
        </div>
      </div>

      <button
        className="dash-btn dash-btn-ghost dash-btn-sm"
        type="button"
        onClick={onUpload}
        disabled={approved}
        title={approved ? "Ya completaste esta actividad" : "Subir evidencia"}
      >
        Subir
      </button>
    </div>
  );
}

function EmptyState({ modeLabel, onRefresh, onSwitchMode }) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon">🌿</div>
      <h3 className="dash-empty-title">No hay actividades para mostrar</h3>
      <p className="dash-empty-text">
        Estás viendo: <strong>{modeLabel}</strong>. Puedes refrescar o cambiar el filtro.
      </p>

      <div className="dash-empty-actions">
        <button type="button" className="dash-btn dash-btn-primary" onClick={onRefresh}>
          Refrescar
        </button>
        <button type="button" className="dash-btn dash-btn-ghost" onClick={onSwitchMode}>
          Cambiar a {modeLabel === "Todas" ? "Mis actividades" : "Todas"}
        </button>
      </div>
    </div>
  );
}

function ServiceProgressCard({ dash }) {
  const approvedReports = dash?.approvedReports ?? 0;
  const approvedReportsMax = dash?.approvedReportsMax ?? 3;

  const progressPct =
    approvedReportsMax > 0
      ? Math.min((approvedReports / approvedReportsMax) * 100, 100)
      : 0;

  const completedHours = approvedReports * 160;
  const maxHours = approvedReportsMax * 160;

  return (
    <section className="dash-progress-card">
      <div className="dash-progress-head">
        <div>
          <div className="dash-progress-label">PROGRESO DE SERVICIO SOCIAL</div>
          <h3 className="dash-progress-title">Seguimiento general</h3>
          <p className="dash-progress-sub">
            {completedHours} / {maxHours} horas acumuladas
          </p>
        </div>
      </div>

      <div className="dash-progress-track">
        <span className="dash-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="dash-progress-scale">
        <div className={`dash-progress-scale-item ${approvedReports >= 1 ? "is-done" : ""}`}>
          <span className="dash-progress-dot" />
          <span>Bimestre 1</span>
        </div>

        <div className={`dash-progress-scale-item ${approvedReports >= 2 ? "is-done" : ""}`}>
          <span className="dash-progress-dot" />
          <span>Bimestre 2</span>
        </div>

        <div className={`dash-progress-scale-item ${approvedReports >= 3 ? "is-done" : ""}`}>
          <span className="dash-progress-dot" />
          <span>Bimestre 3</span>
        </div>
      </div>

      <p className="dash-progress-note">
        Cada reporte bimestral aprobado equivale a <strong>160 horas</strong>.
      </p>
    </section>
  );
}

function ActivityCard({ activity, isMineMode, evidence, onJoin, onLeave, onUploadEvidence }) {
  const title = activity?.titulo || "Actividad";
  const description = activity?.descripcion || "Sin descripción.";
  const location = activity?.lugar || activity?.ubicacion || "Por definir";
  const date = activity?.fecha
    ? new Date(activity.fecha).toLocaleDateString("es-MX")
    : "Por definir";

  const capacity =
    activity?.cupoMaximo != null
      ? `${activity?.participantes?.length || 0}/${activity.cupoMaximo}`
      : activity?.cupo != null
      ? `${activity?.participantes?.length || 0}/${activity.cupo}`
      : "Sin límite";

  const isJoined =
    Boolean(activity?.isJoined) ||
    Boolean(activity?.joined) ||
    Boolean(activity?.inscrito) ||
    Boolean(activity?.enrolled);

  const isClosed =
    activity?.cerrada === true ||
    activity?.closed === true ||
    activity?.estado === "cerrada";

  const maxCap =
    typeof activity?.cupoMaximo === "number"
      ? activity.cupoMaximo
      : typeof activity?.cupo === "number"
      ? activity.cupo
      : null;

  const currentParticipants = Array.isArray(activity?.participantes)
    ? activity.participantes.length
    : 0;

  const isFull = !isClosed && typeof maxCap === "number" && currentParticipants >= maxCap;

  let statusLabel = "DISPONIBLE";
  let statusClass = "is-open";

  if (isClosed) {
    statusLabel = "CERRADA";
    statusClass = "is-closed";
  } else if (isFull) {
    statusLabel = "LLENA";
    statusClass = "is-full";
  } else if (isJoined) {
    statusLabel = "INSCRITA";
    statusClass = "is-joined";
  }

  return (
    <article className="act-card">
      <div className="act-head">
        <div className="act-head-left">
          <h3 className="act-title">{title}</h3>
          <p className="act-desc">{description}</p>
        </div>

        <span className={`act-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="act-meta">
        <div className="act-meta-item">
          <div className="act-meta-k">
            <HiOutlineCalendarDays />
            <span>Fecha</span>
          </div>
          <div className="act-meta-v">{date}</div>
        </div>

        <div className="act-meta-item">
          <div className="act-meta-k">
            <HiOutlineMapPin />
            <span>Lugar</span>
          </div>
          <div className="act-meta-v">{location}</div>
        </div>

        <div className="act-meta-item">
          <div className="act-meta-k">
            <HiOutlineUserGroup />
            <span>Cupo</span>
          </div>
          <div className="act-meta-v">{capacity}</div>
        </div>
      </div>

      {isMineMode ? (
        <div className="act-evidence-strip">
          <div className="act-evidence-label">Evidencia</div>
          <div className="act-evidence-status">
            {evidence ? (
              <StatusBadge status={evidence.status} />
            ) : (
              <span className="dash-pill dash-pill-muted">SIN EVIDENCIA</span>
            )}
          </div>
        </div>
      ) : null}

      <div className="act-actions">
        {isMineMode ? (
          <>
            <button className="act-btn act-btn-ghost" type="button" onClick={onUploadEvidence}>
              Subir evidencia
            </button>
            <button className="act-btn act-btn-danger" type="button" onClick={() => onLeave(activity)}>
              Cancelar inscripción
            </button>
          </>
        ) : (
          <button
            className={`act-btn ${isJoined ? "act-btn-joined" : "act-btn-primary"}`}
            type="button"
            onClick={() => onJoin(activity)}
            disabled={isClosed || isFull || isJoined}
          >
            {isJoined ? "Inscrita" : "Inscribirme"}
          </button>
        )}
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="dash-skel">
      <div className="dash-skel-hero" />
      <div className="dash-skel-kpis">
        <div className="dash-skel-card" />
        <div className="dash-skel-card" />
        <div className="dash-skel-card" />
      </div>
      <div className="dash-skel-progress" />
      <div className="dash-skel-grid">
        <div className="dash-skel-card tall" />
        <div className="dash-skel-card tall" />
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const go = useCallback((path) => navigate(path), [navigate]);
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState("all");
  const [activities, setActivities] = useState([]);
  const [myEvidences, setMyEvidences] = useState([]);
  const [dash, setDash] = useState(null);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const cfg = MODE[mode];

  const userName = useMemo(() => {
    const nombre = user?.nombre || user?.name || dash?.user?.nombre || dash?.user?.name || "";
    const apellido = user?.apellido || dash?.user?.apellido || "";
    const full = `${nombre} ${apellido}`.trim();
    if (full) return full;
    return user?.email || dash?.user?.email || "Usuario";
  }, [user, dash]);

  const greetingName = useMemo(() => {
    const nombre = user?.nombre || user?.name || dash?.user?.nombre || dash?.user?.name || "";
    const clean = (nombre || "").trim();
    return clean || userName || "Usuario";
  }, [user, dash, userName]);

  const userInitial = useMemo(() => {
    const source =
      user?.nombre ||
      user?.name ||
      dash?.user?.nombre ||
      dash?.user?.name ||
      userName ||
      "U";

    return String(source).trim().charAt(0).toUpperCase();
  }, [user, dash, userName]);

  const evidenceByActivity = useMemo(() => {
    const map = {};
    for (const ev of myEvidences || []) {
      const id = ev?.activity?._id || ev?.activity;
      if (!id) continue;
      map[id] = pickEvidence(map[id], ev);
    }
    return map;
  }, [myEvidences]);

  const loadAll = useCallback(async () => {
    const activeCfg = MODE[mode];

    try {
      setLoading(true);
      setAlert(null);

      const [dashRes, actRes, evRes] = await Promise.all([
        getUserDashboard(),
        activeCfg.fetchActivities(),
        activeCfg.fetchEvidences(),
      ]);

      setDash(dashRes || null);
      setActivities(actRes?.activities || []);
      setMyEvidences(evRes?.evidences || []);
    } catch (e) {
      console.error("USER DASH LOAD ERROR:", e);
      setAlert({ type: "danger", text: e?.message || "Error al cargar dashboard" });
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activityAction = useCallback(
    async (fn, activityId, okFallback, errFallback) => {
      try {
        setAlert(null);
        const res = await fn(activityId);
        setAlert({ type: "success", text: res?.message || okFallback });
        await loadAll();
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || errFallback });
      }
    },
    [loadAll]
  );

  const onJoin = (a) =>
    activityAction(joinActivity, a._id, "Inscrito correctamente", "Error al inscribirse");

  const onLeave = (a) =>
    activityAction(leaveActivity, a._id, "Inscripción cancelada", "Error al cancelar inscripción");

  const kpis = useMemo(() => {
    if (!dash) return null;

    const approvedReports = `${dash.approvedReports ?? 0}/${dash.approvedReportsMax ?? 0}`;
    const evApproved = dash.evidences?.approved ?? 0;
    const evPending = dash.evidences?.pending ?? 0;
    const joined = dash.activities?.joined ?? 0;
    const completed = dash.activities?.completed ?? 0;

    return {
      approvedReports,
      evidences: `${evApproved} aprobadas · ${evPending} pendientes`,
      activities: `${completed} completadas · ${joined} inscritas`,
    };
  }, [dash]);

  const modeLabel = MODE[mode]?.label || "Todas";

  const evidencePanelItems = useMemo(() => {
    if (!cfg.showEvidences) return [];

    const list = (activities || []).map((a) => {
      const ev = evidenceByActivity[a._id];
      const status = ev?.status || "none";
      const priority =
        status === "approved" ? 3 : status === "pending" ? 1 : status === "rejected" ? 0 : 2;

      return { a, ev, status, priority };
    });

    return list.sort((x, y) => x.priority - y.priority).slice(0, 6);
  }, [activities, cfg.showEvidences, evidenceByActivity]);

  return (
    <div className="dash-page">
      <div className="dash-shell">
        <aside className="dash-sidebar" aria-label="Navegación">
          <div className="dash-sidebar-head">
            <div className="dash-brand">
              <span className="dash-brand-icon" aria-hidden="true">
                <FaLeaf />
              </span>
              <div>
                <div className="dash-brand-name">EcoSteps</div>
                <div className="dash-brand-sub">SGSS • Panel estudiante</div>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            <button type="button" className="dash-nav-item is-active" onClick={() => go("/user")}>
              <span className="dash-nav-icon">
                <HiOutlineSquares2X2 />
              </span>
              <span>Dashboard</span>
            </button>

            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.report)}>
              <span className="dash-nav-icon">
                <HiOutlineDocumentText />
              </span>
              <span>Subir reporte</span>
            </button>

            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.tickets)}>
              <span className="dash-nav-icon">
                <HiOutlineTicket />
              </span>
              <span>Tickets</span>
            </button>

            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.help)}>
              <span className="dash-nav-icon">
                <HiOutlineSparkles />
              </span>
              <span>EcoBot</span>
            </button>
          </nav>

          <div className="dash-sidebar-foot">
            <div className="dash-profile">
              <div className="dash-profile-top">
                <div className="dash-profile-avatar" aria-hidden="true">
                  {userInitial}
                </div>

                <div className="dash-profile-meta">
                  <div className="dash-profile-label">Sesión activa</div>
                  <div className="dash-profile-name">{userName}</div>
                  <div className="dash-profile-sub">Servicio Social Activo</div>
                </div>
              </div>

              <div className="dash-profile-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="dash-main" aria-label="Contenido principal">
          <section className="dash-hero">
            <div className="dash-hero-left">
              <span className="dash-hero-chip">PANEL DE ESTUDIANTE</span>
              <h1 className="dash-title">Hola, {greetingName}</h1>
              <p className="dash-subtitle">
                Visualiza tu avance, administra tus actividades y mantén control de tus reportes y
                evidencias desde un solo lugar.
              </p>
            </div>

            <div className="dash-top-actions">
              <button
                className="dash-btn dash-btn-primary"
                type="button"
                onClick={() => go(ROUTES.report)}
              >
                <HiOutlineArrowUpTray />
                <span>Subir reporte</span>
              </button>

              <button
                className="dash-btn dash-btn-ghost"
                type="button"
                onClick={() => go(ROUTES.tickets)}
              >
                <HiOutlineTicket />
                <span>Ver tickets</span>
              </button>

              <button
                className="dash-btn dash-btn-ghost"
                type="button"
                onClick={loadAll}
                disabled={loading}
                title="Actualizar datos"
              >
                <HiOutlineArrowPath />
                <span>{loading ? "Actualizando..." : "Refrescar"}</span>
              </button>
            </div>
          </section>

          {alert?.text && (
            <div className={`dash-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
              {alert.text}
            </div>
          )}

          {loading ? (
            <Skeleton />
          ) : (
            <>
              {kpis && (
                <div className="dash-kpis">
                  <KpiCard title="Reportes" value={kpis.approvedReports} hint="Aprobados / máximo" />
                  <KpiCard title="Evidencias" value={kpis.evidences} hint="Resumen actual" />
                  <KpiCard title="Actividades" value={kpis.activities} hint="Tu participación" />
                </div>
              )}

              <div className="dash-section">
                <ServiceProgressCard dash={dash} />
              </div>

              <div className="dash-toolbar">
                <div className="dash-toolbar-left">
                  <div className="dash-segment">
                    {Object.entries(MODE).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        className={`dash-segment-btn ${mode === key ? "is-active" : ""}`}
                        onClick={() => setMode(key)}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>

                  <div className="dash-hint">{cfg.helperText}</div>
                </div>
              </div>

              <div className="dash-grid">
                <section className="dash-panel">
                  <div className="dash-panel-head">
                    <div>
                      <div className="dash-panel-title">Actividades</div>
                      <div className="dash-panel-sub">Selecciona y gestiona tu participación</div>
                    </div>
                  </div>

                  <div className="dash-panel-body">
                    {activities.length === 0 ? (
                      <EmptyState
                        modeLabel={modeLabel}
                        onRefresh={loadAll}
                        onSwitchMode={() => setMode((m) => (m === "all" ? "mine" : "all"))}
                      />
                    ) : (
                      <div className="act-grid">
                        {activities.map((activity) => (
                          <ActivityCard
                            key={activity._id}
                            activity={activity}
                            isMineMode={cfg.showEvidences}
                            evidence={evidenceByActivity[activity._id]}
                            onJoin={onJoin}
                            onLeave={onLeave}
                            onUploadEvidence={() => go(ROUTES.evidence(activity._id))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <aside className="dash-panel dash-panel-side" aria-label="Panel lateral">
                  <div className="dash-panel-head">
                    <div>
                      <div className="dash-panel-title">Panel de opciones</div>
                      <div className="dash-panel-sub">Acciones rápidas y seguimiento</div>
                    </div>
                  </div>

                  <div className="dash-panel-body">
                    <div className="dash-quick">
                      <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.report)}>
                        <span className="dash-quick-icon">
                          <HiOutlineDocumentText />
                        </span>
                        <span>Subir reporte</span>
                      </button>

                      <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.tickets)}>
                        <span className="dash-quick-icon">
                          <HiOutlineTicket />
                        </span>
                        <span>Ver tickets</span>
                      </button>

                      <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.help)}>
                        <span className="dash-quick-icon">
                          <HiOutlineSparkles />
                        </span>
                        <span>Abrir EcoBot</span>
                      </button>
                    </div>

                    <div className="dash-divider" />

                    <div className="dash-note">
                      <div className="dash-note-title">Consejo</div>
                      <div className="dash-note-text">
                        Mantén tus evidencias al día. Si una evidencia está <strong>pendiente</strong>,
                        revisa comentarios y vuelve a subirla si hace falta.
                      </div>
                    </div>

                    {cfg.showEvidences && activities.length > 0 && (
                      <>
                        <div className="dash-divider" />

                        <div className="dash-panel-minihead">
                          <div className="dash-panel-mini-title">Evidencias prioritarias</div>
                          <div className="dash-panel-mini-sub">Pendientes, rechazadas o sin evidencia</div>
                        </div>

                        <div className="dash-mini-list">
                          {evidencePanelItems.map(({ a, ev }) => (
                            <EvidenceRow
                              key={a._id}
                              title={a.titulo}
                              evidence={ev}
                              onUpload={() => go(ROUTES.evidence(a._id))}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </aside>
              </div>

              {cfg.showEvidences && activities.length > 0 && (
                <section className="dash-section">
                  <div className="dash-panel">
                    <div className="dash-panel-head">
                      <div>
                        <div className="dash-panel-title">Resumen de evidencias</div>
                        <div className="dash-panel-sub">
                          Sube evidencia solo si aún no está aprobada.
                        </div>
                      </div>
                    </div>

                    <div className="dash-panel-body dash-stack">
                      {activities.map((a) => (
                        <EvidenceRow
                          key={a._id}
                          title={a.titulo}
                          evidence={evidenceByActivity[a._id]}
                          onUpload={() => go(ROUTES.evidence(a._id))}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}