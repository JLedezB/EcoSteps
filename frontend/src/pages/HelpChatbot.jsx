// HelpChatbot.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

import LogoutButton from "../components/LogoutButton";

const BOT_NAME = "EcoBot";
const NAV_TICKETS = "__NAV_TICKETS__";

const ROUTES = {
  home: "/user",
  report: "/user/report",
  tickets: "/user/tickets",
  help: "/user/help",
};

const FLOW = {
  start: {
    title: "Menu",
    text: "Hola. Soy EcoBot.\n\nEn que te puedo ayudar hoy?\nElige una opcion:",
    options: [
      { label: "Empezar / Que es EcoSteps?", next: "about", group: "General" },
      { label: "Inscribirme a una actividad", next: "join_activity", group: "Actividades" },
      { label: "Subir evidencia", next: "upload_evidence", group: "Evidencias" },
      { label: "Subir reporte bimestral", next: "upload_report", group: "Reportes" },
      { label: "Tickets / soporte", next: "tickets_help", group: "Soporte" },
    ],
  },

  about: {
    title: "General",
    text:
      "EcoSteps es una plataforma para gestionar Servicio Social.\n\n" +
      "Incluye:\n" +
      "• Actividades (inscripcion y cupos)\n" +
      "• Evidencias (subida y revision)\n" +
      "• Reportes bimestrales (subida y aprobacion)\n" +
      "• Tickets (soporte y seguimiento)",
    options: [
      { label: "Menu principal", next: "start", group: "Navegacion" },
      { label: "Ir a Tickets", next: "cta_ticket", group: "Accion" },
    ],
  },

  join_activity: {
    title: "Actividades",
    text:
      "Para inscribirte:\n" +
      "1) Entra a tu Dashboard.\n" +
      "2) En la pestana 'Todas', busca la actividad.\n" +
      "3) Presiona 'Inscribirme'.\n\n" +
      "Tip: si no te deja, puede ser por cupo o porque ya estas inscrito.",
    options: [
      { label: "No hay cupo", next: "join_no_cupo", group: "Problemas comunes" },
      { label: "No puedo inscribirme", next: "join_cant", group: "Problemas comunes" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  join_no_cupo: {
    title: "Actividades",
    text:
      "Si el cupo disponible esta en 0, el sistema bloquea la inscripcion.\n\n" +
      "Recomendacion:\n" +
      "• Revisar otra actividad\n" +
      "• Esperar a que se libere un cupo",
    options: [
      { label: "Crear ticket por cupo", next: "cta_ticket", group: "Accion" },
      { label: "Volver a Actividades", next: "join_activity", group: "Navegacion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  join_cant: {
    title: "Actividades",
    text:
      "Si no te deja inscribirte, normalmente es por:\n" +
      "• Cupo en 0\n" +
      "• Ya estas inscrito\n" +
      "• Actividad cerrada\n\n" +
      "Si quieres, crea un ticket y lo revisa el admin.",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  upload_evidence: {
    title: "Evidencias",
    text:
      "Para subir evidencia:\n" +
      "1) En Dashboard cambia a 'Mis actividades'.\n" +
      "2) Busca la actividad.\n" +
      "3) Presiona 'Subir evidencia'.\n\n" +
      "Nota: si ya esta aprobada, el boton se deshabilita (actividad completada).",
    options: [
      { label: "Mi evidencia fue rechazada", next: "evidence_rejected", group: "Problemas comunes" },
      { label: "No aparece el boton", next: "evidence_missing_btn", group: "Problemas comunes" },
      { label: "Donde veo el estado?", next: "evidence_status", group: "Guia" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  evidence_status: {
    title: "Evidencias",
    text:
      "Para ver el estado:\n" +
      "1) Entra a 'Mis actividades'.\n" +
      "2) Revisa la seccion de evidencias por actividad.\n" +
      "3) Veras el estado (pendiente / aprobada / rechazada).",
    options: [
      { label: "Volver a Evidencias", next: "upload_evidence", group: "Navegacion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  evidence_rejected: {
    title: "Evidencias",
    text:
      "Si fue rechazada:\n" +
      "• Revisa el comentario del admin (si tu UI lo muestra)\n" +
      "• Vuelve a subir una evidencia mas clara\n" +
      "• Asegurate de que se vea la actividad / evidencia correcta",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Accion" },
      { label: "Volver a Evidencias", next: "upload_evidence", group: "Navegacion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  evidence_missing_btn: {
    title: "Evidencias",
    text:
      "Si no ves el boton, normalmente es porque:\n" +
      "• No estas en 'Mis actividades'\n" +
      "• No estas inscrito en la actividad\n" +
      "• La evidencia ya fue aprobada",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  upload_report: {
    title: "Reportes",
    text:
      "Para subir tu reporte bimestral:\n" +
      "1) En Dashboard presiona 'Subir reporte'.\n" +
      "2) Adjunta el archivo.\n" +
      "3) Envia.\n\n" +
      "Cuando el admin lo apruebe, se te suma progreso.",
    options: [
      { label: "No me deja subir", next: "report_issue", group: "Problemas comunes" },
      { label: "Donde veo si lo aprobaron?", next: "report_status", group: "Guia" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  report_status: {
    title: "Reportes",
    text:
      "Para ver si aprobaron tu reporte:\n" +
      "• En el Dashboard revisa tu progreso y/o el contador de reportes aprobados.\n" +
      "• Si no sube, el reporte sigue pendiente o fue rechazado.",
    options: [
      { label: "Volver a Reportes", next: "upload_report", group: "Navegacion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  report_issue: {
    title: "Reportes",
    text:
      "Si falla la subida del reporte:\n" +
      "• Verifica el tipo de archivo permitido\n" +
      "• Revisa tu conexion\n" +
      "• Intenta con un archivo mas ligero\n\n" +
      "Si persiste, crea ticket y adjunta captura.",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  tickets_help: {
    title: "Tickets / soporte",
    text:
      "Los tickets sirven para soporte (incidencias).\n\n" +
      "Puedes:\n" +
      "• Crear un ticket\n" +
      "• Ver tus tickets\n" +
      "• Chatear dentro del ticket (con adjunto opcional)\n\n" +
      "Tip: cuando el admin responde, el ticket pasa a 'En proceso'.",
    options: [
      { label: "Como creo un ticket?", next: "tickets_create", group: "Guia" },
      { label: "Como adjunto un archivo?", next: "tickets_attach", group: "Guia" },
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  tickets_create: {
    title: "Tickets / soporte",
    text:
      "Para crear un ticket:\n" +
      "1) Entra a 'Mis Tickets'.\n" +
      "2) Escribe asunto y descripcion.\n" +
      "3) (Opcional) Vinculalo a una actividad.\n" +
      "4) Crear.\n\n" +
      "Despues puedes entrar al detalle y chatear.",
    options: [
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  tickets_attach: {
    title: "Tickets / soporte",
    text:
      "Para adjuntar un archivo:\n" +
      "1) Entra al detalle del ticket.\n" +
      "2) Escribe tu mensaje.\n" +
      "3) Selecciona archivo (imagen/pdf/docx)\n" +
      "4) Enviar.",
    options: [
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },

  cta_ticket: {
    title: "Accion",
    text:
      "Te envio a 'Mis Tickets' para que lo reportes.\n\n" +
      "Sugerencia: adjunta captura para resolverlo mas rapido.",
    options: [
      { label: "Ir a Mis Tickets", next: NAV_TICKETS, group: "Accion" },
      { label: "Menu principal", next: "start", group: "Navegacion" },
    ],
  },
};

const nowTime = () =>
  new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date());

function makeMsg(role, text) {
  return {
    id:
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    role,
    text,
    ts: nowTime(),
  };
}

function groupOptions(options) {
  const map = new Map();
  for (const opt of options) {
    const key = opt.group || "Opciones";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(opt);
  }
  return Array.from(map.entries());
}

function Breadcrumb({ items }) {
  return (
    <div className="eco-breadcrumb">
      {items.map((t, idx) => (
        <span key={`${t}_${idx}`} className="eco-breadcrumb-item">
          {t}
          {idx < items.length - 1 ? <span className="eco-breadcrumb-sep">›</span> : null}
        </span>
      ))}
    </div>
  );
}

function ChatBubble({ botName, msg }) {
  const mine = msg.role === "user";
  return (
    <div className={`eco-msg ${mine ? "is-mine" : "is-theirs"}`}>
      <div className="eco-msg-meta">
        <span className="eco-msg-who">{mine ? "Tu" : botName}</span>
        <span>{msg.ts}</span>
      </div>
      <div className="eco-msg-text">{msg.text}</div>
    </div>
  );
}

function OptionsPanel({ options, query, setQuery, onChoose, onGoTickets, onReset }) {
  const grouped = useMemo(() => groupOptions(options), [options]);
  const [openGroup, setOpenGroup] = useState(() => grouped[0]?.[0] ?? "");

  useEffect(() => {
    setOpenGroup(grouped[0]?.[0] ?? "");
  }, [grouped]);

  const filteredGrouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return grouped;
    const out = [];
    for (const [g, opts] of grouped) {
      const filtered = opts.filter((o) => o.label.toLowerCase().includes(q));
      if (filtered.length) out.push([g, filtered]);
    }
    return out;
  }, [grouped, query]);

  const toggle = (g) => setOpenGroup((cur) => (cur === g ? "" : g));

  return (
    <div className="eco-sidepanel">
      <div className="eco-sidepanel-head">
        <div>
          <div className="eco-sidepanel-title">Opciones</div>
          <div className="text-muted small">Elige un tema para continuar</div>
        </div>

        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={onReset}>
            Reiniciar
          </button>
          <button className="btn btn-success btn-sm" type="button" onClick={onGoTickets}>
            Ir a Tickets
          </button>
        </div>
      </div>

      <div className="eco-search eco-search-compact">
        <input
          className="eco-input eco-search-input eco-search-input-compact"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setQuery("")} type="button">
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="eco-sidepanel-body">
        {filteredGrouped.length === 0 ? (
          <div className="eco-empty eco-empty-compact">No hay resultados para "{query}".</div>
        ) : (
          filteredGrouped.map(([groupName, opts]) => {
            const isOpen = openGroup === groupName;

            return (
              <div key={groupName} className="eco-acc">
                <button
                  type="button"
                  className={`eco-acc-head ${isOpen ? "is-open" : ""}`}
                  onClick={() => toggle(groupName)}
                  aria-expanded={isOpen}
                >
                  <span className="eco-acc-title">{groupName}</span>
                  <span className="eco-acc-icon">{isOpen ? "–" : "+"}</span>
                </button>

                {isOpen ? (
                  <div className="eco-acc-body">
                    <div className="eco-options-grid eco-options-grid-compact">
                      {opts.map((opt) => (
                        <button
                          key={opt.label}
                          className="eco-option-chip"
                          type="button"
                          onClick={() => onChoose(opt)}
                          title={opt.label}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="eco-sidepanel-foot text-muted small">
        Sugerencia: escribe una palabra clave para encontrar mas rapido.
      </div>
    </div>
  );
}

export default function HelpChatbot() {
  const navigate = useNavigate();
  const endRef = useRef(null);

  const [nodeId, setNodeId] = useState("start");
  const node = FLOW[nodeId];

  const [messages, setMessages] = useState(() => [makeMsg("bot", FLOW.start.text)]);
  const [query, setQuery] = useState("");

  const options = useMemo(() => node?.options || [], [node]);
  const breadcrumb = useMemo(() => ["Ayuda", node?.title || "Ayuda"], [node?.title]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const reset = useCallback(() => {
    setNodeId("start");
    setQuery("");
    setMessages([makeMsg("bot", FLOW.start.text)]);
  }, []);

  const goHome = useCallback(() => navigate(ROUTES.home), [navigate]);
  const goTickets = useCallback(() => navigate(ROUTES.tickets), [navigate]);

  const choose = useCallback(
    (opt) => {
      setQuery("");

      setMessages((prev) => {
        const nextMsgs = [...prev, makeMsg("user", opt.label)];

        if (opt.next === NAV_TICKETS) {
          nextMsgs.push(makeMsg("bot", "Abriendo Mis Tickets..."));
          setTimeout(() => goTickets(), 200);
          return nextMsgs;
        }

        const nextId = opt.next;
        const nextNode = FLOW[nextId];

        setTimeout(() => setNodeId(nextId), 0);
        if (nextNode?.text) nextMsgs.push(makeMsg("bot", nextNode.text));
        return nextMsgs;
      });
    },
    [goTickets]
  );

  return (
    <div className="dashboard-container">
      <div className="eco-shell">
        <aside className="eco-sidebar" aria-label="Navegación">
          <div className="eco-sidebar-head">
            <span aria-hidden="true">🌿</span>
            <div className="eco-sidebar-brand">EcoSteps SGSS</div>
          </div>

          <nav className="eco-sidebar-nav">
            <button type="button" className="eco-nav-item" onClick={goHome}>
              <span aria-hidden="true">▦</span> Dashboard
            </button>

            <button type="button" className="eco-nav-item" onClick={() => navigate(ROUTES.report)}>
              <span aria-hidden="true">⬆</span> Subir reporte
            </button>

            <button type="button" className="eco-nav-item" onClick={goTickets}>
              <span aria-hidden="true">🎫</span> Tickets
            </button>

            <button type="button" className="eco-nav-item is-active" onClick={() => navigate(ROUTES.help)}>
              <span aria-hidden="true">🤖</span> EcoBot
            </button>
          </nav>

          <div className="eco-sidebar-foot">
            <div className="eco-level-card">
              <div className="eco-level-label">Ayuda</div>
              <div className="eco-level-name">Guía del sistema</div>
              <div className="eco-level-sub">Respuestas rápidas por módulos</div>
            </div>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <main className="eco-main" aria-label="Contenido principal">
          <div className="eco-main-card">
            <div className="eco-topbar">
              <div>
                <h2 className="eco-greet-title mb-0">{BOT_NAME}</h2>
                <p className="eco-greet-sub mb-1">Guía rápida del sistema (menú por opciones)</p>
                <Breadcrumb items={breadcrumb} />
              </div>

              <div className="eco-topbar-right">
                <button className="btn btn-eco-ghost btn-sm" type="button" onClick={reset}>
                  Reiniciar
                </button>
                <button className="btn btn-outline-success btn-sm" type="button" onClick={goTickets}>
                  Tickets
                </button>
              </div>
            </div>

            <div className="eco-help-layout">
              <div className="eco-help-chat">
                <div className="eco-chat-wrap">
                  <div className="eco-chat-head">
                    <div>
                      <div className="fw-bold">Chat de ayuda</div>
                      <div className="text-muted small">Selecciona una opción para continuar</div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goHome}>
                        Volver al Dashboard
                      </button>
                    </div>
                  </div>

                  <div className="eco-chat eco-chat-fixed" aria-label="Chat EcoBot">
                    {messages.map((m) => (
                      <ChatBubble key={m.id} botName={BOT_NAME} msg={m} />
                    ))}
                    <div ref={endRef} />
                  </div>
                </div>
              </div>

              <div className="eco-help-side">
                <OptionsPanel
                  options={options}
                  query={query}
                  setQuery={setQuery}
                  onChoose={choose}
                  onGoTickets={goTickets}
                  onReset={reset}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
