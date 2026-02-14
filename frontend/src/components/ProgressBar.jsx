// ==============================
// ProgressBar.jsx
// Barra de progreso de Servicio Social
// - Muestra bimestres completados
// - Muestra horas acumuladas
// ==============================

// ==============================
// Componente
// ==============================
function ProgressBar({ sections, hours, totalHours }) {
  return (
    <div>
      {/* ==========================
          1) Barra de progreso por bimestre
         ========================== */}
      <div className="progress mb-2" style={{ height: "28px" }}>
        {sections.map((done, i) => (
          <div
            key={i}
            className={`progress-bar ${
              done ? "bg-success" : "bg-light text-dark"
            }`}
            style={{ width: "33.333%" }}
          >
            {done ? `Bimestre ${i + 1} ✓` : `Bimestre ${i + 1}`}
          </div>
        ))}
      </div>

      {/* ==========================
          2) Texto de horas totales
         ========================== */}
      <p className="text-center fw-bold mb-0">
        {hours} / {totalHours} horas de servicio social
      </p>
    </div>
  );
}

export default ProgressBar;
