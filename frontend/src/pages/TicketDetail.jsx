import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlineXMark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineUserCircle,
  HiOutlineEnvelope,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowDownCircle,
} from "react-icons/hi2";

import {
  getTicketById,
  sendTicketMessage,
  updateTicketStatus,
} from "../services/ticketService";
import { getRole } from "../services/authSession";

import "../styles/ticketdetail.css";

const STATUS = {
  open: { label: "ABIERTO", className: "td-chip td-chip-muted" },
  in_progress: { label: "EN PROCESO", className: "td-chip td-chip-warn" },
  resolved: { label: "RESUELTO", className: "td-chip td-chip-success" },
  canceled: { label: "CANCELADO", className: "td-chip td-chip-muted" },
};

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }

  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function AttachmentLink({ fileUrl, fileName }) {
  if (!fileUrl) return null;

  return (
    <a
      className="td-attachment"
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      title="Abrir archivo adjunto"
    >
      <span className="td-attachment-icon" aria-hidden="true">
        <HiOutlinePaperClip />
      </span>
      <span className="td-attachment-name">{fileName || "Archivo adjunto"}</span>
    </a>
  );
}

function LoadingState() {
  return (
    <div className="td-skel" aria-label="Cargando ticket">
      <div className="td-skel-bar w34" />
      <div className="td-skel-bar w22" />
      <div className="td-skel-panel" />
    </div>
  );
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = getRole();

  const chatRef = useRef(null);
  const fileRef = useRef(null);

  const [ticket, setTicket] = useState(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState(null);

  const goBack = useCallback(() => {
    navigate(role === "admin" ? "/admin/tickets" : "/user/tickets");
  }, [navigate, role]);

  const clearFileInput = useCallback(() => {
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);

      const res = await getTicketById(id);
      setTicket(res?.ticket || null);
    } catch (e) {
      setTicket(null);
      setAlert({
        type: "error",
        text: e?.message || "Error al cargar el ticket",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom(false);
    }
  }, [loading, ticket?.messages?.length, scrollToBottom]);

  const statusUI = useMemo(() => STATUS[ticket?.status] || STATUS.open, [ticket?.status]);
  const isCanceled = ticket?.status === "canceled";
  const messages = ticket?.messages || [];
  const messageCount = messages.length;

  const canSend = useMemo(() => {
    return !sending && !isCanceled && (text.trim().length > 0 || !!file);
  }, [sending, isCanceled, text, file]);

  const onPickFile = useCallback((e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    clearFileInput();
  }, [clearFileInput]);

  const onSend = useCallback(async () => {
    const cleanText = text.trim();

    if (!cleanText && !file) {
      setAlert({
        type: "error",
        text: "Escribe un mensaje o adjunta un archivo.",
      });
      return;
    }

    if (isCanceled) {
      setAlert({
        type: "error",
        text: "Este ticket está cancelado y no admite más mensajes.",
      });
      return;
    }

    try {
      setSending(true);
      setAlert(null);

      const res = await sendTicketMessage(id, {
        text: cleanText,
        file,
      });

      setAlert({
        type: "success",
        text: `✅ ${res?.message || "Mensaje enviado correctamente"}`,
      });

      setText("");
      setFile(null);
      clearFileInput();

      await loadTicket();
      setTimeout(() => scrollToBottom(true), 80);
    } catch (e) {
      setAlert({
        type: "error",
        text: `❌ ${e?.message || "Error al enviar mensaje"}`,
      });
    } finally {
      setSending(false);
    }
  }, [text, file, isCanceled, id, clearFileInput, loadTicket, scrollToBottom]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) onSend();
      }
    },
    [canSend, onSend]
  );

  const setTicketStatus = useCallback(
    async (nextStatus) => {
      try {
        setAlert(null);

        const res = await updateTicketStatus(id, nextStatus);

        if (nextStatus === "resolved") {
          setAlert({
            type: "success",
            text: `✅ ${res?.message || "Ticket resuelto"}`,
          });
          setTimeout(goBack, 700);
          return;
        }

        setAlert({
          type: "success",
          text: `✅ ${res?.message || "Estado actualizado"}`,
        });

        await loadTicket();
      } catch (e) {
        setAlert({
          type: "error",
          text: `❌ ${e?.message || "Error al actualizar estado"}`,
        });
      }
    },
    [goBack, id, loadTicket]
  );

  return (
    <div className="td-page">
      <div className="td-shell">
        <section className="td-main-card">
          <header className="td-hero">
            <div className="td-hero-copy">
              <span className="td-kicker">
                {role === "admin" ? "GESTIÓN DE TICKET" : "SEGUIMIENTO DE TICKET"}
              </span>
              <h1 className="td-hero-title">{ticket?.subject || "Detalle del ticket"}</h1>
              <p className="td-hero-text">
                {role === "admin" ? "Vista administrador" : "Vista usuario"} · ID:{" "}
                <span className="td-ticket-id">{id}</span>
              </p>
            </div>

            <div className="td-hero-actions">
              {ticket?.status ? <span className={statusUI.className}>{statusUI.label}</span> : null}

              <button
                className="td-btn td-btn-secondary"
                type="button"
                onClick={loadTicket}
                disabled={loading || sending}
              >
                <HiOutlineArrowPath />
                <span>{loading ? "Cargando..." : "Refrescar"}</span>
              </button>

              <button
                className="td-btn td-btn-primary"
                type="button"
                onClick={goBack}
                disabled={sending}
              >
                <HiOutlineArrowLeft />
                <span>Volver</span>
              </button>
            </div>
          </header>

          {alert?.text ? (
            <div
              className={`td-alert ${alert.type === "success" ? "is-success" : "is-error"}`}
              role="alert"
            >
              {alert.text}
            </div>
          ) : null}

          {loading ? (
            <LoadingState />
          ) : !ticket ? (
            <div className="td-empty">
              <div className="td-empty-icon" aria-hidden="true">
                <HiOutlineClipboardDocumentList />
              </div>
              <h3 className="td-empty-title">Ticket no encontrado</h3>
              <p className="td-empty-text">
                Puede que ya no exista o no tengas permisos para verlo.
              </p>

              <div className="td-empty-actions">
                <button className="td-btn td-btn-secondary" type="button" onClick={goBack}>
                  Volver
                </button>
                <button className="td-btn td-btn-primary" type="button" onClick={loadTicket}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="td-layout">
              <aside className="td-side" aria-label="Información del ticket">
                <div className="td-card">
                  <div className="td-card-head">
                    <h2 className="td-card-title">Resumen del ticket</h2>
                    <p className="td-card-subtitle">Información general y contexto</p>
                  </div>

                  <div className="td-card-body">
                    <div className="td-info-list">
                      <div className="td-info-row">
                        <div className="td-info-icon">
                          <HiOutlineClock />
                        </div>
                        <div>
                          <div className="td-info-label">Creado</div>
                          <div className="td-info-value">{fmtDate(ticket?.createdAt)}</div>
                        </div>
                      </div>

                      <div className="td-info-row">
                        <div className="td-info-icon">
                          <HiOutlineTag />
                        </div>
                        <div>
                          <div className="td-info-label">Actividad</div>
                          <div className="td-info-value">
                            {ticket?.activity?.titulo || "Sin actividad vinculada"}
                          </div>
                        </div>
                      </div>

                      {role === "admin" && ticket?.user ? (
                        <>
                          <div className="td-info-row">
                            <div className="td-info-icon">
                              <HiOutlineUserCircle />
                            </div>
                            <div>
                              <div className="td-info-label">Usuario</div>
                              <div className="td-info-value">
                                {ticket.user.nombre || ""} {ticket.user.apellido || ""}
                              </div>
                            </div>
                          </div>

                          <div className="td-info-row">
                            <div className="td-info-icon">
                              <HiOutlineEnvelope />
                            </div>
                            <div>
                              <div className="td-info-label">Correo</div>
                              <div className="td-info-value">{ticket.user.email || "—"}</div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>

                    <div className="td-chip-stack">
                      <span className="td-chip td-chip-muted">Mensajes: {messageCount}</span>

                      {ticket?.activity?.titulo ? (
                        <span className="td-chip td-chip-success">Vinculado a actividad</span>
                      ) : (
                        <span className="td-chip td-chip-muted">Sin actividad</span>
                      )}

                      {isCanceled ? (
                        <span className="td-chip td-chip-muted">No admite mensajes</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {role === "admin" ? (
                  <div className="td-card">
                    <div className="td-card-head">
                      <h2 className="td-card-title">Cambiar estado</h2>
                      <p className="td-card-subtitle">Acciones administrativas</p>
                    </div>

                    <div className="td-card-body">
                      <div className="td-segment" role="group" aria-label="Cambiar estado del ticket">
                        <button
                          type="button"
                          className={`td-segment-btn ${ticket.status === "open" ? "is-active" : ""}`}
                          onClick={() => setTicketStatus("open")}
                          disabled={sending}
                        >
                          Abrir
                        </button>

                        <button
                          type="button"
                          className={`td-segment-btn ${ticket.status === "in_progress" ? "is-active" : ""}`}
                          onClick={() => setTicketStatus("in_progress")}
                          disabled={sending}
                        >
                          En proceso
                        </button>

                        <button
                          type="button"
                          className={`td-segment-btn ${ticket.status === "canceled" ? "is-active" : ""}`}
                          onClick={() => setTicketStatus("canceled")}
                          disabled={sending}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="td-segment-btn"
                          onClick={() => setTicketStatus("resolved")}
                          disabled={sending}
                          title="Al marcar como resuelto, el ticket se cierra"
                        >
                          Resuelto
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </aside>

              <main className="td-chat-col" aria-label="Conversación del ticket">
                <div className="td-card td-chat-card">
                  <div className="td-card-head td-chat-head">
                    <div>
                      <h2 className="td-card-title">Historial de mensajes</h2>
                      <p className="td-card-subtitle">
                        Enter para enviar · Shift + Enter para salto de línea
                      </p>
                    </div>

                    <button
                      className="td-btn td-btn-secondary"
                      type="button"
                      onClick={() => scrollToBottom(true)}
                      disabled={sending}
                    >
                      <HiOutlineArrowDownCircle />
                      <span>Ir al final</span>
                    </button>
                  </div>

                  <div className="td-chat-body">
                    <div className="td-chat-box" ref={chatRef} role="log" aria-label="Lista de mensajes">
                      {messageCount === 0 ? (
                        <div className="td-empty td-empty-chat">
                          <div className="td-empty-icon" aria-hidden="true">
                            <HiOutlineChatBubbleLeftRight />
                          </div>
                          <h3 className="td-empty-title">Aún no hay mensajes</h3>
                          <p className="td-empty-text">
                            Escribe el primer mensaje para iniciar el seguimiento.
                          </p>
                        </div>
                      ) : (
                        messages.map((m) => {
                          const mine =
                            (role === "admin" && m.senderRole === "admin") ||
                            (role === "user" && m.senderRole === "user");

                          return (
                            <article
                              key={m._id}
                              className={`td-message ${mine ? "is-mine" : "is-other"}`}
                            >
                              <div className="td-message-top">
                                <span className="td-message-author">
                                  {m.senderRole === "admin" ? "ADMIN" : "USUARIO"}
                                  {m?.sender?.nombre
                                    ? ` · ${m.sender.nombre} ${m.sender.apellido || ""}`
                                    : ""}
                                </span>

                                <span className="td-message-date">{fmtDate(m.createdAt)}</span>
                              </div>

                              {m.text ? <div className="td-message-text">{m.text}</div> : null}

                              <AttachmentLink fileUrl={m.fileUrl} fileName={m.fileName} />
                            </article>
                          );
                        })
                      )}
                    </div>

                    <form
                      className={`td-composer ${isCanceled ? "is-disabled" : ""}`}
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (canSend) onSend();
                      }}
                    >
                      <textarea
                        className="td-textarea"
                        rows={4}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={sending || isCanceled}
                        placeholder={
                          isCanceled
                            ? "Este ticket está cancelado."
                            : "Escribe tu mensaje aquí..."
                        }
                      />

                      {file ? (
                        <div className="td-file-selected">
                          <span className="td-chip td-chip-success">Adjunto</span>
                          <span className="td-chip td-chip-muted">
                            {file.name} · {formatBytes(file.size)}
                          </span>
                        </div>
                      ) : null}

                      <div className="td-composer-actions">
                        <input
                          ref={fileRef}
                          type="file"
                          className="td-hidden-input"
                          onChange={onPickFile}
                          disabled={sending || isCanceled}
                        />

                        <button
                          className="td-btn td-btn-secondary"
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={sending || isCanceled}
                        >
                          <HiOutlinePaperClip />
                          <span>Adjuntar archivo</span>
                        </button>

                        {file ? (
                          <button
                            className="td-btn td-btn-secondary"
                            type="button"
                            onClick={removeFile}
                            disabled={sending || isCanceled}
                          >
                            <HiOutlineXMark />
                            <span>Quitar archivo</span>
                          </button>
                        ) : null}

                        <button
                          className="td-btn td-btn-primary"
                          type="submit"
                          disabled={!canSend}
                        >
                          <HiOutlinePaperAirplane />
                          <span>{sending ? "Enviando..." : "Enviar mensaje"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </main>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}