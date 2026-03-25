import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineTicket,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineCheckBadge,
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
    text: "Hola. Soy EcoBot.\n\n¿En qué te puedo ayudar hoy?\nElige una opción numerada:",
    options: [
      { label: "¿Qué es EcoSteps?", next: "about", group: "General" },
      { label: "Inscribirme a una actividad", next: "join_activity", group: "Actividades" },
      { label: "Subir evidencia", next: "upload_evidence", group: "Evidencias" },
      { label: "Subir reporte bimestral", next: "upload_report", group: "Reportes" },
      { label: "Tickets / soporte", next: "tickets_help", group: "Soporte" },
      { label: "Mi servicio social", next: "about", group: "General" },
    ],
  },

  about: {
    title: "General",
    text:
      "EcoSteps es una plataforma para gestionar Servicio Social.\n\n" +
      "Te permite:\n" +
      "• Registrar actividades\n" +
      "• Subir evidencias\n" +
      "• Enviar reportes bimestrales\n" +
      "• Crear tickets de soporte\n" +
      "• Dar seguimiento a tus horas",
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
      "2) Busca la actividad.\n" +
      "3) Presiona 'Inscribirme'.\n\n" +
      "Si no te deja, puede ser por cupo, actividad cerrada o porque ya estás inscrito.",
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
      "• Esperar a que se libere un cupo\n" +
      "• Crear ticket si parece un error",
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
      "• Actividad cerrada",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  upload_evidence: {
    title: "Evidencias",
    text:
      "Para subir evidencia:\n" +
      "1) Entra a 'Mis actividades'.\n" +
      "2) Busca la actividad.\n" +
      "3) Presiona 'Subir evidencia'.\n\n" +
      "Si la evidencia ya fue aprobada, el botón puede deshabilitarse.",
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
      "2) Revisa la evidencia de tu actividad.\n" +
      "3) Verás si está pendiente, aprobada o rechazada.",
    options: [
      { label: "Volver a Evidencias", next: "upload_evidence", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  evidence_rejected: {
    title: "Evidencias",
    text:
      "Si fue rechazada:\n" +
      "• Revisa las observaciones del admin\n" +
      "• Sube una evidencia más clara\n" +
      "• Asegúrate de que corresponde a la actividad correcta",
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
      "1) Entra a 'Subir reporte'.\n" +
      "2) Adjunta el archivo.\n" +
      "3) Envía.\n\n" +
      "Cuando el admin lo apruebe, se actualiza tu progreso.",
    options: [
      { label: "No me deja subir", next: "report_issue", group: "Problemas comunes" },
      { label: "¿Dónde veo si lo aprobaron?", next: "report_status", group: "Guía" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  report_status: {
    title: "Reportes",
    text:
      "Para revisar si fue aprobado:\n" +
      "• Consulta tu dashboard\n" +
      "• Verifica tu avance y horas acumuladas\n" +
      "• Si no cambia, puede seguir pendiente o rechazado",
    options: [
      { label: "Volver a Reportes", next: "upload_report", group: "Navegación" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  report_issue: {
    title: "Reportes",
    text:
      "Si falla la subida del reporte:\n" +
      "• Verifica el tipo de archivo\n" +
      "• Revisa tu conexión\n" +
      "• Intenta con un archivo más ligero\n\n" +
      "Si persiste, crea un ticket y adjunta captura.",
    options: [
      { label: "Crear ticket", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  tickets_help: {
    title: "Tickets / soporte",
    text:
      "Los tickets sirven para reportar incidencias y solicitar ayuda.\n\n" +
      "Puedes:\n" +
      "• Crear un ticket\n" +
      "• Ver tus tickets\n" +
      "• Chatear dentro del ticket\n" +
      "• Adjuntar archivos",
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
      "3) Opcionalmente relaciónalo con una actividad.\n" +
      "4) Guarda.",
    options: [
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  tickets_attach: {
    title: "Tickets / soporte",
    text:
      "Para adjuntar un archivo:\n" +
      "1) Abre el ticket.\n" +
      "2) Escribe tu mensaje.\n" +
      "3) Selecciona archivo.\n" +
      "4) Envía.",
    options: [
      { label: "Ir a Mis Tickets", next: "cta_ticket", group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },

  cta_ticket: {
    title: "Acción",
    text:
      "Te envío a 'Mis Tickets' para que lo reportes.\n\n" +
      "Sugerencia: adjunta una captura para resolverlo más rápido.",
    options: [
      { label: "Ir a Mis Tickets", next: NAV_TICKETS, group: "Acción" },
      { label: "Menú principal", next: "start", group: "Navegación" },
    ],
  },
};

const nowTime = () =>
  new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date());

function mapSourceMeta(source = "") {
  const s = String(source || "").toLowerCase();

  if (s.includes("ollama")) {
    return { tone: "ai", label: "IA integrada", icon: "ai" };
  }

  if (s.includes("dictionary")) {
    return { tone: "quick", label: "Respuesta rápida", icon: "bolt" };
  }

  if (s.includes("fallback")) {
    return { tone: "fallback", label: "Soporte local", icon: "check" };
  }

  return { tone: "neutral", label: "EcoBot", icon: "spark" };
}

function makeMsg(role, text, extra = {}) {
  return {
    id:
      (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    role,
    text,
    ts: nowTime(),
    source: extra.source || null,
    tone: extra.tone || null,
    badge: extra.badge || null,
    isThinking: Boolean(extra.isThinking),
  };
}

function renderSourceIcon(icon) {
  if (icon === "ai") return <HiOutlineCpuChip />;
  if (icon === "bolt") return <HiOutlineBolt />;
  if (icon === "check") return <HiOutlineCheckBadge />;
  return <HiOutlineSparkles />;
}

function ChatBubble({ botName, msg }) {
  const mine = msg.role === "user";
  const sourceMeta = !mine ? mapSourceMeta(msg.source) : null;

  return (
    <div
      className={[
        "ecb-msg",
        mine ? "is-mine" : "is-bot",
        !mine && sourceMeta?.tone ? `is-${sourceMeta.tone}` : "",
        msg.isThinking ? "is-thinking" : "",
      ].join(" ")}
    >
      <div className="ecb-msg-meta">
        <div className="ecb-msg-meta-left">
          <span className="ecb-msg-who">{mine ? "Tú" : botName}</span>

          {!mine ? (
            <span className={`ecb-msg-badge is-${sourceMeta?.tone || "neutral"}`}>
              <span className="ecb-msg-badge-icon" aria-hidden="true">
                {renderSourceIcon(sourceMeta?.icon)}
              </span>
              <span>{msg.badge || sourceMeta?.label || "EcoBot"}</span>
            </span>
          ) : null}
        </div>

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
        <div className="ecb-status-chip">
          <span className="ecb-status-dot" />
          <span>Ollama local activo</span>
        </div>

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

function NumberedOptions({ options, searchValue, onSearchChange, onChoose }) {
  const visibleOptions = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return options.slice(0, 6);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 6);
  }, [options, searchValue]);

  return (
    <div className="ecb-quick-panel">
      <div className="ecb-quick-panel-head">
        <div>
          <h3 className="ecb-section-title">Opciones rápidas</h3>
          <p className="ecb-section-subtitle">
            Busca o selecciona una opción para avanzar más rápido
          </p>
        </div>
      </div>

      <div className="ecb-search">
        <div className="ecb-search-wrap">
          <span className="ecb-search-ico" aria-hidden="true">
            <HiOutlineMagnifyingGlass />
          </span>

          <input
            className="ecb-search-input"
            placeholder="Buscar opción rápida"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="ecb-numbered-grid">
        {visibleOptions.length ? (
          visibleOptions.map((opt, index) => (
            <button
              key={`${opt.label}_${index}`}
              type="button"
              className="ecb-numbered-item"
              onClick={() => onChoose(opt)}
            >
              <span className="ecb-numbered-index">{index + 1}</span>
              <span className="ecb-numbered-label">{opt.label}</span>
            </button>
          ))
        ) : (
          <div className="ecb-empty-mini">
            <div className="ecb-empty-mini-title">Sin resultados</div>
            <p className="ecb-empty-mini-text">No encontré opciones para “{searchValue}”.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HelpChatbot() {
  const navigate = useNavigate();
  const localEndRef = useRef(null);
  const aiEndRef = useRef(null);

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

  const [messages, setMessages] = useState(() => [
    makeMsg("bot", FLOW.start.text, { source: "flow", badge: "Guía rápida", tone: "neutral" }),
  ]);

  const [aiMessages, setAiMessages] = useState(() => [
    makeMsg(
      "bot",
      "Hola, soy la IA integrada de EcoBot.\n\nPuedes preguntarme cualquier duda sobre EcoSteps en lenguaje natural.",
      { source: "ollama", badge: "IA integrada", tone: "ai" }
    ),
  ]);

  const [optionSearch, setOptionSearch] = useState("");
  const [localInput, setLocalInput] = useState("");
  const [freeQuestion, setFreeQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [lastQuestionForTicket, setLastQuestionForTicket] = useState("");
  const [showCreateTicketBtn, setShowCreateTicketBtn] = useState(false);

  const options = useMemo(() => node?.options || [], [node]);

  const goHome = useCallback(() => navigate(ROUTES.home), [navigate]);
  const goReport = useCallback(() => navigate(ROUTES.report), [navigate]);
  const goTickets = useCallback(() => navigate(ROUTES.tickets), [navigate]);
  const goHelp = useCallback(() => navigate(ROUTES.help), [navigate]);

  useEffect(() => {
    localEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAskingAI, isCreatingTicket]);

  const choose = useCallback(
    (opt) => {
      setOptionSearch("");
      setLocalInput("");

      setMessages((prev) => {
        const nextMsgs = [...prev, makeMsg("user", opt.label)];

        if (opt.next === NAV_TICKETS) {
          nextMsgs.push(
            makeMsg("bot", "Abriendo Mis Tickets...", {
              source: "flow",
              badge: "Navegación",
            })
          );
          setTimeout(() => goTickets(), 220);
          return nextMsgs;
        }

        const nextId = opt.next;
        const nextNode = FLOW[nextId];
        setTimeout(() => setNodeId(nextId), 0);

        if (nextNode?.text) {
          nextMsgs.push(
            makeMsg("bot", nextNode.text, {
              source: "flow",
              badge: nextNode.title || "Guía rápida",
            })
          );
        }

        return nextMsgs;
      });
    },
    [goTickets]
  );

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (!/^[1-6]$/.test(e.key)) return;

      const index = Number(e.key) - 1;
      const selected = options.slice(0, 6)[index];
      if (selected) choose(selected);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, choose]);

  const reset = useCallback(() => {
    setNodeId("start");
    setOptionSearch("");
    setLocalInput("");
    setFreeQuestion("");
    setIsAskingAI(false);
    setIsCreatingTicket(false);
    setLastQuestionForTicket("");
    setShowCreateTicketBtn(false);

    setMessages([
      makeMsg("bot", FLOW.start.text, {
        source: "flow",
        badge: "Guía rápida",
        tone: "neutral",
      }),
    ]);

    setAiMessages([
      makeMsg(
        "bot",
        "Hola, soy la IA integrada de EcoBot.\n\nPuedes preguntarme cualquier duda sobre EcoSteps en lenguaje natural.",
        { source: "ollama", badge: "IA integrada", tone: "ai" }
      ),
    ]);
  }, []);

  const handleLocalSend = useCallback(() => {
    const value = localInput.trim();
    if (!value) return;

    if (/^[1-6]$/.test(value)) {
      const index = Number(value) - 1;
      const selected = options.slice(0, 6)[index];
      if (selected) {
        choose(selected);
        setLocalInput("");
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      makeMsg("user", value),
      makeMsg(
        "bot",
        "Selecciona una opción válida usando un número del 1 al 6 o haz clic en una opción rápida.",
        {
          source: "fallback",
          badge: "Soporte local",
          tone: "fallback",
        }
      ),
    ]);
    setLocalInput("");
  }, [localInput, options, choose]);

  const handleLocalKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLocalSend();
      }
    },
    [handleLocalSend]
  );

  const handleAskAI = useCallback(async () => {
    const text = freeQuestion.trim();
    if (!text || isAskingAI) return;

    setAiMessages((prev) => [...prev, makeMsg("user", text)]);
    setFreeQuestion("");
    setIsAskingAI(true);
    setLastQuestionForTicket(text);
    setShowCreateTicketBtn(false);

    try {
      const data = await askEcoBot(text);
      const meta = mapSourceMeta(data?.source);

      setAiMessages((prev) => [
        ...prev,
        makeMsg("bot", data?.answer || "No pude responder en este momento.", {
          source: data?.source || "ollama",
          badge: meta.label,
          tone: meta.tone,
        }),
      ]);

      const lower = text.toLowerCase();
      const shouldOfferTicket =
        data?.canCreateTicket &&
        (lower.includes("problema") ||
          lower.includes("error") ||
          lower.includes("no puedo") ||
          lower.includes("no me deja") ||
          lower.includes("no aparece") ||
          lower.includes("falla") ||
          lower.includes("rechazada") ||
          lower.includes("ticket") ||
          lower.includes("soporte"));

      setShowCreateTicketBtn(Boolean(shouldOfferTicket));
    } catch (error) {
      setAiMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          error?.message || "Ocurrió un error al consultar EcoBot. Intenta nuevamente.",
          {
            source: "fallback",
            badge: "Error controlado",
            tone: "fallback",
          }
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

      setAiMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          `Listo. Ya creé tu ticket: "${res?.ticket?.subject || "Soporte EcoBot"}". Puedes revisarlo en Mis Tickets.`,
          {
            source: "flow",
            badge: "Ticket creado",
            tone: "quick",
          }
        ),
      ]);

      setShowCreateTicketBtn(false);
    } catch (error) {
      setAiMessages((prev) => [
        ...prev,
        makeMsg(
          "bot",
          error?.message || "No pude crear el ticket en este momento.",
          {
            source: "fallback",
            badge: "Error controlado",
            tone: "fallback",
          }
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
              <span className="ecb-topbar-kicker">ASISTENTE DE AYUDA</span>
              <h1 className="ecb-topbar-title">EcoBot</h1>
              <p className="ecb-topbar-text">
                Centro de ayuda de EcoSteps para resolver dudas sobre actividades,
                evidencias, reportes y tickets desde una sola vista.
              </p>

              <div className="ecb-hero-pills">
                <span className="ecb-hero-pill">Flujo guiado</span>
                <span className="ecb-hero-pill">IA integrada</span>
                <span className="ecb-hero-pill">Soporte y tickets</span>
              </div>
            </div>

            <div className="ecb-hero-actions">
              <button className="ecb-btn ecb-btn-ghost" type="button" onClick={reset}>
                <HiOutlineArrowPath />
                <span>Reiniciar conversación</span>
              </button>
            </div>
          </section>

          <section className="ecb-summary-grid" aria-label="Resumen de herramientas">
            <article className="ecb-summary-card">
              <div className="ecb-summary-icon is-quick">
                <HiOutlineBolt />
              </div>
              <div className="ecb-summary-body">
                <h3>Respuesta rápida</h3>
                <p>
                  Usa opciones numeradas para resolver dudas frecuentes de forma inmediata.
                </p>
              </div>
            </article>

            <article className="ecb-summary-card">
              <div className="ecb-summary-icon is-ai">
                <HiOutlineCpuChip />
              </div>
              <div className="ecb-summary-body">
                <h3>Consulta con IA</h3>
                <p>
                  Escribe preguntas en lenguaje natural para obtener una respuesta más completa.
                </p>
              </div>
            </article>

            <article className="ecb-summary-card">
              <div className="ecb-summary-icon is-ticket">
                <HiOutlineTicket />
              </div>
              <div className="ecb-summary-body">
                <h3>Escalación a soporte</h3>
                <p>
                  Si el problema persiste, puedes crear un ticket sin salir del módulo.
                </p>
              </div>
            </article>
          </section>

          <section className="ecb-panels">
            <section className="ecb-panel" aria-label="Soporte local">
              <div className="ecb-panel-head">
                <div className="ecb-panel-badge is-quick">
                  <HiOutlineBolt />
                  <span>Soporte local</span>
                </div>

                <h2 className="ecb-panel-title">Guía rápida paso a paso</h2>
                <p className="ecb-panel-subtitle">
                  Navega por preguntas frecuentes con opciones rápidas y respuestas claras.
                </p>
              </div>

              <div className="ecb-chat ecb-chat-local">
                {messages.map((m) => (
                  <ChatBubble key={m.id} botName={BOT_NAME} msg={m} />
                ))}
                <div ref={localEndRef} />
              </div>

              <NumberedOptions
                options={options}
                searchValue={optionSearch}
                onSearchChange={setOptionSearch}
                onChoose={choose}
              />

              <div className="ecb-local-entry">
                <label className="ecb-input-label">Elegir opción por número</label>

                <div className="ecb-local-inputbar">
                  <input
                    className="ecb-local-input"
                    placeholder="Ingresa un número del 1 al 6"
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    onKeyDown={handleLocalKeyDown}
                    inputMode="numeric"
                  />

                  <button
                    type="button"
                    className="ecb-send-mini"
                    onClick={handleLocalSend}
                    aria-label="Enviar opción"
                  >
                    <HiOutlinePaperAirplane />
                  </button>
                </div>
              </div>
            </section>

            <section className="ecb-panel" aria-label="IA integrada">
              <div className="ecb-panel-head">
                <div className="ecb-panel-badge is-ai">
                  <HiOutlineCpuChip />
                  <span>IA integrada</span>
                </div>

                <h2 className="ecb-panel-title">Consulta con IA</h2>
                <p className="ecb-panel-subtitle">
                  Describe tu duda con tus palabras y recibe una ayuda más completa.
                </p>

                <div className="ecb-ai-statusline">
                  <span className="ecb-ai-status-dot" />
                  <span>Ollama local activo • Modelo listo para responder</span>
                </div>
              </div>

              <div className="ecb-chat ecb-chat-ai">
                {aiMessages.map((m) => (
                  <ChatBubble key={m.id} botName={`${BOT_NAME} IA`} msg={m} />
                ))}

                {isAskingAI ? (
                  <ChatBubble
                    botName={`${BOT_NAME} IA`}
                    msg={makeMsg("bot", "Pensando con IA integrada...", {
                      source: "ollama",
                      badge: "IA integrada",
                      tone: "ai",
                      isThinking: true,
                    })}
                  />
                ) : null}

                {isCreatingTicket ? (
                  <ChatBubble
                    botName={`${BOT_NAME} IA`}
                    msg={makeMsg("bot", "Creando ticket...", {
                      source: "flow",
                      badge: "Acción",
                      tone: "quick",
                      isThinking: true,
                    })}
                  />
                ) : null}

                <div ref={aiEndRef} />
              </div>

              <div className="ecb-ai-composer">
                <label className="ecb-input-label">Escribe tu consulta</label>

                <textarea
                  className="ecb-ai-input"
                  placeholder="Ejemplo: No se me reflejan mis horas, mi evidencia fue rechazada o no puedo subir mi reporte..."
                  value={freeQuestion}
                  onChange={(e) => setFreeQuestion(e.target.value)}
                  onKeyDown={onQuestionKeyDown}
                  rows={4}
                  disabled={isAskingAI || isCreatingTicket}
                />

                <div className="ecb-ai-actions">
                  {showCreateTicketBtn ? (
                    <button
                      type="button"
                      className="ecb-btn ecb-btn-ghost-light"
                      onClick={handleCreateTicketFromBot}
                      disabled={isCreatingTicket}
                    >
                      <HiOutlineTicket />
                      <span>{isCreatingTicket ? "Creando ticket..." : "Crear ticket con esto"}</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="ecb-btn ecb-btn-accent ecb-btn-submit"
                    onClick={handleAskAI}
                    disabled={isAskingAI || isCreatingTicket || !freeQuestion.trim()}
                  >
                    <HiOutlinePaperAirplane />
                    <span>{isAskingAI ? "Consultando..." : "Preguntar"}</span>
                  </button>
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}