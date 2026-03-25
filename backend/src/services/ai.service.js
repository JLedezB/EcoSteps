// backend/src/services/ai.service.js

const ECOBOT_SYSTEM_PROMPT = `
Eres EcoBot, el asistente oficial de EcoSteps.

Tu trabajo es ayudar SOLO con temas de EcoSteps:
- actividades
- inscripción a actividades
- cupos
- evidencias
- reportes bimestrales
- tickets
- dashboard
- progreso
- uso general de la plataforma

Reglas de comportamiento:
1. Responde siempre en español.
2. Sé claro, profesional, amable y natural.
3. Responde de forma breve pero suficiente.
4. No des saludos innecesarios.
5. Solo saluda si el usuario únicamente saluda.
6. No empieces todas las respuestas con "Hola".
7. No cortes ideas a la mitad.
8. Si la duda es simple, responde simple.
9. Si la duda requiere explicación, responde con estructura clara.
10. Si el usuario reporta un problema técnico, oriéntalo y sugiere crear un ticket si aplica.
11. Si el usuario quiere crear un ticket, prioriza esa intención.
12. No inventes funciones que no existan.
13. Si no conoces un formato exacto de archivo, dilo con honestidad.
14. Si la pregunta no es sobre EcoSteps, responde exactamente:
"Solo puedo ayudarte con temas de EcoSteps, como actividades, evidencias, reportes, tickets y uso de la plataforma."

Calidad:
- No respondas con un saludo si el usuario hizo una pregunta real.
- No mezcles módulos que no vienen al caso.
- No repitas información innecesaria.
- Si ya entendiste el tema principal, responde directo.
`.trim();

const chatMemory = new Map();
const answerCache = new Map();

const MEMORY_TTL_MS = 1000 * 60 * 30;
const CACHE_TTL_MS = 1000 * 60 * 10;
const MAX_CACHE_ITEMS = 500;
const MAX_MEMORY_ITEMS = 800;

const SIMPLE_REPLY_LIMIT = 220;
const NORMAL_REPLY_LIMIT = 1000;
const MODEL_MAX_CHARS = 1400;

const OUT_OF_SCOPE_RESPONSE =
  "Solo puedo ayudarte con temas de EcoSteps, como actividades, evidencias, reportes, tickets y uso de la plataforma.";

const STRICT_SMALL_TALK = {
  greetings: new Set([
    "hola",
    "holi",
    "holaa",
    "buenas",
    "buen dia",
    "buen día",
    "buenas tardes",
    "buenas noches",
    "que tal",
    "qué tal",
    "hey",
    "ey",
  ]),
  thanks: new Set([
    "gracias",
    "muchas gracias",
    "graciass",
    "grx",
    "thanks",
    "te agradezco",
    "agradecido",
    "agradecida",
  ]),
  bye: new Set([
    "adios",
    "adiós",
    "bye",
    "nos vemos",
    "hasta luego",
    "hasta pronto",
    "me voy",
    "listo gracias adios",
    "listo gracias adiós",
  ]),
  affirm: new Set([
    "ok",
    "oka",
    "va",
    "sale",
    "entendido",
    "entendi",
    "entendí",
    "perfecto",
    "dale",
    "bien",
  ]),
};

const TYPO_REPLACEMENTS = {
  sirtve: "sirve",
  ubirla: "subirla",
  ubirlo: "subirlo",
  subr: "subir",
  subri: "subir",
  subie: "subir",
  bimesttal: "bimestral",
  bimesttral: "bimestral",
  bimestrtal: "bimestral",
  bimeestral: "bimestral",
  activdad: "actividad",
  activdades: "actividades",
  activiad: "actividad",
  evidnencia: "evidencia",
  evidenciass: "evidencias",
  repote: "reporte",
  repore: "reporte",
  repotrte: "reporte",
  ticekt: "ticket",
  tikcet: "ticket",
  tikets: "tickets",
  dashbord: "dashboard",
  dasboard: "dashboard",
  pogreso: "progreso",
  progeso: "progreso",
  inscrbirme: "inscribirme",
  inscribrime: "inscribirme",
  inscribri: "inscribir",
  cuposs: "cupos",
  formatoo: "formato",
  archibo: "archivo",
  archvos: "archivos",
  osea: "o sea",
  generame: "generar",
  hazme: "hacerme",
  creame: "crear",
  levantame: "levantar",
  ocupo: "necesito",
};

const TOPIC_PATTERNS = {
  activities: [
    "actividad",
    "actividades",
    "inscribirme",
    "inscribir",
    "inscripcion",
    "inscripción",
    "cupo",
    "cupos",
    "anotarme",
    "unirme",
    "mis actividades",
  ],
  evidences: [
    "evidencia",
    "evidencias",
    "subir evidencia",
    "adjuntar evidencia",
    "evidencia rechazada",
    "evidencia aprobada",
    "mis evidencias",
  ],
  reports: [
    "reporte",
    "reportes",
    "reporte bimestral",
    "reportes bimestrales",
    "bimestral",
    "subir reporte",
    "adjuntar reporte",
    "horas bimestrales",
    "horas del bimestre",
  ],
  tickets: [
    "ticket",
    "tickets",
    "soporte",
    "incidencia",
    "ayuda tecnica",
    "ayuda técnica",
    "reportar problema",
    "seguimiento",
    "mis tickets",
    "caso",
  ],
  dashboard: [
    "dashboard",
    "panel",
    "tablero",
    "pantalla principal",
    "inicio",
  ],
  progress: [
    "progreso",
    "avance",
    "mis horas",
    "horas",
    "porcentaje",
    "contador",
    "servicio social",
  ],
  files: [
    "archivo",
    "archivos",
    "adjuntar",
    "subir archivo",
    "cargar archivo",
    "formato",
    "formatos",
    "tipo de archivo",
    "extensiones",
    "pdf",
    "imagen",
  ],
};

const INTENT_PATTERNS = {
  explain: [
    "que es",
    "qué es",
    "para que sirve",
    "para qué sirve",
    "que significa",
    "qué significa",
    "explicame",
    "explícame",
    "explica",
    "como funciona",
    "cómo funciona",
    "como funcionan",
    "cómo funcionan",
    "resumeme",
    "resúmeme",
  ],
  howto: [
    "como",
    "cómo",
    "como hago",
    "cómo hago",
    "como se hace",
    "cómo se hace",
    "como puedo",
    "cómo puedo",
    "ayudame",
    "ayúdame",
    "paso a paso",
    "como se sube",
    "cómo se sube",
    "como adjunto",
    "cómo adjunto",
    "como adjuntar",
    "cómo adjuntar",
  ],
  problem: [
    "no puedo",
    "no me deja",
    "no aparece",
    "falla",
    "error",
    "problema",
    "rechazada",
    "rechazado",
    "no carga",
    "no se sube",
    "no funciona",
    "no sirve",
    "no se refleja",
    "no me refleja",
    "desaparecio",
    "desapareció",
  ],
  status: [
    "donde veo",
    "dónde veo",
    "como veo",
    "cómo veo",
    "como reviso",
    "cómo reviso",
    "como saber",
    "cómo saber",
    "ver estado",
    "estado",
    "pendiente",
    "aprobado",
    "aprobada",
    "seguimiento",
  ],
  format: [
    "formato",
    "formatos",
    "tipo de archivo",
    "tipos de archivo",
    "extensiones",
    "que formato acepta",
    "qué formato acepta",
    "que archivos acepta",
    "qué archivos acepta",
    "que tipo acepta",
    "qué tipo acepta",
  ],
  create_ticket: [
    "crear ticket",
    "crea ticket",
    "creame un ticket",
    "créame un ticket",
    "generar ticket",
    "generame un ticket",
    "genera un ticket",
    "hazme un ticket",
    "hacerme un ticket",
    "levantar ticket",
    "levantame un ticket",
    "quiero crear un ticket",
    "quiero levantar un ticket",
    "necesito un ticket",
    "abre un ticket",
    "abrir ticket",
    "ticket para mi situacion",
    "ticket para mi situación",
  ],
};

const FAQS = [
  {
    keys: ["que es ecosteps", "para que sirve ecosteps", "que hace ecosteps", "de que trata ecosteps"],
    answer:
      "EcoSteps es la plataforma donde gestionas tu servicio social. Desde ahí puedes ver actividades, inscribirte, subir evidencias, enviar reportes bimestrales, consultar tu progreso y crear tickets de soporte.",
    topic: "general",
  },
  {
    keys: ["que son las actividades", "que es una actividad"],
    answer:
      "Las actividades son espacios o tareas dentro de EcoSteps en los que puedes participar como parte de tu servicio social. Desde el Dashboard puedes revisarlas, ver cupos disponibles e inscribirte si siguen abiertas.",
    topic: "activities",
  },
  {
    keys: ["como me inscribo a una actividad", "como inscribirme a una actividad", "como me inscribo", "como inscribirme"],
    answer:
      "Para inscribirte a una actividad, entra al Dashboard, busca la actividad disponible y usa la opción de inscripción. Si la actividad tiene cupos y sigue abierta, deberías poder registrarte desde ahí.",
    topic: "activities",
  },
  {
    keys: ["que es una evidencia", "que son las evidencias"],
    answer:
      "Las evidencias son archivos que subes para comprobar tu participación en una actividad. Su estado normalmente puede verse como pendiente, aprobada o rechazada.",
    topic: "evidences",
  },
  {
    keys: ["como subir evidencia", "como subir una evidencia", "como subo mi evidencia"],
    answer:
      "Para subir una evidencia, entra al Dashboard, ve a 'Mis actividades', localiza la actividad correspondiente y usa la opción 'Subir evidencia'. Después adjunta el archivo y envíalo.",
    topic: "evidences",
  },
  {
    keys: ["que es un reporte", "que es un reporte bimestral", "que son los reportes bimestrales"],
    answer:
      "El reporte bimestral sirve para registrar y validar tu avance dentro del servicio social. Cuando se revisa y aprueba, tu progreso en EcoSteps debería actualizarse.",
    topic: "reports",
  },
  {
    keys: ["como subir reporte", "como subir un reporte"],
    answer:
      "Para subir tu reporte bimestral, entra al Dashboard, localiza la opción 'Subir reporte', adjunta el archivo correspondiente y envíalo para revisión.",
    topic: "reports",
  },
  {
    keys: ["que es un ticket", "que son los tickets"],
    answer:
      "Los tickets sirven para reportar problemas o pedir soporte dentro de EcoSteps. Desde el detalle del ticket puedes revisar estado, respuestas y dar seguimiento.",
    topic: "tickets",
  },
  {
    keys: ["como crear un ticket"],
    answer:
      "Para crear un ticket, entra a 'Mis Tickets', agrega un asunto claro, describe el problema y envíalo. Si hace falta, también puedes adjuntar archivos.",
    topic: "tickets",
  },
  {
    keys: ["como dar seguimiento a un ticket", "como funciona el seguimiento de tickets"],
    answer:
      "El seguimiento de un ticket se hace desde su detalle. Ahí puedes revisar el estado, leer respuestas y enviar mensajes nuevos si necesitas agregar información.",
    topic: "tickets",
  },
  {
    keys: ["como adjunto un archivo en un ticket", "como adjuntar un archivo en un ticket"],
    answer:
      "Para adjuntar un archivo en un ticket, abre el detalle del ticket, escribe tu mensaje, selecciona el archivo y envíalo junto con la respuesta.",
    topic: "tickets",
  },
  {
    keys: ["que es el dashboard", "para que sirve el dashboard"],
    answer:
      "El Dashboard es tu panel principal en EcoSteps. Desde ahí puedes ver actividades, subir reportes, revisar evidencias, consultar tu progreso y acceder a otras secciones importantes.",
    topic: "dashboard",
  },
  {
    keys: ["donde veo mi progreso", "como ver mi progreso"],
    answer:
      "Tu progreso se consulta desde el Dashboard. Ahí puedes revisar el avance general, reportes aprobados y, según la vista disponible, tus horas o actividades registradas.",
    topic: "progress",
  },
];

function cleanupMaps() {
  const now = Date.now();

  for (const [key, value] of chatMemory.entries()) {
    if (!value?.updatedAt || now - value.updatedAt > MEMORY_TTL_MS) {
      chatMemory.delete(key);
    }
  }

  for (const [key, value] of answerCache.entries()) {
    if (!value?.updatedAt || now - value.updatedAt > CACHE_TTL_MS) {
      answerCache.delete(key);
    }
  }

  if (chatMemory.size > MAX_MEMORY_ITEMS) {
    const entries = [...chatMemory.entries()].sort(
      (a, b) => (a[1]?.updatedAt || 0) - (b[1]?.updatedAt || 0)
    );
    const overflow = chatMemory.size - MAX_MEMORY_ITEMS;
    for (let i = 0; i < overflow; i += 1) {
      chatMemory.delete(entries[i][0]);
    }
  }

  if (answerCache.size > MAX_CACHE_ITEMS) {
    const entries = [...answerCache.entries()].sort(
      (a, b) => (a[1]?.updatedAt || 0) - (b[1]?.updatedAt || 0)
    );
    const overflow = answerCache.size - MAX_CACHE_ITEMS;
    for (let i = 0; i < overflow; i += 1) {
      answerCache.delete(entries[i][0]);
    }
  }
}

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()[\]{}'"`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyCommonCorrections(text = "") {
  const words = String(text).split(" ");
  return words
    .map((word) => TYPO_REPLACEMENTS[word] || word)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function prep(text = "") {
  return applyCommonCorrections(normalize(text));
}

function tokenize(text = "") {
  return prep(text).split(" ").filter(Boolean);
}

function unique(arr = []) {
  return [...new Set(arr.filter(Boolean))];
}

function buildResponse(parts = []) {
  return parts.filter(Boolean).join("\n\n").trim();
}

function includesWholePhrase(text = "", phrase = "") {
  const source = ` ${prep(text)} `;
  const target = ` ${prep(phrase)} `;
  return source.includes(target);
}

function levenshtein(a = "", b = "") {
  const s = String(a);
  const t = String(b);

  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  const curr = new Array(t.length + 1);

  for (let i = 1; i <= s.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= t.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[t.length];
}

function tokenApproxMatch(token = "", candidate = "") {
  const a = prep(token);
  const b = prep(candidate);

  if (!a || !b) return false;
  if (a === b) return true;

  const maxLen = Math.max(a.length, b.length);
  if (Math.abs(a.length - b.length) > 2) return false;

  if (maxLen <= 4) return levenshtein(a, b) <= 1;
  if (maxLen <= 8) return levenshtein(a, b) <= 2;
  return levenshtein(a, b) <= 2;
}

function phraseApproxMatch(text = "", phrase = "") {
  const textTokens = tokenize(text);
  const phraseTokens = tokenize(phrase);

  if (!textTokens.length || !phraseTokens.length) return false;
  if (includesWholePhrase(text, phrase)) return true;

  let matched = 0;
  for (const p of phraseTokens) {
    if (textTokens.some((t) => tokenApproxMatch(t, p))) {
      matched += 1;
    }
  }

  return matched === phraseTokens.length;
}

function strictSmallTalkIntent(text = "") {
  const prepared = prep(text);

  if (STRICT_SMALL_TALK.greetings.has(prepared)) return "greeting";
  if (STRICT_SMALL_TALK.thanks.has(prepared)) return "thanks";
  if (STRICT_SMALL_TALK.bye.has(prepared)) return "bye";
  if (STRICT_SMALL_TALK.affirm.has(prepared)) return "affirm";

  return null;
}

function cleanModelText(text = "") {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/^ecobot[:,]?\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripUndesiredLeadingGreeting(text = "") {
  return String(text)
    .replace(/^hola[^\n]*\n*/i, "")
    .replace(/^buenas[^\n]*\n*/i, "")
    .replace(/^buen dia[^\n]*\n*/i, "")
    .replace(/^buen día[^\n]*\n*/i, "")
    .trim();
}

function trimToSentenceBoundary(text = "", maxChars = NORMAL_REPLY_LIMIT) {
  const value = String(text || "").trim();
  if (!value) return "";

  if (value.length <= maxChars) return value;

  const slice = value.slice(0, maxChars);
  const lastBoundary = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf(".\n"),
    slice.lastIndexOf("!\n"),
    slice.lastIndexOf("?\n")
  );

  if (lastBoundary >= Math.floor(maxChars * 0.45)) {
    return slice.slice(0, lastBoundary + 1).trim();
  }

  return `${slice.trim()}...`;
}

function ensureCompleteEnding(text = "") {
  const value = String(text || "").trim();
  if (!value) return "";
  if (/[.!?]$/.test(value)) return value;
  return `${value}.`;
}

function safeAssistantText(text = "", maxChars = NORMAL_REPLY_LIMIT, allowLeadingGreeting = false) {
  let cleaned = cleanModelText(text);

  if (!allowLeadingGreeting) {
    cleaned = stripUndesiredLeadingGreeting(cleaned);
  }

  cleaned = cleaned
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  cleaned = trimToSentenceBoundary(cleaned, maxChars);
  cleaned = ensureCompleteEnding(cleaned);

  return cleaned;
}

function getSession(sessionKey) {
  cleanupMaps();

  const key = String(sessionKey || "global");
  const existing = chatMemory.get(key);

  if (!existing || Date.now() - existing.updatedAt > MEMORY_TTL_MS) {
    const fresh = {
      lastTopics: [],
      lastIntents: [],
      lastQuestion: "",
      lastRawQuestion: "",
      lastAnswer: "",
      updatedAt: Date.now(),
    };
    chatMemory.set(key, fresh);
    return fresh;
  }

  return existing;
}

function saveSession(sessionKey, data = {}) {
  const key = String(sessionKey || "global");
  const prev = getSession(key);

  chatMemory.set(key, {
    ...prev,
    ...data,
    updatedAt: Date.now(),
  });
}

function getCacheKey(role, message) {
  return `${role || "user"}::${prep(message || "")}`;
}

function getCachedAnswer(role, message) {
  cleanupMaps();

  const key = getCacheKey(role, message);
  const entry = answerCache.get(key);

  if (!entry) return null;
  if (Date.now() - entry.updatedAt > CACHE_TTL_MS) {
    answerCache.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedAnswer(role, message, value) {
  const key = getCacheKey(role, message);
  answerCache.set(key, {
    value,
    updatedAt: Date.now(),
  });
  cleanupMaps();
}

function scoreMatches(text = "", patterns = [], exactWeight = 3, approxWeight = 2) {
  let score = 0;

  for (const pattern of patterns) {
    if (includesWholePhrase(text, pattern)) {
      score += exactWeight;
    } else if (phraseApproxMatch(text, pattern)) {
      score += approxWeight;
    }
  }

  return score;
}

function isClarificationQuestion(text = "") {
  return scoreMatches(text, [
    "a que te refieres",
    "que quieres decir",
    "que significa eso",
    "o sea",
    "no entendi eso",
    "no entendi esa parte",
    "no te entendi",
    "no entendi",
  ], 3, 2) > 0;
}

function isShortFollowUp(text = "") {
  const prepared = prep(text);
  const tokens = tokenize(prepared).length;

  if (tokens > 7) return false;

  return scoreMatches(prepared, [
    "que es",
    "como funciona",
    "como funcionan",
    "como se hace",
    "como se sube",
    "como subirla",
    "como subirlo",
    "como lo subo",
    "como la subo",
    "como se adjunta",
    "como adjunto",
    "que formato",
    "que tipo de formato",
    "y si falla",
    "y donde lo veo",
    "y como lo hago",
  ], 3, 2) > 0;
}

function wantsCreateTicket(text = "") {
  return scoreMatches(text, INTENT_PATTERNS.create_ticket, 4, 2) > 0;
}

function detectIntents(text = "") {
  const scores = {};

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    scores[intent] = scoreMatches(text, patterns, intent === "create_ticket" ? 4 : 3, 2);
  }

  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  return ranked.map(([intent]) => intent);
}

function detectTopicsDirect(text = "") {
  const scores = {};

  for (const [topic, patterns] of Object.entries(TOPIC_PATTERNS)) {
    scores[topic] = scoreMatches(text, patterns, 3, 2);
  }

  // Reglas de prioridad contextual
  if (scoreMatches(text, ["evidencia", "evidencias", "subir evidencia", "evidencia rechazada"], 4, 3) > 0) {
    scores.evidences += 3;
  }

  if (scoreMatches(text, ["reporte", "reportes", "reporte bimestral", "horas bimestrales"], 4, 3) > 0) {
    scores.reports += 3;
  }

  if (scoreMatches(text, ["ticket", "tickets", "mis tickets", "seguimiento"], 4, 3) > 0) {
    scores.tickets += 3;
  }

  if (scoreMatches(text, ["actividad", "actividades", "inscribirme", "cupo"], 4, 3) > 0) {
    scores.activities += 3;
  }

  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return ranked;
}

function inferTopicsFromContext(text = "", session = null) {
  const lastTopics = session?.lastTopics || [];
  if (!lastTopics.length) return [];

  if (isClarificationQuestion(text) || isShortFollowUp(text)) {
    return lastTopics;
  }

  const prepared = prep(text);
  if (["y si falla", "y donde lo veo", "y como lo hago", "y como se hace"].includes(prepared)) {
    return lastTopics;
  }

  return [];
}

function detectTopicsWithContext(text = "", session = null) {
  const directTopics = detectTopicsDirect(text);
  if (directTopics.length) return directTopics;
  return inferTopicsFromContext(text, session);
}

function getSmallTalkResponse(message = "", session = null) {
  const prepared = prep(message);
  const intent = strictSmallTalkIntent(prepared);

  if (intent === "greeting") {
    if ((session?.lastTopics || []).length) {
      return "Hola. Estoy listo para ayudarte con EcoSteps.";
    }
    return "Hola. Estoy listo para ayudarte con EcoSteps.";
  }

  if (intent === "thanks") {
    return "Con gusto. Si necesitas algo más de EcoSteps, aquí estoy.";
  }

  if (intent === "bye") {
    return "De acuerdo. Cuando necesites ayuda con EcoSteps, aquí estaré.";
  }

  if (intent === "affirm") {
    return "Entendido.";
  }

  return null;
}

function getClarificationResponse(session = null) {
  const lastTopics = session?.lastTopics || [];
  const main = lastTopics[0];

  if (main === "tickets") {
    return "Me refiero a la sección de tickets, donde puedes reportar problemas, revisar respuestas y dar seguimiento dentro de EcoSteps.";
  }

  if (main === "reports") {
    return "Me refiero a la sección de reportes, donde subes o revisas tu reporte bimestral dentro de EcoSteps.";
  }

  if (main === "evidences") {
    return "Me refiero a la sección de evidencias, donde subes el archivo correspondiente a una actividad.";
  }

  if (main === "activities") {
    return "Me refiero a la sección de actividades, donde puedes ver opciones disponibles, cupos e inscripción.";
  }

  if (main === "dashboard") {
    return "Me refiero al Dashboard, que es tu panel principal dentro de EcoSteps.";
  }

  if (main === "progress") {
    return "Me refiero al progreso que puedes consultar dentro de EcoSteps, normalmente desde el Dashboard.";
  }

  return "Me refiero a la sección específica de EcoSteps de la que estamos hablando.";
}

function findFaqAnswer(message = "") {
  const prepared = prep(message);

  for (const item of FAQS) {
    for (const key of item.keys) {
      if (includesWholePhrase(prepared, key) || phraseApproxMatch(prepared, key)) {
        return item;
      }
    }
  }

  return null;
}

function getActivityResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("problem")) {
    parts.push(
      "Si no puedes inscribirte a una actividad, normalmente se debe a que ya no hay cupo, ya estás inscrito o la actividad fue cerrada. Si el comportamiento no coincide con eso, conviene crear un ticket."
    );
  }

  if (intents.includes("howto")) {
    parts.push(
      "Para inscribirte a una actividad, entra al Dashboard, localiza la actividad disponible y usa la opción de inscripción. Si sigue abierta y tiene cupos, deberías poder registrarte."
    );
  }

  if (intents.includes("status")) {
    parts.push(
      "Para revisar tu estado en una actividad, entra a la sección correspondiente y verifica si apareces como inscrito o si la actividad sigue disponible."
    );
  }

  if (intents.includes("explain")) {
    parts.push(
      "Las actividades forman parte de tu servicio social en EcoSteps. Desde el Dashboard puedes revisarlas, ver cupos e inscribirte si siguen abiertas."
    );
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte con actividades, inscripción y problemas de cupo dentro de EcoSteps.");
  }

  return buildResponse(unique(parts));
}

function getEvidenceResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("problem") && scoreMatches(text, ["rechazada", "rechazado", "rechazan"], 3, 2) > 0) {
    parts.push(
      "Si tu evidencia fue rechazada, revisa si hay observaciones del administrador y vuelve a subir una versión más clara, completa o correcta."
    );
  }

  if (intents.includes("problem") && scoreMatches(text, ["no aparece", "boton", "no veo el boton", "no me sale el boton"], 3, 2) > 0) {
    parts.push(
      "Si no aparece la opción para subir evidencia, normalmente es porque no estás en la sección correcta, no estás inscrito en la actividad o la evidencia ya fue aprobada."
    );
  }

  if (intents.includes("howto")) {
    parts.push(
      "Para subir una evidencia, entra al Dashboard, ve a 'Mis actividades', localiza la actividad correspondiente y usa la opción 'Subir evidencia'. Luego adjunta el archivo y envíalo."
    );
  }

  if (intents.includes("status")) {
    parts.push(
      "Para revisar el estado de tu evidencia, entra a la actividad correspondiente y verifica si aparece como pendiente, aprobada o rechazada."
    );
  }

  if (intents.includes("format")) {
    parts.push(
      "Sobre el formato exacto del archivo, no debo inventarlo. Lo correcto es revisar la validación visible al momento de subir la evidencia o crear un ticket si no aparece claramente."
    );
  }

  if (intents.includes("explain")) {
    parts.push(
      "Las evidencias son archivos que comprueban tu participación en una actividad. Normalmente su estado puede verse como pendiente, aprobada o rechazada."
    );
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte con evidencias, su estado o problemas al subirlas.");
  }

  return buildResponse(unique(parts));
}

function getReportResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("problem")) {
    parts.push(
      "Si tu reporte bimestral no aparece o no se refleja en tu avance, revisa primero si ya fue enviado o aprobado. Si el problema continúa, conviene crear un ticket."
    );
  }

  if (intents.includes("howto")) {
    parts.push(
      "Para subir tu reporte bimestral, entra al Dashboard, localiza la opción 'Subir reporte', adjunta el archivo correspondiente y envíalo para revisión."
    );
  }

  if (intents.includes("status")) {
    parts.push(
      "Puedes revisar el estado del reporte desde el Dashboard o desde la sección correspondiente, verificando si aparece como pendiente, aprobado o rechazado."
    );
  }

  if (intents.includes("format")) {
    parts.push(
      "Sobre el formato exacto del archivo, no debo inventarlo. Lo correcto es revisar la validación visible en la sección de reportes o reportarlo por ticket si no aparece."
    );
  }

  if (intents.includes("explain")) {
    parts.push(
      "Los reportes bimestrales sirven para registrar y validar tu avance dentro del servicio social. Cuando se revisan y aprueban, tu progreso en EcoSteps debería actualizarse."
    );
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte con reportes bimestrales, su carga, su estado o su relación con el progreso.");
  }

  return buildResponse(unique(parts));
}

function getTicketResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("create_ticket")) {
    parts.push(
      "Para crear un ticket, entra a 'Mis Tickets', agrega un asunto claro, describe el problema y envíalo. Si hace falta, también puedes adjuntar archivos."
    );
  }

  if (intents.includes("status") || scoreMatches(text, ["seguimiento", "dar seguimiento"], 3, 2) > 0) {
    parts.push(
      "El seguimiento de un ticket se hace desde su detalle. Ahí puedes revisar el estado, leer respuestas y enviar mensajes nuevos si necesitas agregar información."
    );
  }

  if (intents.includes("howto") && scoreMatches(text, ["adjuntar", "archivo", "como adjunto", "como adjuntar"], 3, 2) > 0) {
    parts.push(
      "Para adjuntar un archivo en un ticket, abre el detalle del ticket, escribe tu mensaje, selecciona el archivo y envíalo junto con la respuesta."
    );
  }

  if (intents.includes("explain")) {
    parts.push(
      "Los tickets sirven para reportar problemas o pedir soporte dentro de EcoSteps. Desde el detalle del ticket puedes revisar estado, respuestas y dar seguimiento."
    );
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte a crear tickets, darles seguimiento o adjuntar archivos.");
  }

  return buildResponse(unique(parts));
}

function getDashboardResponse(text, intents = []) {
  if (intents.includes("explain") || !intents.length) {
    return "El Dashboard es tu panel principal en EcoSteps. Desde ahí puedes ver actividades, subir reportes, revisar evidencias, consultar tu progreso y acceder a otras secciones importantes.";
  }

  return "El Dashboard es la pantalla principal de EcoSteps para gestionar actividades, evidencias, reportes y progreso.";
}

function getProgressResponse(text, intents = []) {
  if (intents.includes("status") || !intents.length) {
    return "Tu progreso se consulta desde el Dashboard. Ahí puedes revisar el avance general, reportes aprobados y, según la vista disponible, tus horas o actividades registradas.";
  }

  return "El progreso en EcoSteps se actualiza conforme se aprueban tus reportes y se validan tus actividades.";
}

function getFilesResponse(text, intents = [], topics = []) {
  if (topics.includes("tickets")) {
    return "Si tu duda es sobre archivos en tickets, abre el detalle del ticket, escribe tu mensaje y adjunta el archivo antes de enviarlo.";
  }

  if (topics.includes("reports")) {
    return "Si tu duda es sobre archivos para reportes, revisa la validación visible en esa sección. Si no aparece claramente, conviene reportarlo por ticket.";
  }

  if (topics.includes("evidences")) {
    return "Si tu duda es sobre archivos para evidencias, entra a 'Mis actividades' y usa 'Subir evidencia'. Si el formato no está claro, conviene levantar un ticket.";
  }

  return "Si tu duda es sobre archivos, depende de si estás trabajando en reportes, evidencias o tickets.";
}

function getPrimaryTopic(topics = [], intents = [], text = "") {
  if (!topics.length) return null;

  if (intents.includes("create_ticket")) return "tickets";

  const prepared = prep(text);

  if (scoreMatches(prepared, ["evidencia", "evidencias", "subir evidencia", "evidencia rechazada"], 4, 3) > 0) {
    return "evidences";
  }

  if (scoreMatches(prepared, ["reporte", "reportes", "reporte bimestral", "horas bimestrales"], 4, 3) > 0) {
    return "reports";
  }

  if (scoreMatches(prepared, ["ticket", "tickets", "mis tickets", "seguimiento"], 4, 3) > 0) {
    return "tickets";
  }

  if (scoreMatches(prepared, ["actividad", "actividades", "inscribirme", "cupo"], 4, 3) > 0) {
    return "activities";
  }

  return topics[0];
}

function getCombinedTopicResponse(text, intents = [], topics = []) {
  const primaryTopic = getPrimaryTopic(topics, intents, text);

  if (!primaryTopic) {
    return "Puedo ayudarte con actividades, evidencias, reportes, tickets, dashboard, progreso y uso general de EcoSteps.";
  }

  if (intents.includes("create_ticket") && primaryTopic !== "tickets") {
    const extras = [];

    if (topics.includes("reports") || primaryTopic === "reports") {
      extras.push("Si el problema está relacionado con tu reporte bimestral o con el avance que debería reflejarse, sí conviene crear un ticket.");
    } else if (topics.includes("progress") || primaryTopic === "progress") {
      extras.push("Si tus horas o tu avance no se reflejan correctamente, sí conviene crear un ticket.");
    } else {
      extras.push("Sí conviene crear un ticket para reportar ese problema dentro de EcoSteps.");
    }

    extras.push(
      "Para crearlo, entra a 'Mis Tickets', agrega un asunto claro, describe el problema y envíalo."
    );

    return buildResponse(extras);
  }

  if (primaryTopic === "activities") return getActivityResponse(text, intents);
  if (primaryTopic === "evidences") return getEvidenceResponse(text, intents);
  if (primaryTopic === "reports") return getReportResponse(text, intents);
  if (primaryTopic === "tickets") return getTicketResponse(text, intents);
  if (primaryTopic === "dashboard") return getDashboardResponse(text, intents);
  if (primaryTopic === "progress") return getProgressResponse(text, intents);
  if (primaryTopic === "files") return getFilesResponse(text, intents, topics);

  return "Puedo ayudarte con actividades, evidencias, reportes, tickets, dashboard y progreso en EcoSteps.";
}

function isEcoStepsQuestion(message = "") {
  const prepared = prep(message);

  if (strictSmallTalkIntent(prepared)) return true;
  if (findFaqAnswer(prepared)) return true;

  const topicHits = detectTopicsDirect(prepared);
  if (topicHits.length) return true;

  if (includesWholePhrase(prepared, "ecosteps")) return true;

  return false;
}

function getDictionaryAnswer(message = "", session = null) {
  const prepared = prep(message);
  if (!prepared) return null;

  const smallTalk = getSmallTalkResponse(prepared, session);
  if (smallTalk) {
    return {
      answer: safeAssistantText(smallTalk, SIMPLE_REPLY_LIMIT, true),
      topic: null,
      intents: [],
      source: "smalltalk",
    };
  }

  if (isClarificationQuestion(prepared)) {
    return {
      answer: safeAssistantText(getClarificationResponse(session)),
      topic: session?.lastTopics?.[0] || null,
      intents: ["clarification"],
      source: "dictionary",
    };
  }

  const faq = findFaqAnswer(prepared);
  if (faq) {
    return {
      answer: safeAssistantText(faq.answer),
      topic: faq.topic || null,
      intents: ["faq"],
      source: "dictionary",
    };
  }

  let intents = detectIntents(prepared);
  let topics = detectTopicsWithContext(prepared, session);

  if (!topics.length && isShortFollowUp(prepared)) {
    topics = session?.lastTopics || [];
  }

  if (!intents.length && topics.length) {
    if (scoreMatches(prepared, ["que es", "como funciona", "para que sirve"], 3, 2) > 0) {
      intents = ["explain"];
    } else if (scoreMatches(prepared, ["no me deja", "rechazada", "no aparece", "no se refleja"], 3, 2) > 0) {
      intents = ["problem"];
    } else if (scoreMatches(prepared, ["como", "subir", "adjuntar", "inscribirme"], 2, 1) > 0) {
      intents = ["howto"];
    } else if (scoreMatches(prepared, ["estado", "donde veo", "seguimiento"], 3, 2) > 0) {
      intents = ["status"];
    }
  }

  if (!topics.length) return null;

  const answer = getCombinedTopicResponse(prepared, intents, topics);
  return {
    answer: safeAssistantText(answer),
    topic: getPrimaryTopic(topics, intents, prepared),
    intents,
    source: "dictionary",
  };
}

function getLocalFallbackAnswer(message = "", session = null) {
  const local = getDictionaryAnswer(message, session);
  if (local?.answer) return local.answer;

  if (!isEcoStepsQuestion(message)) {
    return OUT_OF_SCOPE_RESPONSE;
  }

  return "Puedo ayudarte con actividades, evidencias, reportes, tickets, dashboard, progreso y uso general de EcoSteps. Escribe tu duda con un poco más de detalle y te respondo con más precisión.";
}

function shouldPreferAI(message = "", intents = [], topics = []) {
  const prepared = prep(message);
  const words = tokenize(prepared).length;

  if (strictSmallTalkIntent(prepared)) return false;
  if (findFaqAnswer(prepared)) return false;
  if (words <= 10 && topics.length <= 1) return false;

  if (words >= 12) return true;
  if (topics.length >= 2) return true;

  if (
    scoreMatches(prepared, [
      "explicame completo",
      "explicame paso a paso",
      "flujo",
      "proceso completo",
      "como se relacionan",
      "analiza",
      "de forma completa",
    ], 3, 2) > 0
  ) {
    return true;
  }

  return false;
}

async function askOllama({
  model,
  userContext,
  timeoutMs = 30000,
}) {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content: ECOBOT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userContext,
          },
        ],
        options: {
          temperature: 0.2,
          num_predict: 560,
          top_k: 40,
          top_p: 0.9,
          repeat_penalty: 1.12,
        },
      }),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      throw new Error(`OLLAMA_HTTP_${response.status} ${raw}`.trim());
    }

    const data = await response.json();
    const content = data?.message?.content || "";

    if (!content || !String(content).trim()) {
      throw new Error("OLLAMA_EMPTY_RESPONSE");
    }

    return safeAssistantText(content, MODEL_MAX_CHARS, false);
  } finally {
    clearTimeout(timeout);
  }
}

async function askEcoBot({
  message,
  role = "user",
  userName = "Usuario",
  sessionKey = "global",
}) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("La pregunta es obligatoria.");
  }

  const session = getSession(sessionKey);
  const prepared = prep(cleanMessage);

  const smallTalk = getSmallTalkResponse(prepared, session);
  if (smallTalk) {
    const result = {
      answer: safeAssistantText(smallTalk, SIMPLE_REPLY_LIMIT, true),
      source: "smalltalk",
    };

    saveSession(sessionKey, {
      lastQuestion: prepared,
      lastRawQuestion: cleanMessage,
      lastAnswer: result.answer,
    });

    setCachedAnswer(role, cleanMessage, result);
    return result;
  }

  if (!isEcoStepsQuestion(cleanMessage)) {
    const result = {
      answer: OUT_OF_SCOPE_RESPONSE,
      source: "guardrail",
    };

    saveSession(sessionKey, {
      lastQuestion: prepared,
      lastRawQuestion: cleanMessage,
      lastAnswer: result.answer,
    });

    return result;
  }

  const cached = getCachedAnswer(role, cleanMessage);
  if (cached) {
    return { ...cached, source: `${cached.source || "cache"}_cache` };
  }

  const local = getDictionaryAnswer(cleanMessage, session);

  let topics = detectTopicsWithContext(prepared, session);
  let intents = detectIntents(prepared);

  if (local?.topic && !topics.length) {
    topics = [local.topic];
  }

  if (local?.intents?.length && !intents.length) {
    intents = local.intents;
  }

  if (!topics.length && isShortFollowUp(prepared)) {
    topics = session.lastTopics || [];
  }

  if (local?.answer && !shouldPreferAI(cleanMessage, intents, topics)) {
    const result = {
      answer: local.answer,
      source: local.source || "dictionary",
    };

    saveSession(sessionKey, {
      lastTopics: local.topic ? [local.topic] : topics,
      lastIntents: intents,
      lastQuestion: prepared,
      lastRawQuestion: cleanMessage,
      lastAnswer: result.answer,
    });

    setCachedAnswer(role, cleanMessage, result);
    return result;
  }

  const model = process.env.OLLAMA_MODEL || "phi3:mini";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 30000);

  const compactContext = `
Usuario: ${userName}
Rol: ${role}
Tema principal: ${(topics[0] || local?.topic || session.lastTopics?.[0] || "ninguno")}
Temas recientes: ${(topics.length ? topics.join(", ") : (session.lastTopics || []).join(", ")) || "ninguno"}
Intenciones detectadas: ${(intents.length ? intents.join(", ") : (session.lastIntents || []).join(", ")) || "ninguna"}
Pregunta anterior: ${session.lastRawQuestion || "ninguna"}
Última respuesta dada: ${session.lastAnswer || "ninguna"}
Pregunta actual: ${cleanMessage}

Instrucción adicional:
- Responde directo a la pregunta actual.
- No saludes.
- No mezcles módulos que no vienen al caso.
- Si la pregunta es sobre actividades, no hables de reportes.
- Si la pregunta es sobre evidencias, no hables de tickets salvo que sea útil por un problema.
- Si la pregunta es sobre tickets, responde sobre tickets.
- No inventes funciones.
- Mantente en EcoSteps.
`.trim();

  try {
    const answer = await askOllama({
      model,
      userContext: compactContext,
      timeoutMs,
    });

    const result = { answer, source: "ollama" };

    saveSession(sessionKey, {
      lastTopics: topics.length ? topics : session.lastTopics || [],
      lastIntents: intents.length ? intents : session.lastIntents || [],
      lastQuestion: prepared,
      lastRawQuestion: cleanMessage,
      lastAnswer: result.answer,
    });

    setCachedAnswer(role, cleanMessage, result);
    return result;
  } catch {
    const fallbackAnswer = local?.answer || getLocalFallbackAnswer(cleanMessage, session);
    const result = {
      answer: fallbackAnswer,
      source: "fallback",
    };

    saveSession(sessionKey, {
      lastTopics: local?.topic ? [local.topic] : topics,
      lastIntents: intents,
      lastQuestion: prepared,
      lastRawQuestion: cleanMessage,
      lastAnswer: result.answer,
    });

    setCachedAnswer(role, cleanMessage, result);
    return result;
  }
}

module.exports = {
  askEcoBot,
  getDictionaryAnswer,
  getLocalFallbackAnswer,
  isEcoStepsQuestion,
};