import React from "react";
import "../styles/confirmModal.css";

export default function ConfirmModal({
  show,
  title = "Confirmación",
  message,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h5 className="confirm-title">{title}</h5>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="btn btn-outline-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}