// ==============================
// ActivityList.jsx (PRO)
// Lista actividades (User/Admin)
// - UI profesional: card header, meta grid, badges, acciones consistentes
// - isJoined robusto (participants puede venir string u objeto)
// - Fecha estable (UTC)
// ==============================

import { getUserId } from "../services/authSession";

function formatDateUTC(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { timeZone: "UTC" });
}

function normalizeId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") return x._id || x.id || "";
  return String(x);
}

function ActivityList({
  activities,
  isAdmin = false,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
}) {
  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <div className="act-empty" role="status" aria-live="polite">
        <div className="act-empty-icon" aria-hidden="true">🌿</div>
        <div className="act-empty-title">No hay actividades por mostrar</div>
        <div className="act-empty-sub">
          Cuando haya actividades disponibles, aparecerán aquí.
        </div>
      </div>
    );
  }

  const myId = getUserId();

  return (
    <div className="act-grid" aria-label="Lista de actividades">
      {activities.map((a) => {
        const estado = (a?.estado || "").toLowerCase();
        const cerrada = estado !== "activa";
        const cupoDisp = Number(a?.cupoDisponible ?? 0);
        const cupoTotal = Number(a?.cupoTotal ?? 0);
        const noCupo = cupoDisp <= 0;

        const participants = Array.isArray(a?.participants) ? a.participants : [];
        const isJoined = myId
          ? participants.some((p) => normalizeId(p) === String(myId))
          : false;

        const statusLabel = cerrada ? "CERRADA" : noCupo ? "CUPO LLENO" : "ACTIVA";
        const statusClass = cerrada ? "is-closed" : noCupo ? "is-full" : "is-open";

        return (
          <article key={a._id} className="act-card">
            {/* Header */}
            <header className="act-head">
              <div className="act-head-left">
                <h3 className="act-title">{a?.titulo || "Actividad"}</h3>
                <p className="act-desc">{a?.descripcion || "Sin descripción."}</p>
              </div>

              <div className={`act-status ${statusClass}`} title={`Estado: ${statusLabel}`}>
                {statusLabel}
              </div>
            </header>

            {/* Meta */}
            <div className="act-meta">
              <div className="act-meta-item">
                <span className="act-meta-k">📅 Fecha</span>
                <span className="act-meta-v">{formatDateUTC(a?.fecha)}</span>
              </div>

              <div className="act-meta-item">
                <span className="act-meta-k">📍 Lugar</span>
                <span className="act-meta-v">{a?.lugar || "—"}</span>
              </div>

              <div className="act-meta-item">
                <span className="act-meta-k">👥 Cupo</span>
                <span className="act-meta-v">
                  {cupoDisp}/{cupoTotal || "—"}
                </span>
              </div>
            </div>

            {/* Footer actions */}
            <footer className="act-foot">
              {isAdmin ? (
                <div className="act-actions">
                  <button
                    className="act-btn act-btn-ghost"
                    type="button"
                    onClick={() => onEdit && onEdit(a)}
                  >
                    Editar
                  </button>

                  <button
                    className="act-btn act-btn-danger"
                    type="button"
                    onClick={() => onDelete && onDelete(a)}
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="act-actions">
                  {isJoined ? (
                    <button
                      className="act-btn act-btn-danger"
                      type="button"
                      onClick={() => onLeave && onLeave(a)}
                    >
                      Cancelar inscripción
                    </button>
                  ) : (
                    <button
                      className="act-btn act-btn-primary"
                      type="button"
                      disabled={noCupo || cerrada}
                      onClick={() => onJoin && onJoin(a)}
                      title={cerrada ? "Actividad cerrada" : noCupo ? "Cupo lleno" : "Inscribirme"}
                    >
                      {cerrada ? "Actividad cerrada" : noCupo ? "Cupo lleno" : "Inscribirme"}
                    </button>
                  )}
                </div>
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}

export default ActivityList;