import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";

import "../styles/dashboard.css";
import "../styles/helpchatbot.css";

import LogoutButton from "../components/LogoutButton";
import { AuthContext } from "../context/AuthContext";

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
    text: "Hola. Soy EcoBot.\n\n¿En qué te puedo ayudar hoy?\nElige una opción:",
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
    <div className={`bot-msg ${mine ? "is-mine" : "is-theirs"}`}>
      <div className="bot-msg-meta">
        <span className="bot-msg-who">{mine ? "TÚ" : botName.toUpperCase()}</span>
        <span className="bot-msg-time">{msg.ts}</span>
      </div>
      <div className="bot-msg-text">{msg.text}</div>
    </div>
  );
}

function OptionsPanel({
  options,
  query,
  setQuery,
  onChoose,
  onGoTickets,
  onReset,
}) {
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
      for (const o of opts) out.push(o);
    }
    return out;
  }, [filteredGrouped, openGroup]);

  const numberedGroups = useMemo(() => {
    const map = new Map();
    let n = 1;
    for (const [g, opts] of filteredGrouped) {
      if (openGroup && g !== openGroup) continue;
      for (const opt of opts) {
        map.set(opt.label, n);
        n += 1;
        if (n > 10) break;
      }
      if (n > 10) break;
    }
    return map; // label -> number
  }, [filteredGrouped, openGroup]);

  // ✅ Atajos siguen funcionando, solo no se muestran (si quieres quitarlos también, te lo dejo en 2 líneas)
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

      const isDigit = /^[0-9]$/.test(e.key);
      if (!isDigit) return;

      const num = e.key === "0" ? 10 : Number(e.key);
      const pick = flatVisible[num - 1];
      if (pick) onChoose(pick);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatVisible, onChoose, query, setQuery]);

  const toggle = (g) => setOpenGroup((cur) => (cur === g ? "" : g));

  return (
    <div className="dash-panel dash-panel-side bot-side">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Opciones</div>
          <div className="dash-panel-sub">Elige un tema para continuar</div>
        </div>

        <div className="bot-head-actions">
          <button className="dash-btn dash-btn-ghost bot-btn-sm" type="button" onClick={onReset}>
            Reiniciar
          </button>
          <button className="dash-btn dash-btn-primary bot-btn-sm" type="button" onClick={onGoTickets}>
            Ir a Tickets
          </button>
        </div>
      </div>

      <div className="bot-search">
        <div className="bot-search-wrap">
          <span className="bot-search-ico" aria-hidden="true">⌕</span>
          <input
            className="bot-input"
            placeholder="Buscar (ej. evidencia, reporte, ticket)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query ? (
          <button
            className="dash-btn dash-btn-ghost bot-btn-sm"
            onClick={() => setQuery("")}
            type="button"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="dash-panel-body">
        {filteredGrouped.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-title">Sin resultados</div>
            <p className="dash-empty-text">No hay opciones para “{query}”.</p>
          </div>
        ) : (
          filteredGrouped.map(([groupName, opts]) => {
            const isOpen = openGroup === groupName;

            return (
              <div key={groupName} className="bot-acc">
                <button
                  type="button"
                  className={`bot-acc-head ${isOpen ? "is-open" : ""}`}
                  onClick={() => toggle(groupName)}
                  aria-expanded={isOpen}
                >
                  <span className="bot-acc-title">{groupName}</span>
                  <span className="bot-acc-icon">{isOpen ? "–" : "+"}</span>
                </button>

                {isOpen ? (
                  <div className="bot-acc-body">
                    <div className="bot-options">
                      {opts.slice(0, 10).map((opt) => {
                        const n = numberedGroups.get(opt.label);
                        return (
                          <button
                            key={opt.label}
                            className="bot-opt"
                            type="button"
                            onClick={() => onChoose(opt)}
                            title={opt.label}
                          >
                            <span className="bot-opt-num">{n ?? "•"}</span>
                            <span className="bot-opt-label">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="bot-sidehint">
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

  const options = useMemo(() => node?.options || [], [node]);

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
    <div className="dash-page">
      <div className="dash-shell">
        <aside className="dash-sidebar" aria-label="Navegación">
          <div className="dash-sidebar-head">
            <div className="dash-brand">
              <div className="dash-brand-icon">E</div>
              <div>
                <div className="dash-brand-name">EcoSteps</div>
                <div className="dash-brand-sub">SGSS • Panel estudiante</div>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            <button type="button" className="dash-nav-item" onClick={goHome}>
              Dashboard
            </button>

            <button type="button" className="dash-nav-item" onClick={() => navigate(ROUTES.report)}>
              Subir reporte
            </button>

            <button type="button" className="dash-nav-item" onClick={goTickets}>
              Tickets
            </button>

            <button type="button" className="dash-nav-item is-active" onClick={() => navigate(ROUTES.help)}>
              EcoBot
            </button>
          </nav>

          <div className="dash-sidebar-foot">
            <div className="dash-profile">
              <div className="dash-profile-label">Sesión</div>
              <div className="dash-profile-name">{displayName}</div>
              <div className="dash-profile-sub">{roleSubtitle}</div>

              <div className="dash-profile-actions">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="dash-main" aria-label="Contenido principal">
          <div className="dash-card">
            <div className="dash-top">
              <div>
                <h2 className="dash-title">{BOT_NAME}</h2>
                <p className="dash-subtitle">Guía rápida del sistema (menú por opciones)</p>
              </div>

              <div className="dash-top-actions">
                <button className="dash-btn dash-btn-ghost bot-btn-sm" type="button" onClick={reset}>
                  Reiniciar
                </button>
                <button className="dash-btn dash-btn-primary bot-btn-sm" type="button" onClick={goTickets}>
                  Tickets
                </button>
              </div>
            </div>

            <div className="dash-grid">
              <section className="dash-panel" aria-label="Chat EcoBot">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Chat de ayuda</div>
                    <div className="dash-panel-sub">Selecciona una opción para continuar</div>
                  </div>

                  <div className="bot-head-actions">
                    <button className="dash-btn dash-btn-ghost bot-btn-sm" type="button" onClick={goHome}>
                      Volver al Dashboard
                    </button>
                  </div>
                </div>

                <div className="dash-panel-body">
                  <div className="bot-chat">
                    {messages.map((m) => (
                      <ChatBubble key={m.id} botName={BOT_NAME} msg={m} />
                    ))}
                    <div ref={endRef} />
                  </div>
                </div>
              </section>

              <aside aria-label="Opciones EcoBot">
                <OptionsPanel
                  options={options}
                  query={query}
                  setQuery={setQuery}
                  onChoose={choose}
                  onGoTickets={goTickets}
                  onReset={reset}
                />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}