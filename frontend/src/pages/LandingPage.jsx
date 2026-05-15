import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

const NAV_ITEMS = [
  { id: "quienes-somos", label: "Quiénes somos" },
  { id: "modulos", label: "Módulos" },
  { id: "roles", label: "Roles" },
  { id: "flujo", label: "Flujo" },
  { id: "contacto", label: "Contáctanos" },
  { id: "faq", label: "FAQ" },
];

const CONTACT_CHANNELS = [
  {
    icon: "linkedin",
    title: "LinkedIn",
    value: "EcoSteps AC",
    href: "https://www.linkedin.com/company/ecostepsac/?originalSubdomain=mx",
    action: "Ver perfil",
  },
  {
    icon: "facebook",
    title: "Facebook",
    value: "Ecosteps.mx",
    href: "https://www.facebook.com/Ecosteps.mx",
    action: "Visitar página",
  },
  {
    icon: "web",
    title: "Sitio web",
    value: "ecostepsac.org",
    href: "https://ecostepsac.org/",
    action: "Abrir sitio",
  },
  {
    icon: "phone",
    title: "Teléfono",
    value: "+52 33 1048 2080",
    href: "tel:+523310482080",
    action: "Llamar",
  },
  {
    icon: "mail",
    title: "Correo",
    value: "ecosteps.mx@gmail.com",
    href:
      "https://mail.google.com/mail/?view=cm&fs=1&to=ecosteps.mx@gmail.com&su=Contacto%20desde%20EcoSteps SGSS&body=Hola%20EcoSteps,%20me%20gustaría%20recibir%20más%20información.",
    action: "Enviar correo",
  },
  {
    icon: "whatsapp",
    title: "WhatsApp",
    value: "+52 33 1048 2080",
    href:
      "https://api.whatsapp.com/send/?phone=%2B523310482080&text=Hola%20EcoSteps,%20me%20gustaría%20recibir%20más%20información.&type=phone_number&app_absent=0",
    action: "Enviar mensaje",
  },
];


function LogoIcon() {
  return (
    <span className="sl-logo-mark">
      <svg
        className="sl-logo-plant"
        viewBox="0 0 64 64"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M31.8 53V35.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M31.7 36.5C21.5 34.9 15.2 28.2 13.2 18.4c9.9.6 18.1 5.7 20.9 15.6"
          fill="currentColor"
        />
        <path
          d="M34.2 32.8c2.6-11.9 10.9-18.4 22.4-19.9-1.3 12.3-9.5 21.6-22.4 23.1"
          fill="currentColor"
        />
        <path
          d="M18.6 23.1c4.6.9 8.2 3.3 10.7 7.2"
          fill="none"
          stroke="#0b3519"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M50.2 18.8c-5.3 2-9.2 5.7-11.7 10.9"
          fill="none"
          stroke="#0b3519"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    </span>
  );
}

function useReveal(threshold = 0.14) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("top");
  const year = useMemo(() => new Date().getFullYear(), []);
  const observerRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const ids = ["top", ...NAV_ITEMS.map((x) => x.id)];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);

    if (!els.length) return;
    if (observerRef.current) observerRef.current.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        threshold: [0.1, 0.35, 0.6],
        rootMargin: "-12% 0px -62% 0px",
      }
    );

    els.forEach((el) => obs.observe(el));
    observerRef.current = obs;

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fn = () => {
      if (window.innerWidth > 980) setMenuOpen(false);
    };

    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const scrollTo = useCallback(
    (id) => (e) => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setMenuOpen(false);
    },
    []
  );

  return (
    <div className="sl-root">
      <header className={`sl-nav ${scrolled ? "sl-nav--solid" : ""}`}>
        <div className="sl-nav-inner">
          <Link to="/" className="sl-logo" aria-label="Ir al inicio">
            <LogoIcon />

            <div className="sl-logo-text">
              <span className="sl-logo-name">EcoSteps</span>
              <span className="sl-logo-tag">Servicio Social Digital</span>
            </div>
          </Link>

          <nav className="sl-links" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={scrollTo(item.id)}
                className={`sl-link ${activeId === item.id ? "sl-link--on" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="sl-nav-end">
            <Link className="sl-btn sl-btn--ghost" to="/login">
              Ingresar
            </Link>

            <Link className="sl-btn sl-btn--primary" to="/register">
              Registrarse
            </Link>

            <button
              className="sl-burger"
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={menuOpen ? "x" : ""} />
              <span className={menuOpen ? "x" : ""} />
            </button>
          </div>
        </div>

        <div className={`sl-drawer ${menuOpen ? "sl-drawer--open" : ""}`}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={scrollTo(item.id)}
              className={`sl-dlink ${activeId === item.id ? "sl-dlink--on" : ""}`}
            >
              <span>{item.label}</span>
              <span>↗</span>
            </a>
          ))}

          <div className="sl-drawer-btns">
            <Link className="sl-btn sl-btn--ghost" to="/login">
              Ingresar
            </Link>
            <Link className="sl-btn sl-btn--primary" to="/register">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <section id="top" className="sl-hero">
        <div className="sl-orb sl-orb--one" />
        <div className="sl-orb sl-orb--two" />
        <div className="sl-orb sl-orb--three" />

        <div className="sl-hero-inner">
          <div className="sl-hero-left">
            <div className="sl-tag sl-anim-1">
              <span />
              Plataforma integral para servicio social
            </div>

            <h1 className="sl-h1 sl-anim-2">
              Gestiona tu
              <br />
              servicio social
              <br />
              <span>sin desorden.</span>
            </h1>

            <p className="sl-hero-body sl-anim-3">
              EcoSteps centraliza actividades, evidencias, reportes, progreso y soporte
              en una experiencia moderna, clara y profesional.
            </p>

            <div className="sl-hero-btns sl-anim-4">
              <Link className="sl-btn sl-btn--primary sl-btn--lg" to="/register">
                Comenzar ahora
                <span className="sl-btn-arrow">→</span>
              </Link>

              <a className="sl-link-cta" href="#quienes-somos" onClick={scrollTo("quienes-somos")}>
                Conocer EcoSteps
              </a>
            </div>

            <div className="sl-stats sl-anim-5">
              <Stat value="6" label="Módulos clave" />
              <Stat value="3" label="Reportes bimestrales" />
              <Stat value="24/7" label="Acceso web" />
            </div>
          </div>

          <div className="sl-hero-right sl-anim-6">
            <HeroDashboard />
          </div>
        </div>

        <a
          className="sl-scroll-hint"
          href="#quienes-somos"
          onClick={scrollTo("quienes-somos")}
          aria-label="Ir a quiénes somos"
        >
          ↓
        </a>
      </section>

      <section id="quienes-somos" className="sl-section sl-about-section">
        <div className="sl-wrap">
          <div className="sl-about-grid">
            <RevealBlock>
              <p className="sl-eyebrow">Quiénes somos</p>
              <h2 className="sl-h2">
                Una plataforma creada para ordenar
                el servicio social.
              </h2>
              <p className="sl-section-sub">
                EcoSteps nace para transformar procesos dispersos en una experiencia digital
                más simple, trazable y profesional para estudiantes y administradores.
              </p>
            </RevealBlock>

            <RevealBlock delay={120}>
              <div className="sl-about-panel">
                <div className="sl-about-logo">
                  <LogoIcon />
                  <span>EcoSteps</span>
                </div>

                <p>
                  Nuestro objetivo es reducir la fricción del seguimiento académico,
                  mejorar la comunicación y mantener evidencia clara durante todo el proceso.
                </p>

                <div className="sl-about-values">
                  <ValuePill icon="✓" text="Orden" />
                  <ValuePill icon="↗" text="Trazabilidad" />
                  <ValuePill icon="●" text="Claridad" />
                </div>
              </div>
            </RevealBlock>
          </div>

          <div className="sl-about-cards">
            <InfoCard
              icon="🌱"
              title="Propósito"
              body="Facilitar el control de actividades, evidencias y reportes desde una sola plataforma."
            />
            <InfoCard
              icon="🧭"
              title="Enfoque"
              body="Diseño limpio, navegación sencilla y procesos entendibles para cada usuario."
            />
            <InfoCard
              icon="🔒"
              title="Confianza"
              body="Información organizada, estados visibles y seguimiento formal mediante tickets."
            />
          </div>
        </div>
      </section>

      <section id="modulos" className="sl-section">
        <div className="sl-wrap">
          <RevealBlock>
            <p className="sl-eyebrow">Módulos</p>
            <h2 className="sl-h2">
              Todo organizado,
              <br />
              sin saturar el proceso.
            </h2>
          </RevealBlock>

          <div className="sl-mods">
            {[
              {
                n: "01",
                icon: "📌",
                title: "Actividades",
                body: "Consulta actividades, requisitos, cupos y detalles importantes desde un solo lugar.",
              },
              {
                n: "02",
                icon: "📎",
                title: "Evidencias",
                body: "Sube archivos, revisa comentarios y mantén tus entregas ordenadas.",
              },
              {
                n: "03",
                icon: "🧾",
                title: "Reportes",
                body: "Entrega reportes bimestrales con seguimiento claro y trazable.",
              },
              {
                n: "04",
                icon: "📈",
                title: "Progreso",
                body: "Visualiza avance, horas acumuladas y pendientes por completar.",
              },
              {
                n: "05",
                icon: "🎫",
                title: "Tickets",
                body: "Canal formal para dudas, problemas o solicitudes con historial.",
              },
              {
                n: "06",
                icon: "🤖",
                title: "EcoBot",
                body: "Asistente de apoyo para dudas frecuentes y guía dentro del sistema.",
              },
            ].map((m, i) => (
              <ModCard key={m.n} {...m} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="sl-section sl-section--dark">
        <div className="sl-wrap">
          <RevealBlock>
            <p className="sl-eyebrow">Roles</p>
            <h2 className="sl-h2">
              Una experiencia pensada
              <br />
              para cada usuario.
            </h2>
          </RevealBlock>

          <div className="sl-roles">
            <RoleCard
              tag="Estudiante"
              headline="Prestador"
              desc="Controla tus entregas, actividades y avance sin depender de mensajes dispersos."
              items={[
                "Inscripción a actividades disponibles",
                "Carga de evidencias",
                "Entrega de reportes",
                "Consulta de progreso",
                "Soporte mediante tickets",
              ]}
              cta="Entrar como prestador"
              variant="green"
            />

            <RoleCard
              tag="Administrador"
              headline="Coordinador"
              desc="Revisa entregas, administra actividades y da seguimiento con mayor orden."
              items={[
                "Validación de evidencias",
                "Revisión de reportes",
                "Administración de actividades",
                "Gestión de tickets",
                "Consulta general de avances",
              ]}
              cta="Entrar como administrador"
              variant="gold"
            />
          </div>
        </div>
      </section>

      <section id="flujo" className="sl-section">
        <div className="sl-wrap">
          <RevealBlock>
            <p className="sl-eyebrow">Flujo</p>
            <h2 className="sl-h2">
              Del registro al cierre,
              <br />
              en pasos simples.
            </h2>
          </RevealBlock>

          <div className="sl-flow">
            {[
              {
                n: "01",
                title: "Crea tu cuenta",
                body: "Regístrate y accede con el rol correspondiente.",
              },
              {
                n: "02",
                title: "Elige actividad",
                body: "Consulta actividades disponibles e inscríbete fácilmente.",
              },
              {
                n: "03",
                title: "Sube evidencias",
                body: "Carga documentos, imágenes o archivos requeridos.",
              },
              {
                n: "04",
                title: "Cierra reportes",
                body: "Entrega tus reportes y consulta el estado final.",
              },
            ].map((s, i) => (
              <FlowStep key={s.n} {...s} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="sl-section sl-contact-section">
        <div className="sl-wrap">
          <RevealBlock center>
            <p className="sl-eyebrow">Contáctanos</p>
            <h2 className="sl-h2">
              Canales oficiales
              <br />
              de EcoSteps.
            </h2>
            <p className="sl-contact-intro">
              Encuentra nuestros medios oficiales para comunicarte, conocer más sobre
              EcoSteps o solicitar información directamente.
            </p>
          </RevealBlock>

          <div className="sl-contact-cards-grid">
            {CONTACT_CHANNELS.map((item, i) => (
              <ContactCard key={item.title} {...item} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="sl-section sl-section--dark">
        <div className="sl-wrap sl-faq-wrap">
          <RevealBlock>
            <p className="sl-eyebrow">FAQ</p>
            <h2 className="sl-h2">
              Respuestas
              <br />
              rápidas.
            </h2>
            <p className="sl-faq-aside">
              Dudas comunes sobre el uso de EcoSteps y el flujo de entregas.
            </p>
          </RevealBlock>

          <div className="sl-faq-list">
            {[
              {
                q: "¿EcoSteps reemplaza mensajes y entregas informales?",
                a: "Sí. Centraliza actividades, evidencias, reportes y soporte en un flujo más ordenado.",
              },
              {
                q: "¿Cómo se valida una evidencia?",
                a: "El administrador revisa la entrega, agrega comentarios y cambia el estado dentro del panel.",
              },
              {
                q: "¿Qué hago si tengo dudas?",
                a: "Puedes consultar EcoBot o abrir un ticket formal para recibir seguimiento.",
              },
              {
                q: "¿Necesito instalar algo?",
                a: "No. EcoSteps funciona directamente desde el navegador.",
              },
            ].map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>

      <section className="sl-cta">
        <div className="sl-cta-inner">
          <RevealBlock center>
            <p className="sl-eyebrow">Empieza hoy</p>
            <h2 className="sl-cta-h">
              Menos desorden.
              <br />
              Más control.
            </h2>
            <p className="sl-cta-sub">
              Gestiona tu servicio social con una experiencia más clara, moderna y profesional.
            </p>

            <div className="sl-cta-btns">
              <Link className="sl-btn sl-btn--primary sl-btn--lg" to="/register">
                Crear cuenta
              </Link>
              <Link className="sl-btn sl-btn--outline-light sl-btn--lg" to="/login">
                Iniciar sesión
              </Link>
            </div>
          </RevealBlock>
        </div>
      </section>

      <footer className="sl-footer">
        <div className="sl-footer-inner">
          <div className="sl-footer-brand">
            <LogoIcon />
            <span>EcoSteps</span>
          </div>

          <nav className="sl-footer-nav">
            {NAV_ITEMS.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={scrollTo(item.id)}>
                {item.label}
              </a>
            ))}
          </nav>

          <p>© {year} EcoSteps</p>
        </div>
      </footer>
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="sl-dashboard">
      <div className="sl-db-glow" />

      <div className="sl-db-bar">
        <div className="sl-db-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="sl-db-label">Dashboard · Bimestre 1</span>
        <span className="sl-db-badge">Activo</span>
      </div>

      <div className="sl-db-kpis">
        <DbKpi value="33%" label="Progreso" accent />
        <DbKpi value="1/3" label="Reportes" />
        <DbKpi value="160h" label="Horas" />
      </div>

      <div className="sl-db-progress-wrap">
        <div className="sl-db-progress-head">
          <span>Avance general</span>
          <strong>33%</strong>
        </div>

        <div className="sl-db-track">
          <div className="sl-db-fill" />
        </div>

        <div className="sl-db-progress-foot">
          Bimestre 1 completado parcialmente
        </div>
      </div>

      <div className="sl-db-items">
        <DbRow label="Jornada comunitaria" sub="Evidencia · Documento" status="Aprobada" ok />
        <DbRow label="Reporte Bimestre 1" sub="Reporte · PDF" status="En revisión" />
        <DbRow label="Taller de capacitación" sub="Evidencia · Imagen" status="Pendiente" muted />
      </div>

      <div className="sl-db-foot">
        <span>🌿</span>
        <p>Información clara, trazable y siempre disponible.</p>
      </div>
    </div>
  );
}

function DbKpi({ value, label, accent }) {
  return (
    <div className={`sl-dbkpi ${accent ? "sl-dbkpi--accent" : ""}`}>
      <span>{value}</span>
      <p>{label}</p>
    </div>
  );
}

function DbRow({ label, sub, status, ok, muted }) {
  return (
    <div className="sl-dbrow">
      <div>
        <strong>{label}</strong>
        <p>{sub}</p>
      </div>

      <span className={`sl-dbbadge ${ok ? "ok" : muted ? "muted" : "warn"}`}>
        {status}
      </span>
    </div>
  );
}

function RevealBlock({ children, delay = 0, center = false }) {
  const [ref, visible] = useReveal(0.1);

  return (
    <div
      ref={ref}
      className={`sl-reveal ${visible ? "sl-revealed" : ""} ${
        center ? "sl-reveal--center" : ""
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="sl-stat">
      <span>{value}</span>
      <p>{label}</p>
    </div>
  );
}

function ValuePill({ icon, text }) {
  return (
    <span className="sl-value-pill">
      <i>{icon}</i>
      {text}
    </span>
  );
}

function InfoCard({ icon, title, body }) {
  const [ref, visible] = useReveal(0.1);

  return (
    <div ref={ref} className={`sl-info-card sl-reveal ${visible ? "sl-revealed" : ""}`}>
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function ContactCard({ icon, title, value, href, action, delay }) {
  const [ref, visible] = useReveal(0.1);

  const isExternal =
    href.startsWith("http") ||
    href.startsWith("tel:");

  return (
    <a
      ref={ref}
      href={href}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noreferrer" : undefined}
      className={`sl-contact-card-link sl-reveal ${
        visible ? "sl-revealed" : ""
      }`}
      style={{ transitionDelay: `${delay}ms` }}
      aria-label={`${title}: ${value}`}
    >
      <span className={`sl-contact-icon sl-contact-icon--${icon}`}>
        <ContactIcon type={icon} />
      </span>

      <div className="sl-contact-card-info">
        <strong>{title}</strong>
        <p>{value}</p>
      </div>

      <span className="sl-contact-action">
        {action}
        <i>→</i>
      </span>
    </a>
  );
}

function ContactIcon({ type }) {
  const icons = {
    linkedin: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.94 8.98H3.73V20h3.21V8.98ZM5.34 7.47a1.86 1.86 0 1 0 0-3.72 1.86 1.86 0 0 0 0 3.72ZM20.27 20h-3.2v-5.36c0-1.28-.03-2.92-1.78-2.92-1.78 0-2.05 1.39-2.05 2.82V20h-3.2V8.98h3.07v1.5h.04c.43-.8 1.47-1.65 3.03-1.65 3.24 0 3.84 2.13 3.84 4.9V20h.25Z" />
      </svg>
    ),
    facebook: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.02 8.33V6.92c0-.68.45-.84.77-.84h1.96V3.07L14.05 3c-3 0-3.68 2.25-3.68 3.68v1.65H8v3.1h2.37V21h3.65v-9.57h2.46l.32-3.1h-2.78Z" />
      </svg>
    ),
    web: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-3.06a15.7 15.7 0 0 0-1.42-3.15A8.05 8.05 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.52 1.9 3.96h-3.8A13.2 13.2 0 0 1 12 4.04ZM4.26 14a8.27 8.27 0 0 1 0-4h3.48a16.5 16.5 0 0 0 0 4H4.26Zm.81 2h3.06c.35 1.14.83 2.2 1.42 3.15A8.05 8.05 0 0 1 5.07 16Zm3.06-8H5.07a8.05 8.05 0 0 1 4.48-3.15A15.7 15.7 0 0 0 8.13 8ZM12 19.96A13.2 13.2 0 0 1 10.1 16h3.8a13.2 13.2 0 0 1-1.9 3.96ZM14.33 14H9.67a14.7 14.7 0 0 1 0-4h4.66a14.7 14.7 0 0 1 0 4Zm.12 5.15A15.7 15.7 0 0 0 15.87 16h3.06a8.05 8.05 0 0 1-4.48 3.15ZM16.26 14a16.5 16.5 0 0 0 0-4h3.48a8.27 8.27 0 0 1 0 4h-3.48Z" />
      </svg>
    ),
    phone: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.62 10.79a15.1 15.1 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.11.37 2.31.56 3.58.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.27.19 2.47.56 3.58a1 1 0 0 1-.25 1.01l-2.19 2.2Z" />
      </svg>
    ),
    mail: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-.4 4.25-7.07 4.42a1 1 0 0 1-1.06 0L4.4 8.25A1 1 0 1 1 5.46 6.55L12 10.64l6.54-4.09a1 1 0 1 1 1.06 1.7Z" />
      </svg>
    ),
    whatsapp: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15.01L2.5 22l5.1-1.34A9.96 9.96 0 1 0 12.04 2Zm5.82 14.15c-.24.67-1.4 1.28-1.95 1.36-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.61-2.88-1.24-4.76-4.14-4.9-4.33-.15-.19-1.17-1.56-1.17-2.98s.74-2.12 1-2.41c.27-.3.59-.37.78-.37h.56c.18 0 .42-.07.66.5.24.58.83 2.01.9 2.16.08.15.12.32.02.51-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.64-.08.18-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.28.1 1.76.83 2.06.98.3.15.5.22.57.35.08.13.08.75-.16 1.43Z" />
      </svg>
    ),
  };

  return icons[type] || icons.web;
}

function ModCard({ n, icon, title, body, delay }) {
  const [ref, visible] = useReveal(0.1);

  return (
    <div
      ref={ref}
      className={`sl-mod sl-reveal ${visible ? "sl-revealed" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="sl-mod-head">
        <span>{n}</span>
        <i>{icon}</i>
      </div>

      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function RoleCard({ tag, headline, desc, items, cta, variant }) {
  const [ref, visible] = useReveal(0.1);

  return (
    <div
      ref={ref}
      className={`sl-role sl-role--${variant} sl-reveal ${
        visible ? "sl-revealed" : ""
      }`}
    >
      <p className="sl-role-tag">{tag}</p>
      <h3>{headline}</h3>
      <p className="sl-role-desc">{desc}</p>

      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <Link className={`sl-btn sl-btn--role sl-btn--role-${variant}`} to="/login">
        {cta}
      </Link>
    </div>
  );
}

function FlowStep({ n, title, body, delay }) {
  const [ref, visible] = useReveal(0.1);

  return (
    <div
      ref={ref}
      className={`sl-fstep sl-reveal ${visible ? "sl-revealed" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      className={`sl-faq ${open ? "sl-faq--open" : ""}`}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
    >
      <div className="sl-faq-top">
        <span>{q}</span>
        <i>{open ? "−" : "+"}</i>
      </div>

      <p>{a}</p>
    </button>
  );
}