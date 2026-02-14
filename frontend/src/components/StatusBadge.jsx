// ==============================
// StatusBadge.jsx
// Badge de estado para evidencias / reportes
// ==============================

// ==============================
// Componente
// ==============================
function StatusBadge({ status }) {
  // ==========================
  // Estados posibles
  // ==========================
  if (status === "approved") {
    return <span className="badge bg-success">APROBADA</span>;
  }

  if (status === "rejected") {
    return <span className="badge bg-danger">RECHAZADA</span>;
  }

  // ==========================
  // Estado por defecto
  // ==========================
  return <span className="badge bg-secondary">PENDIENTE</span>;
}

export default StatusBadge;
