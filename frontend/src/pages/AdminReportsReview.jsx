import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiOutlineArrowLeft,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import { getPendingReports, updateReportStatus } from "../services/reportService";
import "../styles/adminreportsreview.css";

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

function StatCard({ title, value, hint }) {
  return (
    <article className="reports-stat-card">
      <div className="reports-stat-title">{title}</div>
      <div className="reports-stat-value">{value}</div>
      <div className="reports-stat-hint">{hint}</div>
    </article>
  );
}

function SidebarItem({ icon, label, active = false, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`reports-nav-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="reports-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function AdminReportsReview() {
  const navigate = useNavigate();
  const listRef = useRef(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [alert, setAlert] = useState(null);

  const pendingCount = useMemo(() => reports.length, [reports]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await getPendingReports();
      setReports(res?.reports || []);
    } catch (e) {
      setAlert({ type: "danger", text: e?.message || "Error al cargar reportes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setReportStatus = useCallback(
    async (id, status) => {
      try {
        setAlert(null);
        setBusyId(id);

        const res = await updateReportStatus(id, status);
        setAlert({ type: "success", text: res?.message || "Estado actualizado correctamente" });

        await load();
        queueMicrotask(() =>
          listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        );
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || "Error al actualizar reporte" });
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  return (
    <div className="reports-page">
      <div className="reports-shell">
        {/* Sidebar */}
        <aside className="reports-sidebar" aria-label="Navegación admin reportes">
          <div className="reports-sidebar-head">
            <div className="reports-brand-mark">
              <FaLeaf />
            </div>

            <div className="reports-brand-copy">
              <div className="reports-sidebar-brand">EcoSteps SGSS</div>
              <div className="reports-sidebar-subbrand">Administración</div>
            </div>
          </div>

          <nav className="reports-sidebar-nav">
            <SidebarItem
              icon={<HiOutlineSquares2X2 />}
              label="Dashboard"
              onClick={() => navigate("/admin")}
              disabled={loading || !!busyId}
            />

            <SidebarItem
              icon={<HiOutlineDocumentText />}
              label="Reportes"
              active
              onClick={() => navigate("/admin/reports")}
              disabled={loading || !!busyId}
            />
          </nav>

          <div className="reports-sidebar-foot">
            <div className="reports-module-card">
              <div className="reports-module-label">Módulo</div>
              <div className="reports-module-title">Reportes</div>
              <div className="reports-module-subtitle">Revisión bimestral</div>
            </div>

            <button
              className="reports-back-btn"
              onClick={() => navigate("/admin")}
              type="button"
              disabled={loading || !!busyId}
            >
              <HiOutlineArrowLeft />
              Volver al panel
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="reports-main" aria-label="Contenido admin reportes">
          <div className="reports-main-card">
            {/* Hero */}
            <section className="reports-hero">
              <div className="reports-hero-copy">
                <div className="reports-hero-eyebrow">Gestión administrativa</div>
                <h1 className="reports-hero-title">Reportes bimestrales</h1>
                <p className="reports-hero-subtitle">
                  Revisa los reportes pendientes enviados por los usuarios, valida sus horas y
                  aprueba o rechaza cada entrega.
                </p>
              </div>

              <div className="reports-hero-actions">
                <button
                  className="btn btn-light reports-ghost-btn"
                  onClick={load}
                  type="button"
                  disabled={loading || !!busyId}
                  title="Actualizar lista"
                >
                  <HiOutlineArrowPath />
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button
                  className="btn btn-light reports-ghost-btn"
                  onClick={() => navigate("/admin")}
                  type="button"
                  disabled={loading || !!busyId}
                >
                  <HiOutlineArrowLeft />
                  Volver
                </button>
              </div>
            </section>

            {/* Alert */}
            {alert?.text && <div className={`alert alert-${alert.type} reports-alert`}>{alert.text}</div>}

            {/* Stats */}
            <section className="reports-stats-grid">
              <StatCard title="Pendientes" value={pendingCount} hint="Reportes por revisar" />
            </section>

            {/* List */}
            <section className="reports-section" ref={listRef}>
              <div className="reports-section-head">
                <div>
                  <div className="reports-section-eyebrow">Listado</div>
                  <h2 className="reports-section-title">Reportes pendientes</h2>
                  <p className="reports-section-subtitle">
                    Aquí aparecerán los reportes enviados para revisión administrativa.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="reports-empty-card">
                  <div className="reports-empty-title">Cargando reportes...</div>
                  <div className="reports-empty-subtitle">Espera un momento mientras se actualiza la lista.</div>
                </div>
              ) : reports.length === 0 ? (
                <div className="reports-empty-card">
                  <div className="reports-empty-title">No hay reportes pendientes</div>
                  <div className="reports-empty-subtitle">
                    Cuando un usuario suba un reporte, aparecerá aquí para su revisión.
                  </div>
                </div>
              ) : (
                <div className="reports-list">
                  {reports.map((r) => {
                    const isBusy = busyId === r._id;

                    return (
                      <article key={r._id} className="report-card">
                        <div className="report-card-top">
                          <div className="report-user-block">
                            <div className="report-user-avatar">
                              {(r.user?.nombre?.[0] || "U").toUpperCase()}
                            </div>

                            <div>
                              <h3 className="report-user-name">
                                {r.user?.nombre || "Usuario"} {r.user?.apellido || ""}
                              </h3>
                              <p className="report-user-email">{r.user?.email || "Sin correo registrado"}</p>
                            </div>
                          </div>

                          <span className="report-badge report-badge-pending">
                            <HiOutlineClock />
                            Pendiente
                          </span>
                        </div>

                        <div className="report-meta-grid">
                          <div className="report-meta-card">
                            <div className="report-meta-label">
                              <HiOutlineClipboardDocumentList />
                              Bimestre
                            </div>
                            <div className="report-meta-value">{r.bimestre || "—"}</div>
                          </div>

                          <div className="report-meta-card">
                            <div className="report-meta-label">
                              <HiOutlineCheckCircle />
                              Horas
                            </div>
                            <div className="report-meta-value">{r.hours ?? "—"}</div>
                          </div>

                          <div className="report-meta-card">
                            <div className="report-meta-label">
                              <HiOutlineCalendarDays />
                              Fecha de envío
                            </div>
                            <div className="report-meta-value">{fmtDate(r.createdAt)}</div>
                          </div>
                        </div>

                        <div className="report-card-bottom">
                          <a
                            className="report-file-link"
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <HiOutlineEye />
                            Ver archivo
                          </a>

                          <div className="report-actions">
                            <button
                              className="btn btn-success btn-sm report-approve-btn"
                              onClick={() => setReportStatus(r._id, "approved")}
                              type="button"
                              disabled={isBusy}
                            >
                              <HiOutlineCheckCircle />
                              {isBusy ? "Procesando..." : "Aprobar"}
                            </button>

                            <button
                              className="btn btn-danger btn-sm report-reject-btn"
                              onClick={() => setReportStatus(r._id, "rejected")}
                              type="button"
                              disabled={isBusy}
                            >
                              <HiOutlineXCircle />
                              {isBusy ? "Procesando..." : "Rechazar"}
                            </button>
                          </div>
                        </div>

                        <div className="report-note">
                          Al aprobar, se suman automáticamente las horas correspondientes al usuario.
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