// chatbotFlow.js

/* Flow */
export const BOT_FLOW = {
  root: {
    text: "¿Qué necesitas? Elige una opción:",
    options: [
      { label: "Empezar / ¿Qué es EcoSteps?", next: "about" },
      { label: "Actividades (inscribirme / ver cupos)", next: "activities" },
      { label: "Evidencias (subir / estados)", next: "evidences" },
      { label: "Reportes bimestrales (subir / aprobación)", next: "reports" },
      { label: "Tickets (soporte / problemas)", next: "tickets" },
      { label: "Cuenta / sesión", next: "account" },
      { label: "Admin: ¿Qué puedo hacer?", next: "admin_overview", roles: ["admin"] },
      { label: "ML: ¿Cómo funciona la detección?", next: "ml_overview" },
    ],
  },

  /* About */
  about: {
    text: "EcoSteps es una plataforma para gestionar Servicio Social: actividades, evidencias, reportes y soporte (tickets).",
    bullets: [
      "Como USER: te inscribes a actividades, subes evidencias y reportes, y creas tickets.",
      "Como ADMIN: creas actividades, revisas evidencias/reportes y atiendes tickets.",
    ],
    tip: "Si te pierdes, vuelve a tu Dashboard y usa los botones de acceso rápido.",
    options: [{ label: "Volver al menú", next: "root" }],
  },

  /* Activities */
  activities: {
    text: "Actividades (USER):",
    bullets: [
      "Entra a tu Dashboard → pestaña 'Todas' para ver actividades.",
      "Pica 'Inscribirme' si hay cupo disponible.",
      "En 'Mis actividades' ves solo donde estás inscrito.",
    ],
    tip: "Si no te deja inscribirte, puede estar cerrada o sin cupos.",
    options: [
      { label: "¿Dónde veo mis actividades?", next: "activities_mine" },
      { label: "¿Por qué no puedo inscribirme?", next: "activities_cant_join" },
      { label: "Volver", next: "root" },
    ],
  },

  activities_mine: {
    text: "Para ver tus actividades:",
    bullets: ["Dashboard USER → botón/pestaña 'Mis actividades'.", "Ahí verás la lista y el panel de evidencias por actividad."],
    options: [{ label: "Volver a Actividades", next: "activities" }],
  },

  activities_cant_join: {
    text: "Razones comunes por las que NO te deja inscribirte:",
    bullets: ["La actividad está 'CERRADA'.", "No hay cupo disponible.", "Tu sesión expiró (cierra sesión y vuelve a entrar)."],
    tip: "Revisa la fecha y el estado en la tarjeta de la actividad.",
    options: [{ label: "Volver a Actividades", next: "activities" }],
  },

  /* Evidences */
  evidences: {
    text: "Evidencias (USER):",
    bullets: [
      "Dashboard USER → 'Mis actividades' → botón 'Subir evidencia' en la actividad.",
      "Subes imagen/archivo según reglas.",
      "Estado puede ser: pendiente / aprobada / rechazada.",
    ],
    tip: "Si ya está APROBADA, el botón se deshabilita (actividad completada).",
    options: [
      { label: "¿Dónde veo el estado?", next: "evidences_status" },
      { label: "¿Qué pasa si me rechazan?", next: "evidences_rejected" },
      { label: "Volver", next: "root" },
    ],
  },

  evidences_status: {
    text: "Ver estado de evidencia:",
    bullets: ["Dashboard USER → 'Mis actividades'.", "En 'Evidencias por actividad' verás el badge del estado."],
    options: [{ label: "Volver a Evidencias", next: "evidences" }],
  },

  evidences_rejected: {
    text: "Si tu evidencia se rechaza:",
    bullets: ["Aparecerá como RECHAZADA.", "Puedes volver a subir evidencia si la actividad NO está marcada como completada."],
    tip: "Adjunta una evidencia clara: foto legible / documento correcto.",
    options: [{ label: "Volver a Evidencias", next: "evidences" }],
  },

  /* Reports */
  reports: {
    text: "Reportes bimestrales (USER):",
    bullets: ["Dashboard USER → botón 'Subir reporte bimestral'.", "Subes tu PDF/archivo.", "Admin lo revisa y lo aprueba/rechaza."],
    tip: "Cuando te aprueban reportes, suben tus horas y tu progreso.",
    options: [
      { label: "¿Dónde veo si lo aprobaron?", next: "reports_status" },
      { label: "Volver", next: "root" },
    ],
  },

  reports_status: {
    text: "Ver si aprobaron tu reporte:",
    bullets: ["Dashboard USER → mira el badge 'Reportes aprobados: X/3'.", "Si no sube, el reporte sigue pendiente o fue rechazado."],
    options: [{ label: "Volver a Reportes", next: "reports" }],
  },

  /* Tickets */
  tickets: {
    text: "Tickets (USER): soporte formal dentro del sistema.",
    bullets: [
      "Dashboard USER → botón/menú de Tickets (o ruta /user/tickets).",
      "Creas ticket con asunto y descripción.",
      "Opcional: lo vinculas a una actividad.",
      "En el detalle puedes chatear con Admin y adjuntar archivo.",
    ],
    tip: "Si Admin responde, el ticket puede pasar a 'EN PROCESO'.",
    options: [
      { label: "¿Cómo creo un ticket?", next: "tickets_create" },
      { label: "¿Cómo adjunto archivos?", next: "tickets_files" },
      { label: "Volver", next: "root" },
    ],
  },

  tickets_create: {
    text: "Crear ticket:",
    bullets: [
      "Ve a 'Mis Tickets' → sección 'Crear ticket'.",
      "Asunto + descripción (obligatorio).",
      "Actividad (opcional) si aplica.",
      "Pica 'Crear ticket'.",
    ],
    options: [{ label: "Volver a Tickets", next: "tickets" }],
  },

  tickets_files: {
    text: "Adjuntar archivo en un ticket:",
    bullets: [
      "Abre el detalle del ticket → escribe mensaje.",
      "Selecciona archivo en input file → Enviar.",
      "Si existe fileUrl, verás botón para abrir/descargar.",
    ],
    tip: "Usa archivos permitidos (igual que evidencias).",
    options: [{ label: "Volver a Tickets", next: "tickets" }],
  },

  /* Account */
  account: {
    text: "Cuenta / sesión:",
    bullets: [
      "Para salir: botón Logout.",
      "Si se rompe algo raro: Logout → Login.",
      "Si estás en red estricta (ITESO), usa red confiable o VPN si aplica.",
    ],
    tip: "Si no carga frontend en red segura: puede bloquear WebSocket/DevServer.",
    options: [{ label: "Volver", next: "root" }],
  },

  /* Admin */
  admin_overview: {
    text: "Admin (resumen rápido):",
    bullets: [
      "Dashboard ADMIN: crear/editar/eliminar actividades.",
      "Revisar reportes bimestrales pendientes.",
      "Revisar evidencias por actividad.",
      "Ver tickets y responder (con filtros por estado).",
    ],
    tip: "Los tickets abiertos deben atenderse primero: OPEN → IN PROGRESS → RESOLVED.",
    options: [
      { label: "Tickets (Admin)", next: "admin_tickets", roles: ["admin"] },
      { label: "Reportes (Admin)", next: "admin_reports", roles: ["admin"] },
      { label: "Volver", next: "root", roles: ["admin"] },
    ],
  },

  admin_tickets: {
    text: "Tickets (Admin):",
    bullets: [
      "Entra a /admin/tickets.",
      "Usa filtros: open / in_progress / resolved.",
      "En el detalle respondes y puede pasar a 'EN PROCESO' automático.",
      "Al resolver, puede eliminarse (según tu regla).",
    ],
    options: [{ label: "Volver a Admin", next: "admin_overview", roles: ["admin"] }],
  },

  admin_reports: {
    text: "Reportes (Admin):",
    bullets: ["Entra a /admin/reports.", "Verás reportes pendientes con botón para abrir el archivo.", "Apruebas o rechazas."],
    options: [{ label: "Volver a Admin", next: "admin_overview", roles: ["admin"] }],
  },

  /* ML */
  ml_overview: {
    text: "ML (detección):",
    bullets: [
      "El módulo de ML apoya la validación/seguimiento de evidencias y reportes según las reglas del sistema.",
      "El resultado puede marcarse como sugerencia para revisión (no reemplaza al admin).",
      "Si el resultado no coincide, el admin decide y el ticket sirve como soporte.",
    ],
    tip: "Recomendación: deja el ML como 'asistente' y mantén aprobación final en Admin.",
    options: [{ label: "Volver al menú", next: "root" }],
  },
};
