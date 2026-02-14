// ==============================
// UserProgress.jsx
// Widget de progreso del usuario
// - Consulta dashboard del usuario (horas + evidencias + reportes)
// - Calcula porcentaje de horas completadas
// - Renderiza badges y barra de progreso
// ==============================

import { useEffect, useMemo, useState } from "react";
import { getUserDashboard } from "../services/dashboardService";

function UserProgress() {
  // ==============================
  // 1) State
  // ==============================
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  // ==============================
  // 2) Fetch (load)
  // ==============================
  const load = async () => {
    try {
      setErr(null);
      const res = await getUserDashboard();
      setData(res);
    } catch (e) {
      console.error("USER DASHBOARD ERROR:", e);
      setErr("No se pudo cargar el progreso.");
    }
  };

  // Cargar una vez al montar el componente
  useEffect(() => {
    load();
  }, []);

  // ==============================
  // 3) Valores calculados (memo)
  // ==============================
  const computed = useMemo(() => {
    if (!data) return null;

    // Totales
    const total = data.totalHours || 0;
    const max = data.totalHoursMax || 480;

    // Porcentaje (seguro a 0-100)
    const percent = Math.min(100, Math.round((total / max) * 100));

    // Segmentos (3 bimestres de 160h)
    const seg = 160;
    const s1 = Math.min(seg, total);
    const s2 = Math.min(seg, Math.max(0, total - seg));
    const s3 = Math.min(seg, Math.max(0, total - seg * 2));

    return { total, max, percent, s1, s2, s3 };
  }, [data]);

  // ==============================
  // 4) Estados de UI (error / sin datos)
  // ==============================
  if (err) {
    return (
      <div className="border rounded p-3 mb-3 bg-light">
        <div className="text-danger small">{err}</div>
      </div>
    );
  }

  // Si aún no llega data, no renderiza nada (mantengo tu comportamiento)
  if (!data || !computed) return null;

  // ==============================
  // 5) Render
  // ==============================
  return (
    <div className="border rounded p-3 mb-3 bg-light">
      {/* Header + badges */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div className="fw-semibold">📈 Progreso de Servicio Social</div>
          <div className="small text-muted">
            {computed.total} / {computed.max} horas
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <span className="badge bg-success">
            {data.approvedReports}/{data.approvedReportsMax} reportes aprobados
          </span>

          <span className="badge bg-secondary">
            Evidencias: {data.evidences?.pending ?? 0} pendientes
          </span>

          <span className="badge bg-success">
            {data.evidences?.approved ?? 0} aprobadas
          </span>

          <span className="badge bg-danger">
            {data.evidences?.rejected ?? 0} rechazadas
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-3">
        <div className="progress" style={{ height: 14 }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${computed.percent}%` }}
            aria-valuenow={computed.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Etiquetas por bimestre */}
        <div className="d-flex justify-content-between small text-muted mt-2">
          <span>Bimestre 1 (160h)</span>
          <span>Bimestre 2 (160h)</span>
          <span>Bimestre 3 (160h)</span>
        </div>

        {/* Nota informativa */}
        <div className="small text-muted mt-2">
          Cada reporte bimestral aprobado equivale a <strong>160 horas</strong>.
        </div>
      </div>
    </div>
  );
}

export default UserProgress;
