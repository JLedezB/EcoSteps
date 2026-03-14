import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowRight,
  HiOutlineHome,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";

import LogoutButton from "../components/LogoutButton";
import { AuthContext } from "../context/AuthContext";
import { askEcoBot, createTicketFromEcoBot } from "../services/ecobotService";

import "../styles/helpchatbot.css";

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
    title: "Menú",
    text: "Hola. Soy EcoBot.\n\n¿En qué te puedo ayudar hoy?\nElige una opción o escríbeme una pregunta:",
    options: [
      { label: "Empezar / ¿Qué es EcoSteps?", next: "about", group: "General" },
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
      "• Actividades (inscripción y cupos)\n" +
      "• Evidencias (subida y revisión)\n" +
      "• Reportes bimestrales (subida y aprobación)\n" +
      "• Tickets (soporte y seguimiento)",
    options: [
      { label: "Menú principal", next: "start", group: "Navegación" },
      { label: "Ir a Tickets", next: "cta_ticket", group: "Acción" },
    ],
  },

  join_activity: {
    title: "Actividades",
    text:
      "Para inscribirte:\n" +
      "1) Entra a tu Dashboard.\n" +
      "2) En la pestaña 'Todas', busca la actividad.\n" +
      "3) Presiona 'Inscribirme'.\n\n" +
      "Tip: si no te deja, puede ser por cupo o porque ya estás inscrito.",
    options: [
      { label: "No hay cupo", next: "join_no_cupo", group: "Problemas comunes" },
      { label: "No puedo inscribirme", next: "join_cant", group: "Problemas comunes" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  join_no_cupo: {
    title: "Actividades",
    text:
      "Si el cupo disponible está en 0, el sistema bloquea la inscripción.\n\n" +
      "Recomendación:\n" +
      "• Revisar otra actividad\n" +
      "• Esperar a que se libere un cupo",
    options: [
      { label: "Crear ticket por cupo", next: "cta_ticket", group: "Acción" },
      { label: "Volver a Actividades", next: "join_activity", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  join_cant: {
    title: "Actividades",
    text:
      "Si no te deja inscribirte, normalmente es por:\n" +
      "• Cupo en 0\n" +
      "• Ya estás inscrito\n" +
      "• Actividad cerrada\n\n" +
      "Si quieres, crea un ticket y lo revisa el admin.",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  upload_evidence: {
    title: "Evidencias",
    text:
      "Para subir evidencia:\n" +
      "1) En Dashboard cambia a 'Mis actividades'.\n" +
      "2) Busca la actividad.\n" +
      "3) Presiona 'Subir evidencia'.\n\n" +
      "Nota: si ya está aprobada, el botón se deshabilita (actividad completada).",
    options: [
      { label: "Mi evidencia fue rechazada", next: "evidence_rejected", group: "Problemas comunes" },
      { label: "No aparece el botón", next: "evidence_missing_btn", group: "Problemas comunes" },
      { label: "¿Dónde veo el estado?", next: "evidence_status", group: "Guía" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  evidence_status: {
    title: "Evidencias",
    text:
      "Para ver el estado:\n" +
      "1) Entra a 'Mis actividades'.\n" +
      "2) Revisa la sección de evidencias por actividad.\n" +
      "3) Verás el estado (pendiente / aprobada / rechazada).",
    options: [
      { label: "Volver a Evidencias", next: "upload_evidence", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  evidence_rejected: {
    title: "Evidencias",
    text:
      "Si fue rechazada:\n" +
      "• Revisa el comentario del admin (si tu UI lo muestra)\n" +
      "• Vuelve a subir una evidencia más clara\n" +
      "• Asegúrate de que se vea la actividad/evidencia correcta",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Volver a Evidencias", next: "upload_evidence", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  evidence_missing_btn: {
    title: "Evidencias",
    text:
      "Si no ves el botón, normalmente es porque:\n" +
      "• No estás en 'Mis actividades'\n" +
      "• No estás inscrito en la actividad\n" +
      "• La evidencia ya fue aprobada",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  upload_report: {
    title: "Reportes",
    text:
      "Para subir tu reporte bimestral:\n" +
      "1) En Dashboard presiona 'Subir reporte'.\n" +
      "2) Adjunta el archivo.\n" +
      "3) Envía.\n\n" +
      "Cuando el admin lo apruebe, se te suma progreso.",
    options: [
      { label: "No me deja subir", next: "report_issue", group: "Problemas comunes" },
      { label: "¿Dónde veo si lo aprobaron?", next: "report_status", group: "Guía" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  report_status: {
    title: "Reportes",
    text:
      "Para ver si aprobaron tu reporte:\n" +
      "• En el Dashboard revisa tu progreso y/o el contador de reportes aprobados.\n" +
      "• Si no sube, el reporte sigue pendiente o fue rechazado.",
    options: [
      { label: "Volver a Reportes", next: "upload_report", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  report_issue: {
    title: "Reportes",
    text:
      "Si falla la subida del reporte:\n" +
      "• Verifica el tipo de archivo permitido\n" +
      "• Revisa tu conexión\n" +
      "• Intenta con un archivo más ligero\n\n" +
      "Si persiste, crea ticket y adjunta captura.",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
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
      { label: "¿Cómo creo un ticket?", next: "tickets_create", group: "Guía" },
      { label: "¿Cómo adjunto un archivo?", next: "tickets_attach", group: "Guía" },
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  tickets_create: {
    title: "Tickets / soporte",
    text:
      "Para crear un ticket:\n" +
      "1) Entra a 'Mis Tickets'.\n" +
      "2) Escribe asunto y descripción.\n" +
      "3) (Opcional) Vincúlalo a una actividad.\n" +
      "4) Crear.\n\n" +
      "Después puedes entrar al detalle y chatear.",
    options: [
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
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
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  cta_ticket: {
    title: "Acción",
    text:
      "Te envío a 'Mis Tickets' para que lo reportes.\n\n" +
      "Sugerencia: adjunta captura para resolverlo más rápido.",
    options: [
      { label: "Ir a Mis Tickets", next: NAV_TICKETS, group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
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

function ChatBubble({ botName, msg }) {
  const mine = msg.role === "user";

  return (
    <div className={`ecb-msg ${mine ? "is-mine" : "is-bot"}`}>
      <div className="ecb-msg-meta">
        <span className="ecb-msg-who">{mine ? "Tú" : botName}</span>
        <span className="ecb-msg-time">{msg.ts}</span>
      </div>
      <div className="ecb-msg-text">{msg.text}</div>
    </div>
  );
}

function Sidebar({ displayName, roleSubtitle, goHome, goReport, goTickets, goHelp }) {
  const initial = (displayName || "U").charAt(0).toUpperCase();

  return (
    <aside className="ecb-sidebar" aria-label="Navegación principal">
      <div className="ecb-sidebar-top">
        <button type="button" className="ecb-brand" onClick={goHome} aria-label="Ir al dashboard">
          <span className="ecb-brand-icon" aria-hidden="true">
            <FaLeaf />
          </span>

          <span className="ecb-brand-copy">
            <span className="ecb-brand-title">EcoSteps</span>
            <span className="ecb-brand-subtitle">SGSS • Panel estudiante</span>
          </span>
        </button>
      </div>

      <nav className="ecb-nav" aria-label="Menú lateral">
        <button type="button" className="ecb-nav-item" onClick={goHome}>
          <HiOutlineChartBar className="ecb-nav-ico" />
          <span>Dashboard</span>
        </button>

        <button type="button" className="ecb-nav-item" onClick={goReport}>
          <HiOutlineDocumentText className="ecb-nav-ico" />
          <span>Subir reporte</span>
        </button>

        <button type="button" className="ecb-nav-item" onClick={goTickets}>
          <HiOutlineTicket className="ecb-nav-ico" />
          <span>Tickets</span>
        </button>

        <button type="button" className="ecb-nav-item is-active" onClick={goHelp}>
          <HiOutlineSparkles className="ecb-nav-ico" />
          <span>EcoBot</span>
        </button>
      </nav>

      <div className="ecb-sidebar-bottom">
        <div className="ecb-usercard">
          <div className="ecb-usercard-top">
            <div className="ecb-user-avatar" aria-hidden="true">
              {initial}
            </div>

            <div className="ecb-user-meta">
              <div className="ecb-user-label">Sesión activa</div>
              <div className="ecb-user-name">{displayName}</div>
              <div className="ecb-user-role">{roleSubtitle}</div>
            </div>
          </div>

          <div className="ecb-user-actions">
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
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

  const flatVisible = useMemo(() => {
    const out = [];
    for (const [g, opts] of filteredGrouped) {
      if (openGroup && g !== openGroup) continue;
      out.push(...opts);
    }
    return out.slice(0, 10);
  }, [filteredGrouped, openGroup]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "Escape") {
        if (query) setQuery("");
        return;
      }

      if (e.key === "Enter") {
        const first = flatVisible[0];
        if (first) onChoose(first);
        return;
      }

      if (!/^[0-9]$/.test(e.key)) return;
      const num = e.key === "0" ? 10 : Number(e.key);
      const pick = flatVisible[num - 1];
      if (pick) onChoose(pick);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatVisible, onChoose, query, setQuery]);

  const toggle = (g) => setOpenGroup((cur) => (cur === g ? "" : g));

  return (
    <div className="ecb-card ecb-options-card">
      <div className="ecb-card-head">
        <div>
          <h3 className="ecb-card-title">Opciones</h3>
          <p className="ecb-card-subtitle">Elige un tema para continuar</p>
        </div>

        <div className="ecb-inline-actions">
          <button className="ecb-btn ecb-btn-secondary ecb-btn-sm" type="button" onClick={onReset}>
            <HiOutlineArrowPath />
            <span>Reiniciar</span>
          </button>

          <button className="ecb-btn ecb-btn-primary ecb-btn-sm" type="button" onClick={onGoTickets}>
            <HiOutlineTicket />
            <span>Ir a Tickets</span>
          </button>
        </div>
      </div>

      <div className="ecb-search">
        <div className="ecb-search-wrap">
          <span className="ecb-search-ico" aria-hidden="true">
            <HiOutlineMagnifyingGlass />
          </span>

          <input
            className="ecb-search-input"
            placeholder="Buscar (ej. evidencia, reporte, ticket)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ecb-card-body ecb-options-body">
        {filteredGrouped.length === 0 ? (
          <div className="ecb-empty-mini">
            <div className="ecb-empty-mini-title">Sin resultados</div>
            <p className="ecb-empty-mini-text">No hay opciones para “{query}”.</p>
          </div>
        ) : (
          filteredGrouped.map(([groupName, opts]) => {
            const isOpen = openGroup === groupName;

            return (
              <div key={groupName} className="ecb-acc">
                <button
                  type="button"
                  className={`ecb-acc-head ${isOpen ? "is-open" : ""}`}
                  onClick={() => toggle(groupName)}
                  aria-expanded={isOpen}
                >
                  <span className="ecb-acc-title">{groupName}</span>
                  <span className="ecb-acc-icon">
                    {isOpen ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                  </span>
                </button>

                {isOpen ? (
                  <div className="ecb-acc-body">
                    <div className="ecb-options-list">
                      {opts.slice(0, 10).map((opt, idx) => (
                        <button
                          key={`${groupName}_${opt.label}`}
                          className="ecb-option"
                          type="button"
                          onClick={() => onChoose(opt)}
                          title={opt.label}
                        >
                          <span className="ecb-option-num">{idx + 1}</span>
                          <span className="ecb-option-label">{opt.label}</span>
                          <span className="ecb-option-arrow" aria-hidden="true">
                            <HiOutlineArrowRight />
                          </span>
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

      <div className="ecb-options-hint">
        Tip: busca por palabra clave. Ej.: <strong>cupo</strong>, <strong>rechazada</strong>, <strong>reporte</strong>.
      </div>
    </div>
  );
}

export default function HelpChatbot() {
  const navigate = useNavigate();
  const endRef = useRef(null);

  const { user } = useContext(AuthContext);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("ecosteps_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const u = user || storedUser;

  const first = u?.firstName || u?.nombre || "";
  const last = u?.lastName || u?.apellido || "";
  const fullFromParts = [first, last].filter(Boolean).join(" ").trim();

  const displayName = fullFromParts || u?.fullName || u?.name || u?.email || "Usuario";
  const roleSubtitle = u?.role === "admin" ? "Administrador" : "Servicio Social Activo";

  const [nodeId, setNodeId] = useState("start");
  const node = FLOW[nodeId];

  const [messages, setMessages] = useState(() => [makeMsg("bot", FLOW.start.text)]);
  const [query, setQuery] = useState("");
  const [freeQuestion, setFreeQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [lastQuestionForTicket, setLastQuestionForTicket] = useState("");
  const [showCreateTicketBtn, setShowCreateTicketBtn] = useState(false);

  const options = useMemo(() => node?.options || [], [node]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isAskingAI, isCreatingTicket]);

  const reset = useCallback(() => {
    setNodeId("start");
    setQuery("");
    setFreeQuestion("");
    setIsAskingAI(false);
    setIsCreatingTicket(false);
    setLastQuestionForTicket("");
    setShowCreateTicketBtn(false);
    setMessages([makeMsg("bot", FLOW.start.text)]);
  }, []);

  const goHome = useCallback(() => navigate(ROUTES.home), [navigate]);
  const goReport = useCallback(() => navigate(ROUTES.report), [navigate]);
  const goTickets = useCallback(() => navigate(ROUTES.tickets), [navigate]);
  const goHelp = useCallback(() => navigate(ROUTES.help), [navigate]);

  const choose = useCallback(
    (opt) => {
      setQuery("");

      setMessages((prev) => {
        const nextMsgs = [...prev, makeMsg("user", opt.label)];

        if (opt.next === NAV_TICKETS) {
          nextMsgs.push(makeMsg("bot", "Abriendo Mis Tickets..."));
          setTimeout(() => goTickets(), 220);
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

  const handleAskAI = useCallback(async () => {
    const text = freeQuestion.trim();
    if (!text || isAskingAI) return;

    setMessages((prev) => [...prev, makeMsg("user", text)]);
    setFreeQuestion("");
    setIsAskingAI(true);
    setLastQuestionForTicket(text);
    setShowCreateTicketBtn(false);

    try {
      const data = await askEcoBot(text);

      setMessages((prev) => [
        ...prev,
        makeMsg("bot", data?.answer || "No pude responder en este momento."),
      ]);

      const lower = text.toLowerCase();
      const shouldOfferTicket =
        data?.canCreateTicket &&
        (
          lower.includes("problema") ||
          lower.includes("error") ||
          lower.includes("no puedo") ||
          lower.includes("no me deja") ||
          lower.includes("no aparece") ||
          lower.includes("falla") ||
          lower.includes("rechazada") ||
          lower.includes("ticket") ||
          lower.includes("soporte")
        );

      setShowCreateTicketBtn(Boolean(shouldOfferTicket));
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          error?.message || "Ocurrió un error al consultar EcoBot. Intenta nuevamente."
        ),
      ]);
      setShowCreateTicketBtn(true);
    } finally {
      setIsAskingAI(false);
    }
  }, [freeQuestion, isAskingAI]);

  const handleCreateTicketFromBot = useCallback(async () => {
    const baseMessage = lastQuestionForTicket.trim();
    if (!baseMessage || isCreatingTicket) return;

    try {
      setIsCreatingTicket(true);

      const res = await createTicketFromEcoBot({
        subject: `Soporte EcoBot: ${baseMessage}`.slice(0, 120),
        message: `Ticket generado desde EcoBot.\n\nProblema reportado por el usuario:\n${baseMessage}`,
      });

      setMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          `Listo. Ya creé tu ticket: "${res?.ticket?.subject || "Soporte EcoBot"}". Puedes revisarlo en Mis Tickets.`
        ),
      ]);

      setShowCreateTicketBtn(false);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          error?.message || "No pude crear el ticket en este momento."
        ),
      ]);
    } finally {
      setIsCreatingTicket(false);
    }
  }, [lastQuestionForTicket, isCreatingTicket]);

  const onQuestionKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAskAI();
      }
    },
    [handleAskAI]
  );

  return (
    <div className="ecb-page">
      <div className="ecb-shell">
        <Sidebar
          displayName={displayName}
          roleSubtitle={roleSubtitle}
          goHome={goHome}
          goReport={goReport}
          goTickets={goTickets}
          goHelp={goHelp}
        />

        <main className="ecb-main" aria-label="EcoBot">
          <section className="ecb-hero">
            <div className="ecb-hero-copy">
              <span className="ecb-kicker">ASISTENTE DE AYUDA</span>
              <h1 className="ecb-hero-title">{BOT_NAME}</h1>
              <p className="ecb-hero-text">
                Guía rápida del sistema para actividades, evidencias, reportes, tickets y preguntas en lenguaje natural con modelo local.
              </p>

              <div className="ecb-hero-actions">
                <button className="ecb-btn ecb-btn-primary" type="button" onClick={reset}>
                  <HiOutlineArrowPath />
                  <span>Reiniciar</span>
                </button>

                <button className="ecb-btn ecb-btn-secondary" type="button" onClick={goTickets}>
                  <HiOutlineTicket />
                  <span>Tickets</span>
                </button>

                <button className="ecb-btn ecb-btn-secondary" type="button" onClick={goHome}>
                  <HiOutlineHome />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </section>

          <section className="ecb-content-grid">
            <section className="ecb-card ecb-chat-card" aria-label="Chat EcoBot">
              <div className="ecb-card-head">
                <div>
                  <h2 className="ecb-card-title">Chat de ayuda</h2>
                  <p className="ecb-card-subtitle">Usa las opciones o escribe tu pregunta</p>
                </div>

                <div className="ecb-inline-actions">
                  <button className="ecb-btn ecb-btn-secondary ecb-btn-sm" type="button" onClick={goHome}>
                    <HiOutlineHome />
                    <span>Volver al Dashboard</span>
                  </button>
                </div>
              </div>

              <div className="ecb-card-body">
                <div className="ecb-chat">
                  {messages.map((m) => (
                    <ChatBubble key={m.id} botName={BOT_NAME} msg={m} />
                  ))}

                  {isAskingAI ? (
                    <div className="ecb-msg is-bot">
                      <div className="ecb-msg-meta">
                        <span className="ecb-msg-who">{BOT_NAME}</span>
                        <span className="ecb-msg-time">{nowTime()}</span>
                      </div>
                      <div className="ecb-msg-text">Pensando...</div>
                    </div>
                  ) : null}

                  {isCreatingTicket ? (
                    <div className="ecb-msg is-bot">
                      <div className="ecb-msg-meta">
                        <span className="ecb-msg-who">{BOT_NAME}</span>
                        <span className="ecb-msg-time">{nowTime()}</span>
                      </div>
                      <div className="ecb-msg-text">Creando ticket...</div>
                    </div>
                  ) : null}

                  <div ref={endRef} />
                </div>

                <div className="ecb-ai-box">
                  <textarea
                    className="ecb-ai-input"
                    placeholder="Escribe tu duda sobre EcoSteps... Ej: no me aparece el botón para subir evidencia"
                    value={freeQuestion}
                    onChange={(e) => setFreeQuestion(e.target.value)}
                    onKeyDown={onQuestionKeyDown}
                    rows={3}
                    disabled={isAskingAI || isCreatingTicket}
                  />

                  <div className="ecb-ai-actions">
                    <button
                      type="button"
                      className="ecb-btn ecb-btn-primary"
                      onClick={handleAskAI}
                      disabled={isAskingAI || isCreatingTicket || !freeQuestion.trim()}
                    >
                      <HiOutlinePaperAirplane />
                      <span>{isAskingAI ? "Consultando..." : "Preguntar a EcoBot"}</span>
                    </button>

                    {showCreateTicketBtn ? (
                      <button
                        type="button"
                        className="ecb-btn ecb-btn-secondary"
                        onClick={handleCreateTicketFromBot}
                        disabled={isCreatingTicket}
                      >
                        <HiOutlineTicket />
                        <span>{isCreatingTicket ? "Creando ticket..." : "Crear ticket con esto"}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <aside className="ecb-side" aria-label="Opciones EcoBot">
              <OptionsPanel
                options={options}
                query={query}
                setQuery={setQuery}
                onChoose={choose}
                onGoTickets={goTickets}
                onReset={reset}
              />

              <div className="ecb-card ecb-tip-card">
                <div className="ecb-card-head">
                  <div className="ecb-side-head">
                    <HiOutlineQuestionMarkCircle />
                    <h3>Ayuda rápida</h3>
                  </div>
                </div>

                <div className="ecb-card-body">
                  <p className="ecb-side-text">
                    Puedes navegar por categorías o escribir una pregunta libre sobre EcoSteps para que EcoBot te responda.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}