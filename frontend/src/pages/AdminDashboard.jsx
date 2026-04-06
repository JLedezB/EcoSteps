// ==============================
// AdminDashboard.jsx
// Panel administrador PRO
// - Tipografía y estructura más profesional
// - Sidebar moderno con íconos reales (sin emoji)
// - Métricas + CRUD + navegación
// - ConfirmModal para eliminar
// - Fecha estable en UTC
// ==============================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import LogoutButton from "../components/LogoutButton";
import ConfirmModal from "../components/ConfirmModal";

// ==============================
// Services
// ==============================
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activityService";
import { getAdminDashboard } from "../services/dashboardService";

// ==============================
// Charts
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
import "../styles/admindashboard.css";

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

const CHART_COLORS = ["#1f8f5f", "#f59e0b", "#2563eb", "#ef4444", "#7c3aed"];

// ==============================
// Utils
// ==============================
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("es-MX", { timeZone: "UTC" });
}

function toDateInputValueUTC(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

function sumValues(data) {
  return (data || []).reduce((acc, d) => acc + (Number(d?.value) || 0), 0);
}

function shorten(str, max = 14) {
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
      <div className="eco-chart-empty-title">{title}</div>
      <div className="eco-chart-empty-sub">Aún no hay registros suficientes.</div>
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
// Reusable UI
// ==============================
function PanelCard({ title, subtitle, actions, children }) {
  return (
    <section className="eco-panel">
      {(title || subtitle || actions) && (
        <div className="eco-panel-head">
          <div>
            {title ? <h3 className="eco-panel-title">{title}</h3> : null}
            {subtitle ? <p className="eco-panel-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="eco-panel-actions">{actions}</div> : null}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

function Kpi({ title, value, hint, action }) {
  return (
    <article className="eco-kpi">
      <div className="eco-kpi-title">{title}</div>
      <div className="eco-kpi-value">{value}</div>
      <div className="eco-kpi-bottom">
        <div className="eco-kpi-hint">{hint || "—"}</div>
        {action ? <div>{action}</div> : null}
      </div>
    </article>
  );
}

function SectionHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="eco-section-head">
      <div>
        {eyebrow ? <div className="eco-section-eyebrow">{eyebrow}</div> : null}
        <h2 className="eco-section-title">{title}</h2>
        {subtitle ? <p className="eco-section-subtitle">{subtitle}</p> : null}
      </div>

      {actions ? <div className="eco-section-actions">{actions}</div> : null}
    </div>
  );
}

function SidebarItem({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      className={`eco-nav-item ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <span className="eco-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="eco-mini-stat">
      <span className="eco-mini-stat-label">{label}</span>
      <span className="eco-mini-stat-value">{value}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const overviewRef = useRef(null);
  const chartsRef = useRef(null);
  const formRef = useRef(null);
  const listRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // ==============================
  // Navigation
  // ==============================
  const goTickets = useCallback(() => navigate("/admin/tickets"), [navigate]);
  const goReviewReports = useCallback(() => navigate("/admin/reports"), [navigate]);
  const goReviewEvidences = useCallback(
    (activityId) => navigate(`/admin/evidences/${activityId}`),
    [navigate]
  );

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ==============================
  // Load
  // ==============================
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);

      const [actRes, dashRes] = await Promise.all([getActivities(), getAdminDashboard()]);

      setActivities(actRes?.activities || []);
      setStats(dashRes || null);
    } catch (err) {
      setAlert({
        type: "danger",
        text: err?.message || "Error al cargar el panel administrador.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ==============================
  // Form logic
  // ==============================
  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = (a) => {
    setEditingId(a._id);
    setForm({
      titulo: a.titulo || "",
      descripcion: a.descripcion || "",
      fecha: a.fecha ? toDateInputValueUTC(a.fecha) : "",
      lugar: a.lugar || "",
      cupoTotal: a.cupoTotal || 1,
      estado: a.estado || "activa",
    });
    setAlert(null);
    queueMicrotask(() => scrollTo(formRef));
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
      setAlert({
        type: "danger",
        text: "Completa título, descripción, fecha y cupo total.",
      });
      return;
    }

    try {
      setSaving(true);
      setAlert(null);

      if (editingId) {
        const res = await updateActivity(editingId, payload);
        setAlert({ type: "success", text: res?.message || "Actividad actualizada correctamente." });
      } else {
        const res = await createActivity(payload);
        setAlert({ type: "success", text: res?.message || "Actividad creada correctamente." });
      }

      cancelEdit();
      await load();
      queueMicrotask(() => scrollTo(listRef));
    } catch (err) {
      setAlert({
        type: "danger",
        text: err?.message || "Error al guardar la actividad.",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = (id) => {
    setActivityToDelete(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;

    try {
      setAlert(null);
      const res = await deleteActivity(activityToDelete);
      setAlert({ type: "success", text: res?.message || "Actividad eliminada correctamente." });
      await load();
    } catch (err) {
      setAlert({ type: "danger", text: err?.message || "Error al eliminar la actividad." });
    } finally {
      setShowConfirm(false);
      setActivityToDelete(null);
    }
  };

  // ==============================
  // Chart data
  // ==============================
  const ticketsPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Abiertos", value: stats.openTickets ?? 0 },
      { name: "En progreso", value: stats.inProgressTickets ?? 0 },
      { name: "Resueltos", value: stats.resolvedTickets ?? 0 },
    ];
  }, [stats]);

  const evidencesPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Pendientes", value: stats.pendingEvidences ?? 0 },
      { name: "Aprobadas", value: stats.approvedEvidences ?? 0 },
      { name: "Rechazadas", value: stats.rejectedEvidences ?? 0 },
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
            onClick={() => scrollTo(chartsRef)}
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
        hint: "Rol usuario",
      },
    ];
  }, [goReviewReports, goTickets, stats]);

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        {/* =========================
            Sidebar
        ========================= */}
        <aside className="eco-sidebar" aria-label="Navegación administrador">
          <div className="eco-sidebar-head">
            <div className="eco-brand-mark">
              <FaLeaf />
            </div>

            <div className="eco-brand-copy">
              <div className="eco-sidebar-brand">EcoSteps SGSS</div>
              <div className="eco-sidebar-brand-sub">Administración</div>
            </div>
          </div>

          <nav className="eco-sidebar-nav">
            <SidebarItem
              icon={<HiOutlineSquares2X2 />}
              label="Dashboard"
              active
              onClick={() => navigate("/admin")}
            />

            <SidebarItem
              icon={<HiOutlineDocumentText />}
              label="Reportes"
              onClick={goReviewReports}
            />

            <SidebarItem icon={<HiOutlineTicket />} label="Tickets" onClick={goTickets} />

            <SidebarItem
              icon={<HiOutlineChartBar />}
              label="Métricas"
              onClick={() => scrollTo(chartsRef)}
            />

            <SidebarItem
              icon={<HiOutlinePlusCircle />}
              label="Crear actividad"
              onClick={() => scrollTo(formRef)}
            />

            <SidebarItem
              icon={<HiOutlineClipboardDocumentList />}
              label="Actividades"
              onClick={() => scrollTo(listRef)}
            />
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-profile-card">
              <div className="eco-profile-top">
                <div className="eco-profile-badge">ADMIN</div>
              </div>

              <div className="eco-profile-role">Gestión y revisión</div>
              <div className="eco-profile-copy">
                Supervisa actividades, reportes, tickets y métricas del sistema.
              </div>

              <div className="eco-profile-stats">
                <StatMini label="Usuarios" value={stats?.totalUsers ?? 0} />
                <StatMini label="Tickets" value={stats?.openTickets ?? 0} />
              </div>
            </div>

            <div className="eco-logout-wrap">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* =========================
            Main
        ========================= */}
        <main className="eco-main" aria-label="Contenido principal administrador">
          <div className="eco-main-card">
            {/* Hero / Top header */}
            <section ref={overviewRef} className="eco-hero">
              <div className="eco-hero-copy">
                <div className="eco-hero-eyebrow">Panel de control</div>
                <h1 className="eco-hero-title">Administración general</h1>
                <p className="eco-hero-subtitle">
                  Visualiza métricas, revisa módulos y administra actividades desde un solo lugar.
                </p>
              </div>

              <div className="eco-hero-actions">
                <button className="btn btn-success btn-sm" type="button" onClick={goReviewReports}>
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
                  <HiOutlineArrowPath style={{ marginRight: 6 }} />
                  {loading ? "Cargando..." : "Refrescar"}
                </button>
              </div>
            </section>

            {alert?.text ? <div className={`alert alert-${alert.type} eco-alert`}>{alert.text}</div> : null}

            {/* KPIs */}
            <section className="eco-overview-grid">
              {stats ? (
                kpis.map((k) => (
                  <Kpi key={k.title} title={k.title} value={k.value} hint={k.hint} action={k.action} />
                ))
              ) : (
                <div className="eco-loading-box">
                  {loading ? "Cargando métricas..." : "No fue posible cargar la información."}
                </div>
              )}
            </section>

            {/* =========================
                Metrics section
            ========================= */}
            <section ref={chartsRef} className="eco-block">
              <SectionHeader
                eyebrow="Analítica"
                title="Métricas del sistema"
                subtitle="Distribuciones y ranking actual. Actualiza manualmente con el botón de refrescar."
                actions={
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => scrollTo(formRef)}
                  >
                    Crear actividad
                  </button>
                }
              />

              {stats ? (
                <div className="eco-grid-2">
                  <PanelCard title="Tickets por estado" subtitle="Distribución actual">
                    <div className="eco-chart-box">
                      {ticketsTotal === 0 ? (
                        <EmptyChart title="Sin tickets registrados" />
                      ) : (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={ticketsPieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={64}
                              outerRadius={94}
                              paddingAngle={3}
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

                  <PanelCard title="Evidencias por estado" subtitle="Pendientes, aprobadas y rechazadas">
                    <div className="eco-chart-box">
                      {evidencesTotal === 0 ? (
                        <EmptyChart title="Sin evidencias registradas" />
                      ) : (
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={evidencesPieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={64}
                              outerRadius={94}
                              paddingAngle={3}
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

                  <PanelCard title="Top actividades" subtitle="Participación por actividad">
                    <div className="eco-chart-box eco-chart-box-tall">
                      {topActivitiesBar.length === 0 ? (
                        <EmptyChart title="Sin actividades con participación" />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart
                            data={topActivitiesBar}
                            margin={{ top: 8, right: 10, left: 0, bottom: 6 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.28} />
                            <XAxis
                              dataKey="titulo"
                              tickFormatter={(v) => shorten(v, 14)}
                              interval={0}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend verticalAlign="bottom" height={24} />
                            <Bar
                              dataKey="participantes"
                              name="Participantes"
                              radius={[10, 10, 0, 0]}
                              barSize={30}
                              fill={CHART_COLORS[2]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </PanelCard>

                  <PanelCard title="Usuarios más activos" subtitle="Cantidad de evidencias enviadas">
                    <div className="eco-chart-box eco-chart-box-tall">
                      {usersActiveBar.length === 0 ? (
                        <EmptyChart title="Sin usuarios activos" />
                      ) : (
                        <ResponsiveContainer>
                          <BarChart
                            data={usersActiveBar}
                            margin={{ top: 8, right: 10, left: 0, bottom: 6 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.28} />
                            <XAxis
                              dataKey="nombre"
                              tickFormatter={(v) => shorten(v, 14)}
                              interval={0}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend verticalAlign="bottom" height={24} />
                            <Bar
                              dataKey="evidencias"
                              name="Evidencias"
                              radius={[10, 10, 0, 0]}
                              barSize={30}
                              fill={CHART_COLORS[0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </PanelCard>
                </div>
              ) : (
                <PanelCard title="Métricas" subtitle="Cargando información del sistema">
                  <div className="eco-loading-box">
                    {loading ? "Cargando métricas..." : "Sin información disponible."}
                  </div>
                </PanelCard>
              )}
            </section>

            {/* =========================
                Form section
            ========================= */}
            <section ref={formRef} className="eco-block">
              <SectionHeader
                eyebrow="Gestión"
                title={editingId ? "Editar actividad" : "Crear nueva actividad"}
                subtitle="Completa los campos principales para registrar o actualizar una actividad."
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
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => scrollTo(listRef)}
                    >
                      Ver actividades
                    </button>
                  )
                }
              />

              <PanelCard>
                <form onSubmit={submit}>
                  <div className="eco-form-grid">
                    <div className="eco-field eco-field-span-6">
                      <label className="input-label">Título</label>
                      <input
                        className="form-control"
                        placeholder="Ej. Jornada de reforestación"
                        value={form.titulo}
                        onChange={(e) => onChange("titulo", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="eco-field eco-field-span-6">
                      <label className="input-label">Lugar</label>
                      <div className="eco-input-icon-wrap">
                        <span className="eco-input-icon">
                          <HiOutlineMapPin />
                        </span>
                        <input
                          className="form-control eco-input-with-icon"
                          placeholder="Ubicación de la actividad"
                          value={form.lugar}
                          onChange={(e) => onChange("lugar", e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="eco-field eco-field-span-12">
                      <label className="input-label">Descripción</label>
                      <textarea
                        className="form-control"
                        placeholder="Describe el objetivo, dinámica o instrucciones de la actividad"
                        rows={4}
                        value={form.descripcion}
                        onChange={(e) => onChange("descripcion", e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="eco-field eco-field-span-4">
                      <label className="input-label">Fecha</label>
                      <div className="eco-input-icon-wrap">
                        <span className="eco-input-icon">
                          <HiOutlineCalendarDays />
                        </span>
                        <input
                          type="date"
                          className="form-control eco-input-with-icon"
                          value={form.fecha}
                          onChange={(e) => onChange("fecha", e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="eco-field eco-field-span-4">
                      <label className="input-label">Cupo total</label>
                      <div className="eco-input-icon-wrap">
                        <span className="eco-input-icon">
                          <HiOutlineUsers />
                        </span>
                        <input
                          type="number"
                          min={1}
                          className="form-control eco-input-with-icon"
                          value={form.cupoTotal}
                          onChange={(e) => onChange("cupoTotal", e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="eco-field eco-field-span-4">
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

                    <div className="eco-field eco-field-span-12">
                      <div className="eco-form-actions">
                        <button className="btn btn-success" type="submit" disabled={saving}>
                          {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear actividad"}
                        </button>

                        {editingId ? (
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                          >
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
                            Limpiar formulario
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </PanelCard>
            </section>

            {/* =========================
                Activities section
            ========================= */}
            <section ref={listRef} className="eco-block">
              <SectionHeader
                eyebrow="Listado"
                title="Actividades registradas"
                subtitle="Administra evidencias, edita información o elimina registros."
                actions={
                  <div className="eco-section-actions">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      type="button"
                      onClick={() => scrollTo(formRef)}
                      disabled={saving}
                    >
                      Nueva actividad
                    </button>

                    <button
                      className="btn btn-eco-ghost btn-sm"
                      type="button"
                      onClick={load}
                      disabled={loading || saving}
                    >
                      {loading ? "Cargando..." : "Refrescar lista"}
                    </button>
                  </div>
                }
              />

              {loading ? (
                <div className="eco-loading-box">Cargando actividades...</div>
              ) : activities.length === 0 ? (
                <PanelCard title="Sin actividades" subtitle="Aún no se han creado actividades.">
                  <button className="btn btn-success btn-sm" type="button" onClick={() => scrollTo(formRef)}>
                    Crear primera actividad
                  </button>
                </PanelCard>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <article key={a._id} className="activity-card">
                      <div className="activity-card-top">
                        <div>
                          <h3 className="activity-title">{a.titulo}</h3>
                          <p className="activity-desc">{a.descripcion || "Sin descripción registrada."}</p>
                        </div>

                        <span className={STATUS_CHIP[a.estado] || "eco-chip eco-chip-muted"}>
                          {(a.estado || "—").toUpperCase()}
                        </span>
                      </div>

                      <div className="activity-meta">
                        <div className="activity-meta-box">
                          <span className="activity-meta-label">Fecha</span>
                          <span className="activity-meta-value">{fmtDate(a.fecha)}</span>
                        </div>

                        <div className="activity-meta-box">
                       <span className="activity-meta-label">Cupo</span>
                      <span className="activity-meta-value">
                           {(a.participants?.length || 0)}/{a.cupoTotal}
                       </span>
                        </div>

                        <div className="activity-meta-box">
                          <span className="activity-meta-label">Lugar</span>
                          <span className="activity-meta-value">{a.lugar || "—"}</span>
                        </div>
                      </div>

                      <div className="activity-actions">
                        <button
                          className="btn btn-outline-success btn-sm"
                          type="button"
                          onClick={() => goReviewEvidences(a._id)}
                        >
                          <HiOutlineClipboardDocumentList style={{ marginRight: 6 }} />
                          Evidencias
                        </button>

                        <button
                          className="btn btn-outline-primary btn-sm"
                          type="button"
                          onClick={() => startEdit(a)}
                        >
                          <HiOutlinePencilSquare style={{ marginRight: 6 }} />
                          Editar
                        </button>

                        <button
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          onClick={() => remove(a._id)}
                        >
                          <HiOutlineTrash style={{ marginRight: 6 }} />
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <ConfirmModal
            show={showConfirm}
            title="Eliminar actividad"
            message="¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer."
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