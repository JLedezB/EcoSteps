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

Reglas:
1. Responde siempre en español.
2. Sé claro, profesional, amable y natural.
3. Máximo 10 líneas.
4. Si la pregunta no es sobre EcoSteps, responde exactamente:
"Solo puedo ayudarte con temas de EcoSteps, como actividades, evidencias, reportes, tickets y uso de la plataforma."
5. No inventes funciones que no existan.
6. Si no conoces un formato exacto de archivo, dilo con honestidad y orienta al usuario sin inventar.
7. Si el usuario quiere crear un ticket, prioriza esa intención sobre las demás.
8. Si el usuario reporta un problema técnico, oriéntalo y sugiere crear un ticket si aplica.
`;

const chatMemory = new Map();
const MEMORY_TTL_MS = 1000 * 60 * 20;

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
  return text
    .replace(/\bsirtve\b/g, "sirve")
    .replace(/\bubirla\b/g, "subirla")
    .replace(/\bubirlo\b/g, "subirlo")
    .replace(/\bsubr\b/g, "subir")
    .replace(/\bbimesttal\b/g, "bimestral")
    .replace(/\bbimesttral\b/g, "bimestral")
    .replace(/\bbimestrtal\b/g, "bimestral")
    .replace(/\bactivdad\b/g, "actividad")
    .replace(/\bevidnencia\b/g, "evidencia")
    .replace(/\brepote\b/g, "reporte")
    .replace(/\bosea\b/g, "o sea")
    .replace(/\bcomo asi\b/g, "a que te refieres")
    .replace(/\bgenerame\b/g, "generar")
    .replace(/\bhazme\b/g, "hacerme")
    .replace(/\bcreame\b/g, "crear")
    .replace(/\blevantame\b/g, "levantar");
}

function prep(text = "") {
  return applyCommonCorrections(normalize(text));
}

function includesAny(text, list = []) {
  return list.some((item) => text.includes(item));
}

function unique(arr = []) {
  return [...new Set(arr)];
}

function buildResponse(parts = []) {
  return parts.filter(Boolean).join("\n\n").trim();
}

function getSession(sessionKey) {
  const key = String(sessionKey || "global");
  const existing = chatMemory.get(key);

  if (!existing || Date.now() - existing.updatedAt > MEMORY_TTL_MS) {
    const initial = {
      lastTopics: [],
      lastIntents: [],
      lastQuestion: "",
      lastRawQuestion: "",
      updatedAt: Date.now(),
    };
    chatMemory.set(key, initial);
    return initial;
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

function isClarificationQuestion(text = "") {
  return includesAny(text, [
    "a que te refieres",
    "que quieres decir",
    "que significa eso",
    "o sea",
    "no entendi eso",
    "no entendi esa parte",
  ]);
}

function isShortFollowUp(text = "") {
  return includesAny(text, [
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
    "como se adjunta un archivo",
    "como adjunto",
    "como adjuntar",
    "no me deja subirla",
    "no me deja subirlo",
    "no me deja",
    "y si falla",
    "y si no me deja",
    "y donde lo veo",
    "y donde la veo",
    "que formato",
    "que tipo de formato",
    "que archivos acepta",
    "que tipo acepta",
    "que pasa si la rechazan",
    "que pasa si lo rechazan",
  ]);
}

function wantsCreateTicket(text = "") {
  return includesAny(text, [
    "crear ticket",
    "crea ticket",
    "creame un ticket",
    "generar ticket",
    "generame un ticket",
    "hazme un ticket",
    "hacerme un ticket",
    "levantar ticket",
    "levantame un ticket",
    "quiero crear un ticket",
    "quiero levantar un ticket",
    "necesito un ticket",
    "abre un ticket",
    "abrir ticket",
    "genera un ticket",
    "genera ticket",
    "ticket para mi situacion",
    "ticket para mi situación",
  ]);
}

function detectIntents(text = "") {
  const intents = [];

  if (wantsCreateTicket(text)) intents.push("create_ticket");

  if (
    includesAny(text, [
      "que es",
      "para que sirve",
      "que significa",
      "explicame",
      "explica",
      "entender",
      "como funciona",
      "como funcionan",
      "dime que es",
    ])
  ) {
    intents.push("explain");
  }

  if (
    includesAny(text, [
      "como",
      "como hago",
      "como se hace",
      "como puedo",
      "como le hago",
      "quiero subir",
      "quiero inscribirme",
      "quiero crear",
      "quiero ver",
      "ayudame a subir",
      "ayudame a crear",
      "ayudame a ver",
      "dime como",
      "como se sube",
      "como subirla",
      "como subirlo",
      "como se adjunta",
      "como adjunto",
      "como adjuntar",
    ])
  ) {
    intents.push("howto");
  }

  if (
    includesAny(text, [
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
      "falla el sistema",
      "no se refleja",
      "no me refleja",
      "no aparecen",
      "no aparece",
    ])
  ) {
    intents.push("problem");
  }

  if (
    includesAny(text, [
      "donde veo",
      "como veo",
      "donde encuentro",
      "como reviso",
      "como saber",
      "ver estado",
      "estado",
      "seguimiento",
      "dar seguimiento",
      "aprobado",
      "aprobada",
      "pendiente",
    ])
  ) {
    intents.push("status");
  }

  if (
    includesAny(text, [
      "archivo",
      "archivos",
      "formato",
      "formatos",
      "tipo de archivo",
      "tipos de archivo",
      "extensiones",
      "que tipo acepta",
      "que formato acepta",
      "que archivos acepta",
      "que tipo de formato",
    ])
  ) {
    intents.push("format");
  }

  return unique(intents);
}

function detectTopicsDirect(text = "") {
  const topics = [];

  if (
    includesAny(text, [
      "actividad",
      "actividades",
      "inscribirme",
      "inscribir",
      "unirme",
      "anotarme",
      "cupo",
      "inscribirme a una actividad",
    ])
  ) {
    topics.push("activities");
  }

  if (
    includesAny(text, [
      "evidencia",
      "evidencias",
      "subir evidencia",
      "adjuntar evidencia",
      "evidencia rechazada",
      "boton de evidencia",
      "boton para subir evidencia",
    ])
  ) {
    topics.push("evidences");
  }

  if (
    includesAny(text, [
      "reporte",
      "reportes",
      "reporte bimestral",
      "reportes bimestrales",
      "subir reporte",
      "adjuntar reporte",
      "bimestral",
      "horas bimestrales",
      "horas del bimestre",
    ])
  ) {
    topics.push("reports");
  }

  if (
    includesAny(text, [
      "ticket",
      "tickets",
      "soporte",
      "incidencia",
      "problema tecnico",
      "ayuda tecnica",
      "reportar problema",
    ])
  ) {
    topics.push("tickets");
  }

  if (
    includesAny(text, [
      "dashboard",
      "panel",
      "tablero",
      "pantalla principal",
      "inicio",
    ])
  ) {
    topics.push("dashboard");
  }

  if (
    includesAny(text, [
      "progreso",
      "avance",
      "horas",
      "servicio social",
      "mis horas",
      "horas bimestrales",
    ])
  ) {
    topics.push("progress");
  }

  if (
    includesAny(text, [
      "archivo",
      "archivos",
      "carga de archivos",
      "subir archivo",
      "adjuntar archivo",
      "cargar archivo",
      "formato",
      "formatos",
    ])
  ) {
    topics.push("files");
  }

  return unique(topics);
}

function inferTopicsFromContext(text = "", session = null) {
  const lastTopics = session?.lastTopics || [];
  if (!lastTopics.length) return [];

  if (isShortFollowUp(text) || isClarificationQuestion(text)) {
    return lastTopics;
  }

  if (includesAny(text, ["seguimiento"]) && lastTopics.includes("tickets")) {
    return ["tickets"];
  }

  return [];
}

function detectTopicsWithContext(text = "", session = null) {
  const directTopics = detectTopicsDirect(text);
  if (directTopics.length) return directTopics;
  return inferTopicsFromContext(text, session);
}

function getClarificationResponse(session = null) {
  const lastTopics = session?.lastTopics || [];

  if (lastTopics.includes("tickets")) {
    return "Me refiero a la sección de tickets, es decir, al apartado donde reportas problemas, recibes respuesta y das seguimiento al soporte dentro de EcoSteps.";
  }

  if (lastTopics.includes("reports")) {
    return "Me refiero a la sección de reportes dentro de EcoSteps, es decir, al apartado donde intentas adjuntar o enviar tu reporte bimestral.";
  }

  if (lastTopics.includes("evidences")) {
    return "Me refiero a la sección de evidencias, es decir, al apartado donde intentas subir el archivo de una actividad.";
  }

  return "Me refiero a la parte específica de EcoSteps donde estás intentando realizar la acción, por ejemplo reportes, evidencias o tickets. Si me dices cuál estás usando, te doy la guía exacta.";
}

function buildTicketCreationResponse(text = "", topics = []) {
  const hasProgress = topics.includes("progress");
  const hasReports = topics.includes("reports");

  if (hasProgress && hasReports) {
    return "Entendido. Ese caso sí conviene reportarlo por ticket, porque el problema parece estar relacionado con el reflejo de tus horas o el avance después del reporte bimestral. Puedes usar el botón de crear ticket con esta información para enviarlo directamente.";
  }

  if (hasProgress) {
    return "Entendido. Si tus horas o tu avance no se están reflejando correctamente, sí conviene levantar un ticket para revisión. Puedes usar el botón de crear ticket con esta información para reportarlo.";
  }

  if (hasReports) {
    return "Entendido. Si tu problema está relacionado con reportes bimestrales, sí conviene levantar un ticket para revisión. Puedes usar el botón de crear ticket con esta información para enviarlo directamente.";
  }

  return "Entendido. Si quieres reportar ese problema, sí conviene crear un ticket. Puedes usar el botón de crear ticket con esta información para enviarlo directamente.";
}

function getActivityResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("explain")) {
    parts.push("Las actividades son parte de tu servicio social dentro de EcoSteps. Desde el Dashboard puedes ver actividades disponibles, revisar sus cupos e inscribirte en las que correspondan.");
  }

  if (intents.includes("howto")) {
    parts.push("Para inscribirte a una actividad, entra a tu Dashboard, ve a la pestaña 'Todas', localiza la actividad disponible y presiona 'Inscribirme'.");
  }

  if (intents.includes("problem")) {
    parts.push("Si no puedes inscribirte a una actividad, normalmente ocurre porque ya no hay cupo, ya estás inscrito o la actividad fue cerrada. Si revisas eso y el problema sigue, te recomiendo crear un ticket.");
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte a entender qué son las actividades, cómo inscribirte o qué hacer si el sistema no te permite continuar.");
  }

  return buildResponse(unique(parts));
}

function getEvidenceResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("explain")) {
    parts.push("Las evidencias son los archivos que subes para comprobar tu participación o avance en una actividad. Su estado puede ser pendiente, aprobada o rechazada según la revisión del administrador.");
  }

  if (intents.includes("howto")) {
    parts.push("Para subir una evidencia, entra al Dashboard, cambia a la vista de 'Mis actividades', localiza la actividad correspondiente y presiona 'Subir evidencia'. Después selecciona el archivo y envíalo.");
  }

  if (intents.includes("problem") && includesAny(text, ["rechazada", "rechazado", "rechazan"])) {
    parts.push("Si tu evidencia fue rechazada, revisa si el sistema muestra algún comentario del administrador, corrige el archivo y vuelve a subir una evidencia más clara y relacionada con la actividad correcta.");
  }

  if (
    intents.includes("problem") &&
    includesAny(text, ["no aparece", "boton", "no veo el boton", "no me sale el boton"])
  ) {
    parts.push("Si no aparece el botón para subir evidencia, normalmente se debe a que no estás en 'Mis actividades', no estás inscrito en esa actividad o la evidencia ya fue aprobada. Si nada de eso aplica en tu caso, te recomiendo crear un ticket.");
  }

  if (intents.includes("status")) {
    parts.push("Para revisar el estado de tu evidencia, entra a 'Mis actividades' y consulta la sección de evidencias de la actividad correspondiente. Ahí podrás ver si se encuentra pendiente, aprobada o rechazada.");
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte a entender qué es una evidencia, cómo subirla o qué hacer si fue rechazada.");
  }

  return buildResponse(unique(parts));
}

function getReportResponse(text, intents = []) {
  const parts = [];

  if (intents.includes("explain")) {
    parts.push("Los reportes bimestrales son los archivos que entregas para registrar y validar tu avance dentro del servicio social. Cuando el administrador los aprueba, ese avance se refleja en tu progreso dentro de EcoSteps.");
  }

  if (intents.includes("howto")) {
    parts.push("Para subir tu reporte bimestral, entra al Dashboard, selecciona la opción 'Subir reporte', adjunta el archivo correspondiente y envíalo. Una vez que sea aprobado por el administrador, tu progreso se actualizará dentro de la plataforma.");
  }

  if (intents.includes("problem")) {
    parts.push("Si no puedes subir tu reporte o no se refleja correctamente en tu avance, revisa primero si el reporte ya fue aprobado. Si el problema continúa, lo mejor es crear un ticket para que puedan revisarlo con más detalle.");
  }

  if (intents.includes("status")) {
    parts.push("Puedes revisar si tu reporte fue aprobado desde el Dashboard, observando tu progreso general o el contador de reportes aprobados. Si no ves cambios, es probable que siga pendiente o que haya sido rechazado.");
  }

  if (intents.includes("format")) {
    parts.push("Sobre el formato exacto del archivo, no debo inventarlo si no está indicado por el sistema. Lo más seguro es revisar el mensaje que aparece al intentar cargar el archivo o la validación visible en la sección de reportes. Si el sistema no lo muestra claramente, conviene crear un ticket para confirmarlo.");
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte a entender qué es un reporte bimestral, cómo subirlo o qué hacer si el sistema no te deja cargarlo.");
  }

  return buildResponse(unique(parts));
}

function getTicketResponse(text, intents = []) {
  const parts = [];
  const wantsFollowUp = includesAny(text, [
    "seguimiento",
    "dar seguimiento",
    "como funcionan",
    "como funciona",
  ]);

  if (intents.includes("explain") || wantsFollowUp) {
    parts.push("Los tickets sirven para reportar problemas o solicitar soporte dentro de EcoSteps. Una vez creado el ticket, puedes entrar a su detalle para revisar respuestas, enviar nuevos mensajes y dar seguimiento al caso.");
  }

  if (intents.includes("howto") && !includesAny(text, ["adjunta", "adjuntar", "archivo"])) {
    parts.push("Para crear un ticket, entra a 'Mis Tickets', escribe un asunto claro, agrega una descripción detallada del problema y, si aplica, vincúlalo a una actividad. Después podrás darle seguimiento desde el detalle del ticket.");
  }

  if (intents.includes("status") || wantsFollowUp) {
    parts.push("El seguimiento del ticket se realiza desde su detalle. Ahí puedes ver el historial de mensajes, revisar el estado del ticket y responder cuando sea necesario.");
  }

  if (includesAny(text, ["archivo", "adjuntar", "subir archivo", "como se adjunta", "como adjunto"])) {
    parts.push("Para adjuntar un archivo en un ticket, abre el detalle del ticket, escribe tu mensaje, selecciona el archivo permitido y envíalo. Así puedes compartir capturas o documentos relacionados con tu problema.");
  }

  if (!parts.length) {
    parts.push("Puedo ayudarte a crear tickets, revisar cómo funcionan, darles seguimiento o adjuntar archivos dentro del soporte.");
  }

  return buildResponse(unique(parts));
}

function getDashboardResponse(text, intents = []) {
  if (intents.includes("explain") || includesAny(text, ["para que sirve", "que es", "entender"])) {
    return "El Dashboard es tu panel principal dentro de EcoSteps. Desde ahí puedes ver actividades, subir reportes, revisar evidencias, consultar tu progreso y acceder a otras secciones importantes de la plataforma.";
  }

  return "El Dashboard es la pantalla principal de EcoSteps. Desde ahí puedes gestionar tus actividades, tus reportes, tus evidencias y revisar tu progreso general.";
}

function getProgressResponse(text, intents = []) {
  if (intents.includes("status") || includesAny(text, ["cuantas horas", "cuanto avance", "quiero ver", "mis horas"])) {
    return "Tu progreso se consulta desde el Dashboard. Ahí puedes revisar tus reportes aprobados, tus actividades registradas y el avance general de tu servicio social. Si tus horas no se reflejan, puede ser porque el proceso siga pendiente o requiera revisión.";
  }

  return "El progreso dentro de EcoSteps se actualiza conforme se aprueban tus reportes y se reflejan tus actividades. Si aún no ves cambios, puede ser porque todavía está pendiente la validación correspondiente.";
}

function getFilesResponse(text, intents = [], topics = []) {
  if (topics.includes("tickets")) {
    return "Si tu duda es sobre archivos en tickets, debes abrir el detalle del ticket, escribir tu mensaje y adjuntar el archivo antes de enviarlo.";
  }

  if (topics.includes("reports")) {
    return "Si tu duda es sobre archivos para reportes, el formato exacto depende de la validación configurada en esa sección. Lo recomendable es revisar el mensaje que aparezca al intentar subir el archivo. Si el sistema no indica claramente qué formato acepta, conviene reportarlo por ticket.";
  }

  if (topics.includes("evidences")) {
    return "Si tu duda es sobre archivos para evidencias, entra a 'Mis actividades' y usa la opción de 'Subir evidencia'. Si el sistema rechaza el archivo y no muestra el formato permitido, te recomiendo levantar un ticket para validarlo.";
  }

  return "Si tu duda es sobre carga o formato de archivos, el detalle depende de la sección donde estés trabajando: reportes, evidencias o tickets.";
}

function selectPrimaryTopics(text = "", topics = [], intents = []) {
  if (!topics.length) return [];

  if (intents.includes("create_ticket")) {
    const out = ["tickets"];
    if (topics.includes("reports")) out.push("reports");
    if (topics.includes("progress")) out.push("progress");
    return unique(out);
  }

  if (topics.includes("tickets") && includesAny(text, ["seguimiento", "dar seguimiento", "como funcionan"])) {
    return ["tickets"];
  }

  if (topics.includes("tickets") && topics.includes("files") && includesAny(text, ["adjunta", "adjuntar", "archivo"])) {
    return ["tickets"];
  }

  if (topics.includes("reports") && topics.includes("tickets") && includesAny(text, ["seguimiento", "tickets"])) {
    return ["tickets", "reports"];
  }

  return topics;
}

function getCombinedTopicResponses(text, intents = [], topics = []) {
  const selectedTopics = selectPrimaryTopics(text, topics, intents);
  const responses = [];
  const hasReports = selectedTopics.includes("reports");
  const hasEvidences = selectedTopics.includes("evidences");

  if (intents.includes("create_ticket")) {
    responses.push(buildTicketCreationResponse(text, selectedTopics));
    return unique(responses);
  }

  for (const topic of selectedTopics) {
    if (topic === "activities") responses.push(getActivityResponse(text, intents));
    if (topic === "evidences") responses.push(getEvidenceResponse(text, intents));
    if (topic === "reports") responses.push(getReportResponse(text, intents));
    if (topic === "tickets") responses.push(getTicketResponse(text, intents));
    if (topic === "dashboard") responses.push(getDashboardResponse(text, intents));
    if (topic === "progress") responses.push(getProgressResponse(text, intents));

    if (topic === "files" && !(hasReports && intents.includes("format")) && !(hasEvidences && intents.includes("format"))) {
      responses.push(getFilesResponse(text, intents, selectedTopics));
    }
  }

  return unique(responses);
}

function isEcoStepsQuestion(message = "") {
  const text = prep(message);

  const keywords = [
    "ecosteps",
    "actividad",
    "actividades",
    "inscrib",
    "cupo",
    "evidencia",
    "evidencias",
    "reporte",
    "reportes",
    "reporte bimestral",
    "ticket",
    "tickets",
    "dashboard",
    "progreso",
    "servicio social",
    "adjuntar",
    "archivo",
    "admin",
    "usuario",
    "mis actividades",
    "mis tickets",
    "aprobada",
    "rechazada",
    "pendiente",
    "boton",
    "subir",
    "panel",
    "soporte",
    "incidencia",
    "horas",
    "avance",
    "carga de archivos",
    "formato",
    "seguimiento",
  ];

  return keywords.some((word) => text.includes(word));
}

function shouldUseDictionary(message = "", session = null) {
  const text = prep(message);
  const wordCount = text.split(" ").filter(Boolean).length;
  const lastTopics = session?.lastTopics || [];

  const exactFaqs = [
    "que es ecosteps",
    "para que sirve ecosteps",
    "que son las actividades",
    "que es una actividad",
    "que es una evidencia",
    "que son las evidencias",
    "que es un reporte",
    "que es un reporte bimestral",
    "que son los reportes bimestrales",
    "que es un ticket",
    "que son los tickets",
    "que es el dashboard",
    "como subir evidencia",
    "como subir una evidencia",
    "como subir reporte",
    "como subir un reporte",
    "como crear un ticket",
    "como dar seguimiento a un ticket",
    "donde veo mi progreso",
    "como ver mi progreso",
  ];

  if (exactFaqs.includes(text)) return true;
  if (text === "que es" && lastTopics.length) return true;
  if (isClarificationQuestion(text)) return true;
  if (isShortFollowUp(text) && wordCount <= 6 && lastTopics.length) return true;
  if (wantsCreateTicket(text) && wordCount <= 10) return true;

  return false;
}

function getDictionaryAnswer(message = "", session = null) {
  const text = prep(message);
  if (!text) return null;

  if (isClarificationQuestion(text)) {
    return getClarificationResponse(session);
  }

  if (
    includesAny(text, [
      "que es ecosteps",
      "que es eco steps",
      "para que sirve ecosteps",
      "para que sirve eco steps",
      "que hace ecosteps",
      "de que trata ecosteps",
      "que puedo hacer en ecosteps",
    ])
  ) {
    return "EcoSteps es la plataforma donde puedes gestionar tu servicio social. Desde aquí puedes inscribirte a actividades, subir evidencias, enviar reportes bimestrales, consultar tu progreso y crear tickets de soporte cuando necesites ayuda.";
  }

  let intents = detectIntents(text);
  let topics = detectTopicsWithContext(text, session);

  if (!topics.length && (isShortFollowUp(text) || text === "que es")) {
    topics = session?.lastTopics || [];
  }

  if (!intents.length && text === "que es" && topics.length) intents = ["explain"];
  if (!intents.length && includesAny(text, ["no me deja subirla", "no me deja subirlo", "no me deja"]) && topics.length) intents = ["problem"];
  if (!intents.length && includesAny(text, ["como se sube", "como subirla", "como subirlo", "como se adjunta un archivo", "como adjunto"]) && topics.length) intents = ["howto"];
  if (!intents.length && includesAny(text, ["como funciona", "como funcionan"]) && topics.length) intents = ["explain"];

  if (!topics.length) return null;

  const topicResponses = getCombinedTopicResponses(text, intents, topics);
  if (!topicResponses.length) return null;

  if (topicResponses.length === 1) return topicResponses[0];

  return buildResponse([
    "Claro. Te explico cada parte por separado:",
    ...topicResponses.map((item, idx) => `${idx + 1}. ${item}`),
  ]);
}

function getLocalFallbackAnswer(message = "", session = null) {
  const text = prep(message);

  if (isClarificationQuestion(text)) {
    return getClarificationResponse(session);
  }

  let intents = detectIntents(text);
  let topics = detectTopicsWithContext(text, session);

  if (!topics.length && (isShortFollowUp(text) || text === "que es")) {
    topics = session?.lastTopics || [];
  }

  if (!intents.length && text === "que es" && topics.length) intents = ["explain"];
  if (!intents.length && includesAny(text, ["no me deja subirla", "no me deja subirlo", "no me deja"]) && topics.length) intents = ["problem"];
  if (!intents.length && includesAny(text, ["como se sube", "como subirla", "como subirlo", "como se adjunta un archivo", "como adjunto"]) && topics.length) intents = ["howto"];
  if (!intents.length && includesAny(text, ["como funciona", "como funcionan"]) && topics.length) intents = ["explain"];

  if (topics.length) {
    const responses = getCombinedTopicResponses(text, intents, topics);
    if (responses.length === 1) return responses[0];
    if (responses.length > 1) {
      return buildResponse([
        "Claro. Te explico cada parte por separado:",
        ...responses.map((item, idx) => `${idx + 1}. ${item}`),
      ]);
    }
  }

  return "Puedo ayudarte con actividades, evidencias, reportes, tickets, dashboard, progreso y uso general de EcoSteps. Intenta escribir tu duda con un poco más de detalle.";
}

function trimToMaxLines(text = "", maxLines = 10) {
  const lines = String(text).split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, maxLines).join("\n");
}

function safeAssistantText(text = "") {
  return trimToMaxLines(
    String(text || "")
      .replace(/\r/g, "")
      .trim(),
    10
  );
}

async function askOllama({
  model,
  userContext,
  timeoutMs = 90000,
}) {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log("[ECOBOT] Intentando usar Ollama...");
    console.log("[ECOBOT] URL:", `${baseUrl}/api/chat`);
    console.log("[ECOBOT] Modelo:", model);
    console.log("[ECOBOT] Timeout:", timeoutMs);

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
          temperature: 0.3,
          num_predict: 220,
        },
      }),
    });

    console.log("[ECOBOT] Status Ollama:", response.status);

    if (!response.ok) {
      const raw = await response.text();
      console.error("[ECOBOT] Error HTTP Ollama:", raw);
      throw new Error(`OLLAMA_HTTP_${response.status}`);
    }

    const data = await response.json();
    console.log("[ECOBOT] Respuesta cruda Ollama:", data);

    const content = data?.message?.content || "";

    if (!content || !String(content).trim()) {
      throw new Error("OLLAMA_EMPTY_RESPONSE");
    }

    return safeAssistantText(content);
  } catch (error) {
    console.error("[ECOBOT] Falló Ollama:", error);
    throw error;
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
  const session = getSession(sessionKey);

  if (!cleanMessage) {
    throw new Error("La pregunta es obligatoria.");
  }

  const prepared = prep(cleanMessage);

  let topics = detectTopicsWithContext(prepared, session);
  let intents = detectIntents(prepared);

  if (!topics.length && (isShortFollowUp(prepared) || prepared === "que es")) {
    topics = session.lastTopics || [];
  }

  if (!intents.length && prepared === "que es" && topics.length) intents = ["explain"];
  if (!intents.length && includesAny(prepared, ["no me deja subirla", "no me deja subirlo", "no me deja"]) && topics.length) intents = ["problem"];
  if (!intents.length && includesAny(prepared, ["como se sube", "como subirla", "como subirlo", "como se adjunta un archivo", "como adjunto"]) && topics.length) intents = ["howto"];
  if (!intents.length && includesAny(prepared, ["como funciona", "como funcionan"]) && topics.length) intents = ["explain"];

  saveSession(sessionKey, {
    lastTopics: topics.length ? topics : session.lastTopics || [],
    lastIntents: intents.length ? intents : session.lastIntents || [],
    lastQuestion: prepared,
    lastRawQuestion: cleanMessage,
  });

  const ecoQuestion = isEcoStepsQuestion(cleanMessage);

  if (!ecoQuestion) {
    return {
      answer:
        "Solo puedo ayudarte con temas de EcoSteps, como actividades, evidencias, reportes, tickets y uso de la plataforma.",
      source: "guardrail",
    };
  }

  if (shouldUseDictionary(cleanMessage, session)) {
    const dictionaryAnswer = getDictionaryAnswer(cleanMessage, session);
    if (dictionaryAnswer) {
      return { answer: dictionaryAnswer, source: "dictionary" };
    }
  }

  const model = process.env.OLLAMA_MODEL || "phi3";
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 90000);

  const contextSummary = `
Contexto reciente:
- Últimos temas detectados: ${(session.lastTopics || []).join(", ") || "ninguno"}
- Últimas intenciones detectadas: ${(session.lastIntents || []).join(", ") || "ninguna"}
- Última pregunta del usuario: ${session.lastRawQuestion || "ninguna"}
`.trim();

  const userContext = `
Nombre del usuario: ${userName}
Rol del usuario: ${role}
${contextSummary}
Pregunta actual: ${cleanMessage}
`.trim();

  try {
    const answer = await askOllama({
      model,
      userContext,
      timeoutMs,
    });

    return { answer, source: "ollama" };
  } catch (error) {
    return {
      answer: getLocalFallbackAnswer(cleanMessage, session),
      source: "fallback",
    };
  }
}

module.exports = {
  askEcoBot,
  getDictionaryAnswer,
  getLocalFallbackAnswer,
  isEcoStepsQuestion,
};