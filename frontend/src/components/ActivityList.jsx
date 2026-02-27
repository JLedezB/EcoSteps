// ==============================
// ActivityList.jsx
// Componente reutilizable para listar actividades
// - Modo admin: botones Editar / Eliminar
// - Modo user: Inscribirme / Cancelar inscripción
// - Calcula si el usuario actual ya está inscrito
// ✅ Fecha: formateo estable (UTC)
// ==============================

import { getUserId } from "../services/authSession";

// ==============================
// Props
// ==============================
// activities: array de actividades
// isAdmin: habilita acciones administrativas
// onEdit / onDelete: callbacks admin
// onJoin / onLeave: callbacks user
function ActivityList({
  activities,
  isAdmin = false,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
}) {
  // ==============================
  // 1) Empty state
  // ==============================
  if (!activities || activities.length === 0) {
    return <p>No hay actividades disponibles.</p>;
  }

  // ==============================
  // 2) Sesión / user actual
  // ==============================
  const myId = getUserId();

  // ==============================
  // 3) Render list
  // ==============================
  return (
    <div className="activity-list">
      {activities.map((a) => {
        const noCupo = a.cupoDisponible <= 0;
        const cerrada = a.estado !== "activa";

        const participants = a.participants || [];

        const isJoined = myId
          ? participants.some((p) => p.toString() === myId.toString())
          : false;

        return (
          <div key={a._id} className="activity-card">
            <div className="activity-title">{a.titulo}</div>
            <div className="activity-desc">{a.descripcion}</div>

            <div className="activity-meta">
              <div>
                <strong>📅 Fecha:</strong>{" "}
                {a.fecha
                  ? new Date(a.fecha).toLocaleDateString("es-MX", {
                      timeZone: "UTC",
                    })
                  : "—"}
              </div>
              <div>
                <strong>📍 Lugar:</strong> {a.lugar || "—"}
              </div>
              <div>
                <strong>👥 Cupo:</strong> {a.cupoDisponible}/{a.cupoTotal}
              </div>
            </div>

            <span className="activity-badge">
              {a.estado === "activa" ? "ACTIVA" : "CERRADA"}
            </span>

            {isAdmin ? (
              <div className="mt-3 d-flex gap-2">
                <button
                  className="btn btn-outline-success btn-sm"
                  type="button"
                  onClick={() => onEdit && onEdit(a)}
                >
                  Editar
                </button>

                <button
                  className="btn btn-outline-danger btn-sm"
                  type="button"
                  onClick={() => onDelete && onDelete(a)}
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <div className="mt-3">
                {isJoined ? (
                  <button
                    className="btn btn-outline-danger btn-sm w-100"
                    type="button"
                    onClick={() => onLeave && onLeave(a)}
                  >
                    Cancelar inscripción
                  </button>
                ) : (
                  <button
                    className="btn btn-success btn-sm w-100"
                    type="button"
                    disabled={noCupo || cerrada}
                    onClick={() => onJoin && onJoin(a)}
                  >
                    {cerrada ? "Actividad cerrada" : noCupo ? "Cupo lleno" : "Inscribirme"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ActivityList;