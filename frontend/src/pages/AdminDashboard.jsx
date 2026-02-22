// ==============================
// AdminDashboard.jsx
// Panel administrador: métricas + CRUD de actividades + navegación a módulos
// ✅ Reemplaza window.confirm por modal personalizado (sin "localhost dice")
// ==============================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import ConfirmModal from "../components/ConfirmModal";

// ==============================
// Services (API)
// ==============================
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activityService";
import { getAdminDashboard } from "../services/dashboardService";

// ==============================
// Charts (Recharts)
// ==============================
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ==============================
// Styles
// ==============================
import "../styles/dashboard.css";

// ==============================
// Constants
// ==============================
const emptyForm = {
  titulo: "",
  descripcion: "",
  fecha: "",
  lugar: "",
  cupoTotal: 1,
  estado: "activa",
};

const STATUS_CHIP = {
  activa: "eco-chip eco-chip-ok",
  cerrada: "eco-chip eco-chip-muted",
};

const CHART_COLORS = ["#2ecc71", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

// ==============================
// Utils
// ==============================
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function sumValues(data) {
  return (data || []).reduce((acc, d) => acc + (Number(d?.value) || 0), 0);
}

function shorten(str, max = 12) {
  if (!str) return "";
  const s = String(str);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

// ==============================
// Chart helpers
// ==============================
function EmptyChart({ title = "Sin datos" }) {
  return (
    <div className="eco-chart-empty">
      <div className="fw-semibold">{title}</div>
      <div className="text-muted small">Aún no hay registros suficientes.</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const p0 = payload[0];
  const name = p0?.name ?? label ?? "—";
  const value = p0?.value ?? 0;

  return (
    <div className="eco-tooltip">
      <div className="eco-tooltip-title">{name}</div>
      <div className="eco-tooltip-value">{value}</div>
    </div>
  );
}

function DonutCenter({ total, subtitle = "Total" }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan className="eco-donut-total" x="50%" dy="-2">
        {total}
      </tspan>
      <tspan className="eco-donut-sub" x="50%" dy="18">
        {subtitle}
      </tspan>
    </text>
  );
}

// ==============================
// UI blocks
// ==============================
function PanelCard({ title, subtitle, actions, children }) {
  return (
    <div className="card-soft p-3">
      {(title || actions) && (
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
          <div>
            {title ? <div className="fw-semibold">{title}</div> : null}
            {subtitle ? <div className="text-muted small">{subtitle}</div> : null}
          </div>
          {actions ? <div className="d-flex gap-2 flex-wrap">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

function Kpi({ title, value, hint, action }) {
  return (
    <div className="eco-kpi">
      <div className="eco-kpi-title">{title}</div>
      <div className="eco-kpi-value">{value}</div>
      <div className="d-flex justify-content-between align-items-end gap-2">
        {hint ? <div className="eco-kpi-hint">{hint}</div> : <div />}
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-2">
      <div>
        <h5 className="mb-1">{title}</h5>
        {subtitle ? <p className="text-muted small mb-0">{subtitle}</p> : null}
      </div>
      {actions ? <div className="d-flex gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Refs para "scroll to section"
  const chartsRef = useRef(null);
  const formRef = useRef(null);
  const listRef = useRef(null);

  // Data
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // CRUD form
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // ✅ Modal confirm delete
  const [showConfirm, setShowConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // ==============================
  // Navigation (misma funcionalidad)
  // ==============================
  const goTickets = useCallback(() => navigate("/admin/tickets"), [navigate]);
  const goReviewReports = useCallback(() => navigate("/admin/reports"), [navigate]);
  const goReviewEvidences = useCallback(
    (activityId) => navigate(`/admin/evidences/${activityId}`),
    [navigate]
  );

  // ==============================
  // Load data
  // ==============================
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const [actRes, dashRes] = await Promise.all([getActivities(), getAdminDashboard()]);
      setActivities(actRes?.activities || []);
      setStats(dashRes || null);
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al cargar admin dashboard" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==============================
  // CRUD helpers
  // ==============================
  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const startEdit = (a) => {
    setEditingId(a._id);
    setForm({
      titulo: a.titulo || "",
      descripcion: a.descripcion || "",
      fecha: a.fecha ? new Date(a.fecha).toISOString().slice(0, 10) : "",
      lugar: a.lugar || "",
      cupoTotal: a.cupoTotal || 1,
      estado: a.estado || "activa",
    });
    setAlert(null);
    queueMicrotask(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAlert(null);
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      titulo: form.titulo?.trim(),
      descripcion: form.descripcion?.trim(),
      fecha: form.fecha,
      lugar: form.lugar?.trim(),
      cupoTotal: Number(form.cupoTotal),
      estado: form.estado,
    };

    if (!payload.titulo || !payload.descripcion || !payload.fecha || !payload.cupoTotal) {
      setAlert({ type: "danger", text: "Completa título, descripción, fecha y cupo total." });
      return;
    }

    try {
      setSaving(true);
      setAlert(null);

      if (editingId) {
        const res = await updateActivity(editingId, payload);
        setAlert({ type: "success", text: res?.message || "Actividad actualizada" });
      } else {
        const res = await createActivity(payload);
        setAlert({ type: "success", text: res?.message || "Actividad creada" });
      }

      cancelEdit();
      await load();
      queueMicrotask(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al guardar actividad" });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Abre modal (sin confirm nativo)
  const remove = (id) => {
    setActivityToDelete(id);
    setShowConfirm(true);
  };

  // ✅ Confirmar eliminación
  const confirmDelete = async () => {
    if (!activityToDelete) return;

    try {
      setAlert(null);
      const res = await deleteActivity(activityToDelete);
      setAlert({ type: "success", text: res?.message || "Actividad eliminada" });
      await load();
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al eliminar" });
    } finally {
      setShowConfirm(false);
      setActivityToDelete(null);
    }
  };

  // ==============================
  // Charts data
  // ==============================
  const ticketsPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Open", value: stats.openTickets ?? 0 },
      { name: "In progress", value: stats.inProgressTickets ?? 0 },
      { name: "Resolved", value: stats.resolvedTickets ?? 0 },
    ];
  }, [stats]);

  const evidencesPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Pending", value: stats.pendingEvidences ?? 0 },
      { name: "Approved", value: stats.approvedEvidences ?? 0 },
      { name: "Rejected", value: stats.rejectedEvidences ?? 0 },
    ];
  }, [stats]);

  const topActivitiesBar = useMemo(() => {
    if (!stats?.topActivities) return [];
    return stats.topActivities.map((a) => ({
      titulo: a.titulo,
      participantes: a.participantsCount ?? 0,
    }));
  }, [stats]);

  const usersActiveBar = useMemo(() => {
    if (!stats?.usersActive) return [];
    return stats.usersActive.map((u) => ({
      nombre: u.nombre,
      evidencias: u.evidences ?? 0,
    }));
  }, [stats]);

  const ticketsTotal = useMemo(() => sumValues(ticketsPieData), [ticketsPieData]);
  const evidencesTotal = useMemo(() => sumValues(evidencesPieData), [evidencesPieData]);

  // ==============================
  // KPIs
  // ==============================
  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      {
        title: "Evidencias pendientes",
        value: stats.pendingEvidences ?? 0,
        hint: "Por revisar",
        action: (
          <button
            className="btn btn-outline-success btn-sm"
            type="button"
            onClick={() => chartsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Ver
          </button>
        ),
      },
      {
        title: "Reportes pendientes",
        value: stats.pendingReports ?? 0,
        hint: "Bimestrales",
        action: (
          <button className="btn btn-outline-success btn-sm" type="button" onClick={goReviewReports}>
            Revisar
          </button>
        ),
      },
      {
        title: "Tickets abiertos",
        value: stats.openTickets ?? 0,
        hint: "Requieren atención",
        action: (
          <button className="btn btn-outline-success btn-sm" type="button" onClick={goTickets}>
            Ver
          </button>
        ),
      },
      {
        title: "Usuarios registrados",
        value: stats.totalUsers ?? 0,
        hint: "Rol user",
      },
    ];
  }, [goReviewReports, goTickets, stats]);

  // ==============================
  // Sidebar actions
  // ==============================
  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        {/* =========================
            Sidebar (Admin)
        ========================= */}
        <aside className="eco-sidebar" aria-label="Navegación admin">
          <div className="eco-sidebar-head">
            <span aria-hidden="true">🛡️</span>
            <div className="eco-sidebar-brand">EcoSteps SGSS</div>
          </div>

          <nav className="eco-sidebar-nav">
            <button type="button" className="eco-nav-item is-active" onClick={() => navigate("/admin")}>
              <span aria-hidden="true">▦</span> Dashboard
            </button>

            <button type="button" className="eco-nav-item" onClick={goReviewReports}>
              <span aria-hidden="true">📄</span> Reportes
            </button>

            <button type="button" className="eco-nav-item" onClick={goTickets}>
              <span aria-hidden="true">🎫</span> Tickets
            </button>

            <button type="button" className="eco-nav-item" onClick={() => scrollTo(chartsRef)}>
              <span aria-hidden="true">📊</span> Métricas
            </button>

            <button type="button" className="eco-nav-item" onClick={() => scrollTo(formRef)}>
              <span aria-hidden="true">➕</span> Crear actividad
            </button>

            <button type="button" className="eco-nav-item" onClick={() => scrollTo(listRef)}>
              <span aria-hidden="true">🗂️</span> Actividades
            </button>
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-level-card">
              <div className="eco-level-label">Perfil</div>
              <div className="eco-level-name">ADMIN</div>
              <div className="eco-level-sub">Gestión y revisión</div>
            </div>

            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* =========================
            Main content
        ========================= */}
        <main className="eco-main" aria-label="Contenido admin">
          <div className="eco-main-card">
            {/* Topbar */}
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title mb-0">Panel administrador</h2>
                <p className="eco-greet-sub mb-0">Control general: métricas, reportes, tickets y actividades.</p>
              </div>

              <div className="eco-topbar-right d-flex gap-2 flex-wrap">
                <button className="btn btn-outline-success btn-sm" type="button" onClick={goReviewReports}>
                  Revisar reportes
                </button>
                <button className="btn btn-outline-success btn-sm" type="button" onClick={goTickets}>
                  Ver tickets
                </button>
                <button
                  className="btn btn-eco-ghost btn-sm"
                  type="button"
                  onClick={load}
                  disabled={loading || saving}
                >
                  {loading ? "Cargando..." : "Refrescar"}
                </button>
              </div>
            </div>

            {/* Alert */}
            {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

            {/* KPIs */}
            {stats ? (
              <div className="eco-kpis mb-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {kpis.map((k) => (
                  <Kpi key={k.title} title={k.title} value={k.value} hint={k.hint} action={k.action} />
                ))}
              </div>
            ) : (
              <div className="mb-3">{loading ? <div className="text-muted">Cargando métricas...</div> : null}</div>
            )}

            {/* =========================
                Charts section
            ========================= */}
            <div ref={chartsRef} className="mb-4">
              <SectionHeader
                title="Métricas"
                subtitle="Distribuciones y ranking (se actualiza con Refrescar)."
                actions={
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => scrollTo(formRef)}>
                    Crear actividad
                  </button>
                }
              />

              {stats ? (
                <div className="row g-3">
                  <div className="col-md-6">
                    <PanelCard title="Tickets por estado" subtitle="Distribución actual">
                      <div style={{ width: "100%", height: 280 }}>
                        {ticketsTotal === 0 ? (
                          <EmptyChart title="Sin tickets" />
                        ) : (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={ticketsPieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={62}
                                outerRadius={92}
                                paddingAngle={3}
                                isAnimationActive
                                labelLine={false}
                                label={({ name, percent, value }) =>
                                  value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                                }
                              >
                                {ticketsPieData.map((_, idx) => (
                                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                                <DonutCenter total={ticketsTotal} subtitle="Tickets" />
                              </Pie>

                              <Tooltip content={<ChartTooltip />} />
                              <Legend verticalAlign="bottom" height={24} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </PanelCard>
                  </div>

                  <div className="col-md-6">
                    <PanelCard title="Evidencias por estado" subtitle="Pendientes / aprobadas / rechazadas">
                      <div style={{ width: "100%", height: 280 }}>
                        {evidencesTotal === 0 ? (
                          <EmptyChart title="Sin evidencias" />
                        ) : (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={evidencesPieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={62}
                                outerRadius={92}
                                paddingAngle={3}
                                isAnimationActive
                                labelLine={false}
                                label={({ name, percent, value }) =>
                                  value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                                }
                              >
                                {evidencesPieData.map((_, idx) => (
                                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                                <DonutCenter total={evidencesTotal} subtitle="Evidencias" />
                              </Pie>

                              <Tooltip content={<ChartTooltip />} />
                              <Legend verticalAlign="bottom" height={24} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </PanelCard>
                  </div>

                  <div className="col-md-6">
                    <PanelCard title="Top actividades" subtitle="Participación">
                      <div style={{ width: "100%", height: 300 }}>
                        {topActivitiesBar.length === 0 ? (
                          <EmptyChart title="Sin actividades con participación" />
                        ) : (
                          <ResponsiveContainer>
                            <BarChart data={topActivitiesBar} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                              <XAxis
                                dataKey="titulo"
                                tickFormatter={(v) => shorten(v, 12)}
                                interval={0}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip content={<ChartTooltip />} />
                              <Legend verticalAlign="bottom" height={24} />
                              <Bar
                                dataKey="participantes"
                                name="Participantes"
                                radius={[8, 8, 0, 0]}
                                barSize={28}
                                fill={CHART_COLORS[2]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </PanelCard>
                  </div>

                  <div className="col-md-6">
                    <PanelCard title="Usuarios más activos" subtitle="Evidencias enviadas">
                      <div style={{ width: "100%", height: 300 }}>
                        {usersActiveBar.length === 0 ? (
                          <EmptyChart title="Sin usuarios activos" />
                        ) : (
                          <ResponsiveContainer>
                            <BarChart data={usersActiveBar} margin={{ top: 8, right: 10, left: 0, bottom: 6 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                              <XAxis
                                dataKey="nombre"
                                tickFormatter={(v) => shorten(v, 12)}
                                interval={0}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip content={<ChartTooltip />} />
                              <Legend verticalAlign="bottom" height={24} />
                              <Bar
                                dataKey="evidencias"
                                name="Evidencias"
                                radius={[8, 8, 0, 0]}
                                barSize={28}
                                fill={CHART_COLORS[0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </PanelCard>
                  </div>
                </div>
              ) : (
                <PanelCard title="Métricas" subtitle="Cargando...">
                  <div className="text-muted">{loading ? "Cargando métricas..." : "Sin datos"}</div>
                </PanelCard>
              )}
            </div>

            {/* =========================
                CRUD section
            ========================= */}
            <div ref={formRef} className="mb-4">
              <SectionHeader
                title={editingId ? "Editar actividad" : "Crear actividad"}
                subtitle="Campos requeridos: título, descripción, fecha, cupo."
                actions={
                  editingId ? (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancelar edición
                    </button>
                  ) : (
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => scrollTo(listRef)}>
                      Ver actividades
                    </button>
                  )
                }
              />

              <PanelCard>
                <form onSubmit={submit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="input-label">Título</label>
                      <input
                        className="form-control"
                        placeholder="Título"
                        value={form.titulo}
                        onChange={(e) => onChange("titulo", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="input-label">Lugar (opcional)</label>
                      <input
                        className="form-control"
                        placeholder="Lugar"
                        value={form.lugar}
                        onChange={(e) => onChange("lugar", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-12">
                      <label className="input-label">Descripción</label>
                      <textarea
                        className="form-control"
                        placeholder="Descripción"
                        rows={2}
                        value={form.descripcion}
                        onChange={(e) => onChange("descripcion", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="input-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.fecha}
                        onChange={(e) => onChange("fecha", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="input-label">Cupo total</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={form.cupoTotal}
                        onChange={(e) => onChange("cupoTotal", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="input-label">Estado</label>
                      <select
                        className="form-select"
                        value={form.estado}
                        onChange={(e) => onChange("estado", e.target.value)}
                        disabled={saving}
                      >
                        <option value="activa">Activa</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </div>

                    <div className="col-12 d-flex gap-2 flex-wrap">
                      <button className="btn btn-success" type="submit" disabled={saving}>
                        {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear actividad"}
                      </button>

                      {editingId ? (
                        <button className="btn btn-outline-secondary" type="button" onClick={cancelEdit} disabled={saving}>
                          Cancelar
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => {
                            cancelEdit();
                            setForm(emptyForm);
                          }}
                          disabled={saving}
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </PanelCard>
            </div>

            {/* =========================
                Activities list section
            ========================= */}
            <div ref={listRef}>
              <SectionHeader
                title="Actividades"
                subtitle="Gestiona evidencias y edita actividades."
                actions={
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => scrollTo(formRef)}
                      disabled={saving}
                    >
                      Nueva actividad
                    </button>
                    <button className="btn btn-eco-ghost btn-sm" type="button" onClick={load} disabled={loading || saving}>
                      {loading ? "Cargando..." : "Refrescar lista"}
                    </button>
                  </div>
                }
              />

              {loading ? (
                <div className="py-4 text-center text-muted">Cargando actividades...</div>
              ) : activities.length === 0 ? (
                <PanelCard title="Sin actividades" subtitle="Aún no hay actividades creadas.">
                  <button className="btn btn-success btn-sm" type="button" onClick={() => scrollTo(formRef)}>
                    Crear primera actividad
                  </button>
                </PanelCard>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <div key={a._id} className="activity-card">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="activity-title">{a.titulo}</div>
                        <span className={STATUS_CHIP[a.estado] || "eco-chip eco-chip-muted"}>
                          {(a.estado || "—").toUpperCase()}
                        </span>
                      </div>

                      <div className="activity-meta mt-2">
                        <div>
                          <strong>Fecha:</strong> {fmtDate(a.fecha)}
                        </div>
                        <div>
                          <strong>Cupo:</strong> {a.cupoDisponible}/{a.cupoTotal}
                        </div>
                        <div>
                          <strong>Lugar:</strong> {a.lugar || "—"}
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          className="btn btn-outline-success btn-sm w-100"
                          type="button"
                          onClick={() => goReviewEvidences(a._id)}
                        >
                          Evidencias
                        </button>

                        <button className="btn btn-outline-primary btn-sm w-100" type="button" onClick={() => startEdit(a)}>
                          Editar
                        </button>

                        <button className="btn btn-outline-danger btn-sm w-100" type="button" onClick={() => remove(a._id)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer spacing */}
            <div style={{ height: 8 }} />
          </div>

          {/* ✅ Modal confirmación eliminar (sin "localhost dice") */}
          <ConfirmModal
            show={showConfirm}
            title="Eliminar actividad"
            message="¿Estás seguro que deseas eliminar esta actividad? Esta acción no se puede deshacer."
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowConfirm(false);
              setActivityToDelete(null);
            }}
          />
        </main>
      </div>
    </div>
  );
}