// ==============================
// TicketDetails.jsx
// Ticket: detalle + chat (User/Admin)
// - Carga de ticket por id
// - Envío de mensajes (texto + adjunto multipart)
// - Admin: control de estado (open / in_progress / resolved / canceled)
// - Mejoras UI/UX: toolbar moderna, chat scroll, empty states, composer pro
// ==============================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ==============================
// Services (API)
// ==============================
import {
  getTicketById,
  sendTicketMessage,
  updateTicketStatus,
} from "../services/ticketService";

// ==============================
// Session helpers
// ==============================
import { getRole } from "../services/authSession";

// ==============================
// Styles
// ==============================
import "../styles/dashboard.css";

// ==============================
// Constants / UI Config
// ==============================
const STATUS = {
  open: { label: "ABIERTO", chip: "eco-chip eco-chip-muted" },
  in_progress: { label: "EN PROCESO", chip: "eco-chip eco-chip-warn" },
  resolved: { label: "RESUELTO", chip: "eco-chip eco-chip-ok" },
  canceled: { label: "CANCELADO", chip: "eco-chip eco-chip-muted" },
};

// ==============================
// Small Utils
// ==============================
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function formatKB(bytes = 0) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function TicketDetail() {
  // ==============================
  // Router / Params
  // ==============================
  const { id } = useParams();
  const navigate = useNavigate();

  // Rol desde sesión (controla UI/acciones)
  const role = getRole(); // "user" | "admin"

  // ==============================
  // Refs (UX)
  // ==============================
  const chatRef = useRef(null);

  // ==============================
  // State: ticket + composer
  // ==============================
  const [ticket, setTicket] = useState(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  // ==============================
  // State: UI
  // ==============================
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState(null); // { type: "success" | "danger", text }

  // ==============================
  // Navigation helpers
  // ==============================
  const goBack = useCallback(() => {
    navigate(role === "admin" ? "/admin/tickets" : "/user/tickets");
  }, [navigate, role]);

  // Limpia input file
  const clearFileInput = () => {
    const el = document.getElementById("ticketFileInput");
    if (el) el.value = "";
  };

  // Scroll al final del chat (suave)
  const scrollToBottom = useCallback(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // ==============================
  // Data loading
  // ==============================
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);

      const res = await getTicketById(id);
      setTicket(res?.ticket || null);
    } catch (e) {
      setAlert({ type: "danger", text: e?.message || "Error al cargar ticket" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll cuando cargan mensajes
  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading, ticket?.messages?.length, scrollToBottom]);

  // ==============================
  // Derived data
  // ==============================
  const statusUI = useMemo(() => STATUS[ticket?.status] || STATUS.open, [ticket?.status]);

  const messageCount = (ticket?.messages || []).length;
  const isCanceled = ticket?.status === "canceled";

  // ==============================
  // Actions: send message
  // ==============================
  const send = useCallback(async () => {
    const clean = text.trim();

    if (!clean && !file) {
      setAlert({ type: "danger", text: "Escribe un mensaje o adjunta un archivo." });
      return;
    }

    if (isCanceled) {
      setAlert({ type: "danger", text: "Este ticket está cancelado y no admite mensajes." });
      return;
    }

    try {
      setSending(true);
      setAlert(null);

      // ✅ firma correcta del service:
      // sendTicketMessage(ticketId, { text, file })
      const res = await sendTicketMessage(id, { text: clean, file });

      setAlert({ type: "success", text: res?.message || "Mensaje enviado" });

      setText("");
      setFile(null);
      clearFileInput();

      await load();
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      setAlert({ type: "danger", text: e?.message || "Error al enviar mensaje" });
    } finally {
      setSending(false);
    }
  }, [file, id, isCanceled, load, scrollToBottom, text]);

  // ==============================
  // Actions: update status (admin)
  // ==============================
  const setTicketStatus = useCallback(
    async (s) => {
      try {
        setAlert(null);

        const res = await updateTicketStatus(id, s);

        // Tu lógica actual: resolved => backend puede eliminar el ticket
        if (s === "resolved") {
          setAlert({ type: "success", text: res?.message || "Ticket resuelto y eliminado" });
          setTimeout(goBack, 650);
          return;
        }

        setAlert({ type: "success", text: res?.message || "Estado actualizado" });
        await load();
      } catch (e) {
        setAlert({ type: "danger", text: e?.message || "Error al actualizar estado" });
      }
    },
    [goBack, id, load]
  );

  // ==============================
  // Keyboard UX
  // - Enter: enviar
  // - Shift+Enter: salto de línea
  // ==============================
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) send();
    }
  };

  // ==============================
  // Render helpers
  // ==============================
  const renderAttachment = (m) => {
    if (!m?.fileUrl) return null;
    const name = m.fileName || "Archivo adjunto";

    return (
      <a
        href={m.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="eco-attach"
        title="Abrir archivo"
      >
        {name}
      </a>
    );
  };

  // ==============================
  // Render
  // ==============================
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title mb-0">Ticket</h1>
            <div className="text-muted small">
              {role === "admin" ? "Vista administrador" : "Vista usuario"} ·{" "}
              <span className="text-muted">ID:</span> <span className="fw-semibold">{id}</span>
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            {ticket?.status && <span className={statusUI.chip}>{statusUI.label}</span>}

            <button
              className="btn btn-eco-ghost btn-sm"
              type="button"
              onClick={load}
              disabled={loading || sending}
              title="Actualizar ticket"
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={goBack}
              disabled={sending}
            >
              Volver
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert?.text && <div className={`alert alert-${alert.type} py-2`}>{alert.text}</div>}

        {/* Content states */}
        {loading ? (
          <div className="py-4 text-center text-muted">Cargando...</div>
        ) : !ticket ? (
          <div className="eco-empty-state">
            <div className="eco-empty-icon" aria-hidden="true">🧾</div>
            <h5 className="eco-empty-title">Ticket no encontrado</h5>
            <p className="eco-empty-text">Puede que ya haya sido eliminado o no tengas acceso.</p>
            <div className="eco-empty-actions">
              <button className="btn btn-outline-success btn-sm" type="button" onClick={goBack}>
                Volver
              </button>
              <button className="btn btn-success btn-sm" type="button" onClick={load}>
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Meta + Admin controls */}
            <div className="card-soft p-3">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <div className="fw-bold">{ticket.subject}</div>

                  <div className="small text-muted mt-1">
                    <div>
                      <strong>Actividad:</strong> {ticket.activity?.titulo || "—"}
                    </div>
                    <div>
                      <strong>Creado:</strong> {fmtDate(ticket.createdAt)}
                    </div>

                    {role === "admin" && (
                      <div>
                        <strong>Usuario:</strong> {ticket.user?.nombre} {ticket.user?.apellido} (
                        {ticket.user?.email})
                      </div>
                    )}
                  </div>
                </div>

                {role === "admin" && (
                  <div className="eco-segment" role="group" aria-label="Estado del ticket">
                    <button
                      type="button"
                      className={`eco-segment-btn ${ticket.status === "open" ? "is-active" : ""}`}
                      onClick={() => setTicketStatus("open")}
                      disabled={sending}
                      title="Marcar como abierto"
                    >
                      Abrir
                    </button>

                    <button
                      type="button"
                      className={`eco-segment-btn ${
                        ticket.status === "in_progress" ? "is-active" : ""
                      }`}
                      onClick={() => setTicketStatus("in_progress")}
                      disabled={sending}
                      title="Marcar en proceso"
                    >
                      En proceso
                    </button>

                    <button
                      type="button"
                      className={`eco-segment-btn ${ticket.status === "canceled" ? "is-active" : ""}`}
                      onClick={() => setTicketStatus("canceled")}
                      disabled={sending}
                      title="Cancelar ticket"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="eco-segment-btn"
                      onClick={() => setTicketStatus("resolved")}
                      disabled={sending}
                      title="Al marcar como resuelto, el ticket se elimina"
                    >
                      Resuelto
                    </button>
                  </div>
                )}
              </div>

              {/* mini stats */}
              <div className="d-flex gap-2 flex-wrap mt-3">
                <span className="eco-chip eco-chip-muted">Mensajes: {messageCount}</span>
                {ticket.activity?.titulo ? (
                  <span className="eco-chip eco-chip-ok">Vinculado a actividad</span>
                ) : (
                  <span className="eco-chip eco-chip-muted">Sin actividad</span>
                )}
                {isCanceled ? <span className="eco-chip eco-chip-muted">No admite mensajes</span> : null}
              </div>
            </div>

            {/* Chat */}
            <div className="eco-chat-wrap mt-3">
              <div className="eco-chat-head">
                <div className="fw-semibold">Historial</div>
                <div className="text-muted small">Enter para enviar · Shift+Enter para salto</div>
              </div>

              {/* ✅ chat scroll */}
              <div className="eco-chat eco-chat-fixed" ref={chatRef}>
                {messageCount === 0 ? (
                  <div className="eco-empty-state">
                    <div className="eco-empty-icon" aria-hidden="true">💬</div>
                    <h5 className="eco-empty-title">Aún no hay mensajes</h5>
                    <p className="eco-empty-text">Escribe el primer mensaje para iniciar el seguimiento.</p>
                  </div>
                ) : (
                  (ticket.messages || []).map((m) => {
                    const mine =
                      (role === "admin" && m.senderRole === "admin") ||
                      (role === "user" && m.senderRole === "user");

                    return (
                      <div key={m._id} className={`eco-msg ${mine ? "is-mine" : "is-theirs"}`}>
                        <div className="eco-msg-meta">
                          <span className="eco-msg-who">
                            {m.senderRole === "admin" ? "ADMIN" : "USER"}
                            {m.sender?.nombre
                              ? ` · ${m.sender.nombre} ${m.sender.apellido || ""}`
                              : ""}
                          </span>
                          <span className="eco-msg-date">{fmtDate(m.createdAt)}</span>
                        </div>

                        {m.text ? <div className="eco-msg-text">{m.text}</div> : null}
                        {renderAttachment(m)}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <div className="eco-composer">
                <textarea
                  className="form-control"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isCanceled ? "Este ticket está cancelado." : "Escribe un mensaje..."}
                  onKeyDown={onKeyDown}
                  disabled={sending || isCanceled}
                />

                <div className="d-flex gap-2 align-items-center flex-wrap mt-2">
                  <input
                    id="ticketFileInput"
                    type="file"
                    className="form-control"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={sending || isCanceled}
                  />

                  <button
                    className="btn btn-success"
                    type="button"
                    onClick={send}
                    disabled={sending || isCanceled}
                    title="Enviar mensaje"
                  >
                    {sending ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Enviando...
                      </span>
                    ) : (
                      "Enviar"
                    )}
                  </button>

                  {file && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => {
                        setFile(null);
                        clearFileInput();
                      }}
                      disabled={sending || isCanceled}
                    >
                      Quitar archivo
                    </button>
                  )}

                  <button
                    className="btn btn-eco-ghost"
                    type="button"
                    onClick={scrollToBottom}
                    disabled={loading || sending}
                    title="Ir al final"
                  >
                    Ir al final
                  </button>
                </div>

                {file && (
                  <div className="small text-muted mt-2">
                    Archivo: <strong>{file.name}</strong> · {formatKB(file.size)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TicketDetail;