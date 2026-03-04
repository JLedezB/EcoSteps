import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import LogoutButton from "../components/LogoutButton";
import ActivityList from "../components/ActivityList";
import UserProgress from "../components/UserProgress";
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

// pick “mejor evidencia” por actividad
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
    <div className="dash-kpi" role="group" aria-label={`KPI ${title}`}>
      <div className="dash-kpi-title">{title}</div>
      <div className="dash-kpi-value">{value}</div>
      {hint ? <div className="dash-kpi-hint">{hint}</div> : null}
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
          {evidence ? <StatusBadge status={evidence.status} /> : <span className="dash-pill dash-pill-muted">SIN EVIDENCIA</span>}
          {approved ? <span className="dash-pill dash-pill-ok">Completada</span> : null}
        </div>
      </div>

      <button
        className="dash-btn dash-btn-ghost"
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
    <div className="dash-empty" role="status" aria-live="polite">
      <div className="dash-empty-icon" aria-hidden="true">🌿</div>
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

function Skeleton() {
  return (
    <div className="dash-skel" aria-label="Cargando">
      <div className="dash-skel-row">
        <div className="dash-skel-bar w40" />
        <div className="dash-skel-bar w22" />
      </div>
      <div className="dash-skel-kpis">
        <div className="dash-skel-card" />
        <div className="dash-skel-card" />
        <div className="dash-skel-card" />
      </div>
      <div className="dash-skel-card tall" />
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

    const approvedReports = `${dash.approvedReports}/${dash.approvedReportsMax}`;
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

  // Panel lateral: prioriza evidencias pendientes
  const evidencePanelItems = useMemo(() => {
    if (!cfg.showEvidences) return [];
    const list = (activities || []).map((a) => {
      const ev = evidenceByActivity[a._id];
      const status = ev?.status || "none";
      const priority =
        status === "approved" ? 3 :
        status === "pending" ? 1 :
        status === "rejected" ? 0 :
        2; // none
      return { a, ev, status, priority };
    });

    return list.sort((x, y) => x.priority - y.priority).slice(0, 6);
  }, [activities, cfg.showEvidences, evidenceByActivity]);

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
            <button type="button" className="dash-nav-item is-active" onClick={() => go("/user")}>
              Dashboard
            </button>
            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.report)}>
              Subir reporte
            </button>
            <button type="button" className="dash-nav-item" onClick={() => go(ROUTES.tickets)}>
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
              <div className="dash-profile-sub">Servicio Social Activo</div>

              <div className="dash-profile-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="dash-main" aria-label="Contenido principal">
          <section className="dash-card">
            {/* Header */}
            <div className="dash-top">
              <div>
                <h2 className="dash-title">Hola, {userName}</h2>
                <p className="dash-subtitle">Tu panel de Servicio Social • orden y seguimiento</p>
              </div>

              <div className="dash-top-actions">
                <button
                  className="dash-btn dash-btn-ghost"
                  type="button"
                  onClick={loadAll}
                  disabled={loading}
                  aria-busy={loading ? "true" : "false"}
                  title="Actualizar datos"
                >
                  {loading ? "Actualizando..." : "Refrescar"}
                </button>

                <button className="dash-btn dash-btn-primary" type="button" onClick={() => go(ROUTES.report)}>
                  Subir reporte
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="dash-section">
              <UserProgress />
            </div>

            {/* Alert */}
            {alert?.text && (
              <div className={`dash-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
                {alert.text}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <Skeleton />
            ) : (
              <>
                {/* KPIs */}
                {kpis && (
                  <div className="dash-kpis">
                    <KpiCard title="Reportes" value={kpis.approvedReports} hint="Aprobados / Máximo" />
                    <KpiCard title="Evidencias" value={kpis.evidences} hint="Resumen" />
                    <KpiCard title="Actividades" value={kpis.activities} hint="Resumen" />
                  </div>
                )}

                {/* Toolbar */}
                <div className="dash-toolbar" role="toolbar" aria-label="Acciones del dashboard">
                  <div className="dash-toolbar-left">
                    <div className="dash-segment" role="group" aria-label="Filtro de actividades">
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

                    <div className="dash-hint" aria-label="Ayuda del filtro">
                      {cfg.helperText}
                    </div>
                  </div>
                </div>

                {/* Content grid */}
                <div className="dash-grid">
                  {/* Left: activities */}
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
                        <ActivityList activities={activities} onJoin={onJoin} onLeave={onLeave} />
                      )}
                    </div>
                  </section>

                  {/* Right: side panel */}
                  <aside className="dash-panel dash-panel-side" aria-label="Panel lateral">
                    <div className="dash-panel-head">
                      <div>
                        <div className="dash-panel-title">Accesos rápidos</div>
                        <div className="dash-panel-sub">Lo más usado, en un clic</div>
                      </div>
                    </div>

                    <div className="dash-panel-body">
                      <div className="dash-quick">
                        <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.report)}>
                          ⬆ Subir reporte
                        </button>
                        <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.tickets)}>
                          🎫 Ver tickets
                        </button>
                        <button className="dash-quick-btn" type="button" onClick={() => go(ROUTES.help)}>
                          🤖 Abrir EcoBot
                        </button>
                      </div>

                      <div className="dash-divider" />

                      <div className="dash-note">
                        <div className="dash-note-title">Recomendación</div>
                        <div className="dash-note-text">
                          Mantén evidencias al día. Si una evidencia está <strong>pendiente</strong>, revisa comentarios
                          y vuelve a subir si es necesario.
                        </div>
                      </div>

                      {cfg.showEvidences && activities.length > 0 && (
                        <>
                          <div className="dash-divider" />

                          <div className="dash-panel-minihead">
                            <div className="dash-panel-mini-title">Evidencias (prioridad)</div>
                            <div className="dash-panel-mini-sub">Pendientes / sin evidencia primero</div>
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

                {/* Full evidences list (solo en "Mis actividades") */}
                {cfg.showEvidences && activities.length > 0 && (
                  <section className="dash-section">
                    <div className="dash-panel">
                      <div className="dash-panel-head">
                        <div>
                          <div className="dash-panel-title">Evidencias</div>
                          <div className="dash-panel-sub">
                            Sube evidencia solo si no está aprobada.
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
          </section>
        </main>
      </div>
    </div>
  );
}