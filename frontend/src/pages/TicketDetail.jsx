import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getTicketById, sendTicketMessage, updateTicketStatus } from "../services/ticketService";
import { getRole } from "../services/authSession";

import "../styles/ticketdetail.css";

const STATUS = {
  open: { label: "ABIERTO", pill: "dash-pill dash-pill-muted" },
  in_progress: { label: "EN PROCESO", pill: "dash-pill dash-pill-warn" },
  resolved: { label: "RESUELTO", pill: "dash-pill dash-pill-ok" },
  canceled: { label: "CANCELADO", pill: "dash-pill dash-pill-muted" },
};

function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function SkeletonTicket() {
  return (
    <div className="dash-skel" aria-label="Cargando ticket">
      <div className="dash-skel-row">
        <div className="dash-skel-bar w40" />
        <div className="dash-skel-bar w22" />
      </div>
      <div className="dash-skel-card tall" />
    </div>
  );
}

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = getRole(); // "user" | "admin"

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
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);

      const res = await getTicketById(id);
      setTicket(res?.ticket || null);
    } catch (e) {
      setTicket(null);
      setAlert({ type: "danger", text: e?.message || "Error al cargar ticket" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading, ticket?.messages?.length, scrollToBottom]);

  const statusUI = useMemo(() => STATUS[ticket?.status] || STATUS.open, [ticket?.status]);
  const isCanceled = ticket?.status === "canceled";
  const messageCount = (ticket?.messages || []).length;

  const canSend = useMemo(() => {
    return !sending && !isCanceled && (text.trim().length > 0 || !!file);
  }, [sending, isCanceled, text, file]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) send();
    }
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const removeFile = () => {
    setFile(null);
    clearFileInput();
  };

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

      const res = await sendTicketMessage(id, { text: clean, file });

      setAlert({ type: "success", text: `✅ ${res?.message || "Mensaje enviado"}` });

      setText("");
      setFile(null);
      clearFileInput();

      await load();
      setTimeout(() => scrollToBottom(true), 80);
    } catch (e) {
      setAlert({ type: "danger", text: `❌ ${e?.message || "Error al enviar mensaje"}` });
    } finally {
      setSending(false);
    }
  }, [text, file, id, isCanceled, load, clearFileInput, scrollToBottom]);

  const setTicketStatus = useCallback(
    async (s) => {
      try {
        setAlert(null);
        const res = await updateTicketStatus(id, s);

        if (s === "resolved") {
          setAlert({ type: "success", text: `✅ ${res?.message || "Ticket resuelto"}` });
          setTimeout(goBack, 650);
          return;
        }

        setAlert({ type: "success", text: `✅ ${res?.message || "Estado actualizado"}` });
        await load();
      } catch (e) {
        setAlert({ type: "danger", text: `❌ ${e?.message || "Error al actualizar estado"}` });
      }
    },
    [id, load, goBack]
  );

  const renderAttachment = (m) => {
    if (!m?.fileUrl) return null;
    const name = m.fileName || "Archivo adjunto";
    return (
      <a className="tkt-attach" href={m.fileUrl} target="_blank" rel="noreferrer" title="Abrir archivo">
        📎 {name}
      </a>
    );
  };

  return (
    <div className="dash-page">
      <div className="dash-shell dash-shell--single">
        <main className="dash-main" aria-label="Ticket detalle">
          <section className="dash-card dash-card--desktop">
            {/* Top header */}
            <div className="dash-top">
              <div>
                <h2 className="dash-title">Ticket</h2>
                <p className="dash-subtitle">
                  {role === "admin" ? "Vista administrador" : "Vista usuario"} ·{" "}
                  <span className="tkt-id">ID: {id}</span>
                </p>
              </div>

              <div className="dash-top-actions">
                {ticket?.status ? <span className={statusUI.pill}>{statusUI.label}</span> : null}

                <button className="dash-btn dash-btn-ghost" type="button" onClick={load} disabled={loading || sending}>
                  {loading ? "Cargando..." : "Refrescar"}
                </button>

                <button className="dash-btn dash-btn-primary" type="button" onClick={goBack} disabled={sending}>
                  Volver
                </button>
              </div>
            </div>

            {alert?.text ? (
              <div className={`dash-alert ${alert.type === "success" ? "is-success" : "is-danger"}`} role="alert">
                {alert.text}
              </div>
            ) : null}

            {loading ? (
              <SkeletonTicket />
            ) : !ticket ? (
              <div className="dash-empty" role="status" aria-live="polite">
                <div className="dash-empty-icon" aria-hidden="true">🧾</div>
                <h3 className="dash-empty-title">Ticket no encontrado</h3>
                <p className="dash-empty-text">Puede que ya haya sido eliminado o no tengas acceso.</p>
                <div className="dash-empty-actions">
                  <button className="dash-btn dash-btn-ghost" type="button" onClick={goBack}>
                    Volver
                  </button>
                  <button className="dash-btn dash-btn-primary" type="button" onClick={load}>
                    Reintentar
                  </button>
                </div>
              </div>
            ) : (
              <div className="tkt-layout">
                {/* LEFT: sidebar meta */}
                <aside className="tkt-side" aria-label="Información del ticket">
                  <section className="dash-panel">
                    <div className="dash-panel-head">
                      <div>
                        <div className="dash-panel-title">{ticket?.subject || "Sin asunto"}</div>
                        <div className="dash-panel-sub">
                          Creado: <strong>{fmtDate(ticket?.createdAt)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="dash-panel-body">
                      <div className="tkt-kv">
                        <div className="tkt-kv-row">
                          <span className="tkt-k">Actividad</span>
                          <span className="tkt-v">{ticket?.activity?.titulo || "—"}</span>
                        </div>

                        {role === "admin" && ticket?.user ? (
                          <>
                            <div className="tkt-kv-row">
                              <span className="tkt-k">Usuario</span>
                              <span className="tkt-v">
                                {ticket.user.nombre || ""} {ticket.user.apellido || ""}
                              </span>
                            </div>
                            <div className="tkt-kv-row">
                              <span className="tkt-k">Correo</span>
                              <span className="tkt-v">{ticket.user.email || "—"}</span>
                            </div>
                          </>
                        ) : null}
                      </div>

                      <div className="tkt-stats tkt-stats--stack">
                        <span className="dash-pill dash-pill-muted">Mensajes: {messageCount}</span>
                        {ticket?.activity?.titulo ? (
                          <span className="dash-pill dash-pill-ok">Vinculado a actividad</span>
                        ) : (
                          <span className="dash-pill dash-pill-muted">Sin actividad</span>
                        )}
                        {isCanceled ? <span className="dash-pill dash-pill-muted">No admite mensajes</span> : null}
                      </div>

                      {role === "admin" ? (
                        <div className="tkt-admin">
                          <div className="tkt-admin-title">Estado</div>
                          <div className="dash-segment" role="group" aria-label="Estado del ticket">
                            <button
                              type="button"
                              className={`dash-segment-btn ${ticket.status === "open" ? "is-active" : ""}`}
                              onClick={() => setTicketStatus("open")}
                              disabled={sending}
                            >
                              Abrir
                            </button>
                            <button
                              type="button"
                              className={`dash-segment-btn ${ticket.status === "in_progress" ? "is-active" : ""}`}
                              onClick={() => setTicketStatus("in_progress")}
                              disabled={sending}
                            >
                              En proceso
                            </button>
                            <button
                              type="button"
                              className={`dash-segment-btn ${ticket.status === "canceled" ? "is-active" : ""}`}
                              onClick={() => setTicketStatus("canceled")}
                              disabled={sending}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="dash-segment-btn"
                              onClick={() => setTicketStatus("resolved")}
                              disabled={sending}
                              title="Al marcar como resuelto, el ticket se elimina"
                            >
                              Resuelto
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </aside>

                {/* RIGHT: chat */}
                <section className="tkt-main" aria-label="Conversación">
                  <section className="dash-panel tkt-chatpanel">
                    <div className="dash-panel-head">
                      <div>
                        <div className="dash-panel-title">Historial</div>
                        <div className="dash-panel-sub">Enter para enviar · Shift+Enter para salto</div>
                      </div>

                      <button
                        className="dash-btn dash-btn-ghost"
                        type="button"
                        onClick={() => scrollToBottom(true)}
                        disabled={sending}
                      >
                        Ir al final
                      </button>
                    </div>

                    <div className="dash-panel-body tkt-chatpanel-body">
                      <div className="tkt-chat" ref={chatRef} role="log" aria-label="Mensajes">
                        {messageCount === 0 ? (
                          <div className="dash-empty" role="status" aria-live="polite">
                            <div className="dash-empty-icon" aria-hidden="true">💬</div>
                            <h3 className="dash-empty-title">Aún no hay mensajes</h3>
                            <p className="dash-empty-text">Escribe el primer mensaje para iniciar el seguimiento.</p>
                          </div>
                        ) : (
                          (ticket.messages || []).map((m) => {
                            const mine =
                              (role === "admin" && m.senderRole === "admin") ||
                              (role === "user" && m.senderRole === "user");

                            return (
                              <div key={m._id} className={`tkt-msg ${mine ? "is-mine" : "is-theirs"}`}>
                                <div className="tkt-msg-top">
                                  <span className="tkt-msg-who">
                                    {m.senderRole === "admin" ? "ADMIN" : "USER"}
                                    {m?.sender?.nombre ? ` · ${m.sender.nombre} ${m.sender.apellido || ""}` : ""}
                                  </span>
                                  <span className="tkt-msg-date">{fmtDate(m.createdAt)}</span>
                                </div>

                                {m.text ? <div className="tkt-msg-text">{m.text}</div> : null}
                                {renderAttachment(m)}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Composer (pegado abajo) */}
                      <form
                        className={`tkt-composer ${isCanceled ? "is-disabled" : ""}`}
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (canSend) send();
                        }}
                      >
                        <textarea
                          className="dash-textarea tkt-textarea"
                          rows={3}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder={isCanceled ? "Este ticket está cancelado." : "Escribe un mensaje…"}
                          onKeyDown={onKeyDown}
                          disabled={sending || isCanceled}
                        />

                        <div className="tkt-actions">
                          <input
                            ref={fileRef}
                            type="file"
                            className="tkt-file-hidden"
                            onChange={onPickFile}
                            disabled={sending || isCanceled}
                          />

                          <button
                            className="dash-btn dash-btn-ghost"
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={sending || isCanceled}
                          >
                            Adjuntar
                          </button>

                          {file ? (
                            <button
                              className="dash-btn dash-btn-ghost"
                              type="button"
                              onClick={removeFile}
                              disabled={sending || isCanceled}
                            >
                              Quitar
                            </button>
                          ) : null}

                          <button className="dash-btn dash-btn-primary" type="submit" disabled={!canSend}>
                            {sending ? "Enviando..." : "Enviar"}
                          </button>
                        </div>

                        {file ? (
                          <div className="tkt-file-meta">
                            <span className="dash-pill dash-pill-ok">Adjunto</span>
                            <span className="dash-pill dash-pill-muted">
                              {file.name} · {formatBytes(file.size)}
                            </span>
                          </div>
                        ) : null}
                      </form>
                    </div>
                  </section>
                </section>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}