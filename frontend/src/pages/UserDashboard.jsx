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

import "../styles/dashboard.css";

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
    fetchEvidences: () => Promise.resolve({ evidences: [] }),
    showEvidences: false,
  },
  mine: {
    label: "Mis actividades",
    fetchActivities: getMyActivities,
    fetchEvidences: getMyEvidences,
    showEvidences: true,
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

function Kpi({ title, value, hint }) {
  return (
    <div className="eco-kpi" role="group" aria-label={`KPI ${title}`}>
      <div className="eco-kpi-title">{title}</div>
      <div className="eco-kpi-value">{value}</div>
      {hint ? <div className="eco-kpi-hint">{hint}</div> : null}
    </div>
  );
}

function EvidenceRow({ title, evidence, onUpload }) {
  const approved = evidence?.status === "approved";

  return (
    <div className="eco-row">
      <div className="eco-row-main">
        <div className="eco-row-title">{title}</div>
        <div className="eco-row-sub">
          {evidence ? (
            <StatusBadge status={evidence.status} />
          ) : (
            <span className="badge bg-dark">SIN EVIDENCIA</span>
          )}
          {approved ? <span className="eco-row-ok">Completada</span> : null}
        </div>
      </div>

      <button
        className="btn btn-outline-success btn-sm"
        type="button"
        onClick={onUpload}
        disabled={approved}
        title={approved ? "Ya completaste esta actividad" : "Subir evidencia"}
      >
        Subir evidencia
      </button>
    </div>
  );
}

function EmptyState({ modeLabel, onRefresh, onSwitchMode }) {
  return (
    <div className="eco-empty-state" role="status" aria-live="polite">
      <div className="eco-empty-icon" aria-hidden="true">
        🌿
      </div>
      <h5 className="eco-empty-title">No hay actividades disponibles</h5>
      <p className="eco-empty-text">
        Estás viendo: <strong>{modeLabel}</strong>. Puedes refrescar o cambiar el
        filtro.
      </p>

      <div className="eco-empty-actions">
        <button type="button" className="btn btn-success btn-sm" onClick={onRefresh}>
          Refrescar
        </button>
        <button type="button" className="btn btn-outline-success btn-sm" onClick={onSwitchMode}>
          Cambiar a {modeLabel === "Todas" ? "Mis actividades" : "Todas"}
        </button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const go = useCallback((path) => navigate(path), [navigate]);

  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState("all");
  const cfg = MODE[mode];

  const [activities, setActivities] = useState([]);
  const [myEvidences, setMyEvidences] = useState([]);
  const [dash, setDash] = useState(null);

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const userName = useMemo(() => {
    const nombre =
      user?.nombre || user?.name || dash?.user?.nombre || dash?.user?.name || "";
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
    try {
      setLoading(true);
      setAlert(null);

      const [dashRes, actRes, evRes] = await Promise.all([
        getUserDashboard(),
        cfg.fetchActivities(),
        cfg.fetchEvidences(),
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
  }, [cfg]);

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

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        <aside className="eco-sidebar" aria-label="Navegación">
          <div className="eco-sidebar-head">
            <span aria-hidden="true">🌿</span>
            <div className="eco-sidebar-brand">EcoSteps SGSS</div>
          </div>

          <nav className="eco-sidebar-nav">
            <button type="button" className="eco-nav-item is-active" onClick={() => go("/user")}>
              <span aria-hidden="true">▦</span> Dashboard
            </button>

            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.report)}>
              <span aria-hidden="true">⬆</span> Subir reporte
            </button>

            <button type="button" className="eco-nav-item" onClick={() => go(ROUTES.tickets)}>
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
              <div className="eco-level-sub">Servicio Social Activo</div>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="eco-main" aria-label="Contenido principal">
          <div className="eco-main-card">
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title">Hola, {userName}</h2>
                <p className="eco-greet-sub">Tu panel de Servicio Social</p>
              </div>

              <div className="eco-topbar-right">
                <button
                  className="btn btn-eco-ghost btn-sm"
                  type="button"
                  onClick={loadAll}
                  disabled={loading}
                  aria-busy={loading ? "true" : "false"}
                  title="Actualizar datos"
                >
                  {loading ? "Actualizando..." : "Refrescar"}
                </button>
              </div>
            </div>

            <div className="mt-2">
              <UserProgress />
            </div>

            {kpis && (
              <div className="eco-kpis">
                <Kpi title="Reportes" value={kpis.approvedReports} hint="Aprobados / Máximo" />
                <Kpi title="Evidencias" value={kpis.evidences} hint="Resumen" />
                <Kpi title="Actividades" value={kpis.activities} hint="Resumen" />
              </div>
            )}

            <div className="mt-2 card-soft p-2">
              <div className="eco-actions" role="toolbar" aria-label="Acciones del dashboard">
                <div className="eco-actions-left">
                  <div className="eco-segment" role="group" aria-label="Filtro de actividades">
                    {Object.entries(MODE).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        className={`eco-segment-btn ${mode === key ? "is-active" : ""}`}
                        onClick={() => setMode(key)}
                        disabled={loading}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="eco-actions-right">
                  <button
                    className="btn btn-success btn-sm"
                    type="button"
                    onClick={() => go(ROUTES.report)}
                  >
                    Subir reporte
                  </button>
                </div>
              </div>
            </div>

            {alert?.text && (
              <div className={`alert alert-${alert.type} py-2 mt-3 mb-0`}>{alert.text}</div>
            )}

            {loading ? (
              <div className="py-4 text-center text-muted">Cargando...</div>
            ) : (
              <>
                <div className="mt-3">
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

                {cfg.showEvidences && activities.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
                      <div>
                        <h5 className="mb-1">Evidencias</h5>
                        <p className="text-muted small mb-0">
                          Sube evidencia solo si no está aprobada.
                        </p>
                      </div>
                    </div>

                    <div className="d-grid gap-2 mt-3">
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
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
