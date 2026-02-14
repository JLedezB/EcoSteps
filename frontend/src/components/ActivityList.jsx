// ==============================
// ActivityList.jsx
// Componente reutilizable para listar actividades
// - Modo admin: botones Editar / Eliminar
// - Modo user: Inscribirme / Cancelar inscripción
// - Calcula si el usuario actual ya está inscrito
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
  // Se usa para determinar si el usuario ya está inscrito en cada actividad
  const myId = getUserId();

  // ==============================
  // 3) Render list
  // ==============================
  return (
    <div className="activity-list">
      {activities.map((a) => {
        // ------------------------------
        // Estado / disponibilidad
        // ------------------------------
        const noCupo = a.cupoDisponible <= 0;
        const cerrada = a.estado !== "activa";

        // ------------------------------
        // Inscripción del usuario
        // ------------------------------
        // participants: array de IDs (ObjectId) o strings
        const participants = a.participants || [];

        // Compara en string para evitar diferencias de tipo (ObjectId vs string)
        const isJoined = myId
          ? participants.some((p) => p.toString() === myId.toString())
          : false;

        // ------------------------------
        // UI
        // ------------------------------
        return (
          <div key={a._id} className="activity-card">
            {/* Info principal */}
            <div className="activity-title">{a.titulo}</div>
            <div className="activity-desc">{a.descripcion}</div>

            {/* Meta */}
            <div className="activity-meta">
              <div>
                <strong>📅 Fecha:</strong>{" "}
                {a.fecha ? new Date(a.fecha).toLocaleDateString() : "—"}
              </div>
              <div>
                <strong>📍 Lugar:</strong> {a.lugar || "—"}
              </div>
              <div>
                <strong>👥 Cupo:</strong> {a.cupoDisponible}/{a.cupoTotal}
              </div>
            </div>

            {/* Badge estado */}
            <span className="activity-badge">
              {a.estado === "activa" ? "ACTIVA" : "CERRADA"}
            </span>

            {/* Acciones */}
            {isAdmin ? (
              // ==============================
              // 4) Acciones ADMIN
              // ==============================
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
              // ==============================
              // 5) Acciones USER
              // ==============================
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
                    {cerrada
                      ? "Actividad cerrada"
                      : noCupo
                      ? "Cupo lleno"
                      : "Inscribirme"}
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
