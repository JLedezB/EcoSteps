import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

const NAV_ITEMS = [
  { id: "modulos", label: "Módulos" },
  { id: "roles", label: "Roles" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "beneficios", label: "Beneficios" },
  { id: "faq", label: "FAQ" },
];

export default function LandingPage() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("top");

  const year = useMemo(() => new Date().getFullYear(), []);
  const observerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));

        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      {
        root: null,
        threshold: [0.15, 0.25, 0.4, 0.6],
        rootMargin: "-20% 0px -65% 0px",
      }
    );

    els.forEach((el) => obs.observe(el));
    observerRef.current = obs;

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 980) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onNavClick = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setMenuOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="eco-landing">
      <header className={`eco-topbar ${compact ? "is-compact" : ""}`}>
        <div className="eco-container eco-topbar-inner">
          <Link to="/" className="eco-brand" aria-label="Ir a inicio">
            <div className="eco-brand-mark" aria-hidden="true">
              🌿
            </div>
            <div className="eco-brand-text">
              <div className="eco-brand-name">EcoSteps</div>
              <div className="eco-brand-sub">SGSS · Servicio Social</div>
            </div>
          </Link>

          <nav className="eco-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`eco-nav-link ${activeId === item.id ? "is-active" : ""}`}
                onClick={onNavClick(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="eco-actions">
            <Link className="eco-btn eco-btn-ghost" to="/login">
              Iniciar sesión
            </Link>

            <Link className="eco-btn eco-btn-solid" to="/register">
              Crear cuenta
            </Link>

            <button
              className="eco-burger"
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className={`eco-drawer ${menuOpen ? "is-open" : ""}`}>
          <div className="eco-container eco-drawer-inner">
            <div className="eco-drawer-links">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`eco-drawer-link ${activeId === item.id ? "is-active" : ""}`}
                  onClick={onNavClick(item.id)}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="eco-drawer-cta">
              <Link className="eco-btn eco-btn-ghost" to="/login" onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </Link>
              <Link className="eco-btn eco-btn-solid" to="/register" onClick={() => setMenuOpen(false)}>
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="eco-hero" id="top">
        <div className="eco-container eco-hero-grid">
          <div className="eco-hero-left eco-anim">
            <div className="eco-badge">
              <span className="eco-badge-dot" aria-hidden="true" />
              Plataforma para gestionar Servicio Social
            </div>

            <h1 className="eco-h1">
              Gestiona tu <span className="eco-gradient-text">Servicio Social</span> con orden,
              seguimiento y trazabilidad real.
            </h1>

            <p className="eco-lead">
              EcoSteps SGSS centraliza actividades, evidencias, reportes y soporte en una sola
              plataforma. <strong>Menos confusión, más control y mejor seguimiento</strong> para
              estudiantes y administradores.
            </p>

            <div className="eco-hero-cta">
              <Link className="eco-btn eco-btn-solid eco-btn-lg" to="/register">
                Empezar ahora
              </Link>

              <a
                className="eco-btn eco-btn-ghost eco-btn-lg"
                href="#como-funciona"
                onClick={onNavClick("como-funciona")}
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="eco-proof">
              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Actividades</div>
                <div className="eco-proof-desc">Organizadas, visibles y controladas</div>
              </div>

              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Evidencias</div>
                <div className="eco-proof-desc">Con estatus, revisión y comentarios</div>
              </div>

              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Soporte</div>
                <div className="eco-proof-desc">Tickets y asistencia guiada con EcoBot</div>
              </div>
            </div>

            <div className="eco-logos">
              <span className="eco-logos-label">Pensado para:</span>
              <div className="eco-logos-row" aria-label="Audiencias">
                <span className="eco-logo-pill">Estudiantes</span>
                <span className="eco-logo-pill">Coordinación</span>
                <span className="eco-logo-pill">Administración</span>
              </div>
            </div>
          </div>

          <div className="eco-hero-right eco-anim eco-delay-1">
            <div className="eco-preview">
              <div className="eco-preview-top">
                <div>
                  <div className="eco-preview-title">Panel de progreso</div>
                  <div className="eco-preview-sub">Vista general del flujo del sistema</div>
                </div>
                <span className="eco-chip eco-chip-ok">En control</span>
              </div>

              <div className="eco-preview-kpis">
                <PreviewKpi label="Reportes" value="1/3" hint="bimestrales" />
                <PreviewKpi label="Evidencias" value="2" hint="pendientes" />
                <PreviewKpi label="Horas" value="160/480" hint="acumuladas" />
              </div>

              <div className="eco-progress">
                <div className="eco-progress-head">
                  <span>Progreso general</span>
                  <span className="eco-muted">Bimestre 1 · 2 · 3</span>
                </div>

                <div className="eco-progress-track" aria-hidden="true">
                  <div className="eco-progress-bar" style={{ width: "35%" }} />
                </div>

                <div className="eco-progress-foot eco-muted">
                  Cada reporte aprobado equivale a 160 horas registradas.
                </div>
              </div>

              <div className="eco-preview-list">
                <MiniRow
                  title="Evidencia: Jornada comunitaria"
                  chips={[
                    { text: "Documento", tone: "muted" },
                    { text: "Aprobada", tone: "ok" },
                  ]}
                />
                <MiniRow
                  title="Ticket: Duda sobre reporte"
                  chips={[{ text: "En proceso", tone: "warn" }]}
                />

                <div className="eco-empty">
                  <div className="eco-empty-ic" aria-hidden="true">
                    🌿
                  </div>
                  <div className="eco-empty-title">Proceso claro</div>
                  <div className="eco-empty-text">
                    Todo queda organizado, visible y fácil de consultar.
                  </div>
                </div>
              </div>
            </div>

            <div className="eco-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="modulos" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <span className="eco-section-kicker">MÓDULOS</span>
            <h2 className="eco-h2">Todo lo necesario en una sola plataforma</h2>
            <p className="eco-sub">
              EcoSteps integra los componentes clave del servicio social para que el proceso deje de
              depender de mensajes dispersos, entregas informales o seguimiento manual.
            </p>
          </div>

          <div className="eco-grid eco-grid-3">
            <Feature
              icon="📌"
              title="Actividades"
              desc="Consulta actividades disponibles, requisitos, cupo y estado de participación."
            />
            <Feature
              icon="📎"
              title="Evidencias"
              desc="Sube archivos por actividad, revisa estatus y recibe comentarios de validación."
            />
            <Feature
              icon="🧾"
              title="Reportes"
              desc="Entrega reportes bimestrales desde un flujo centralizado y ordenado."
            />
            <Feature
              icon="📈"
              title="Progreso"
              desc="Visualiza horas acumuladas, avances y lo pendiente por completar."
            />
            <Feature
              icon="🎫"
              title="Tickets"
              desc="Canal formal de soporte con historial, seguimiento y estados visibles."
            />
            <Feature
              icon="🤖"
              title="EcoBot"
              desc="Asistente que ayuda a resolver dudas frecuentes y orienta al usuario."
            />
          </div>
        </div>
      </section>

      <section id="roles" className="eco-section eco-section-alt">
        <div className="eco-container">
          <div className="eco-section-head">
            <span className="eco-section-kicker">ROLES</span>
            <h2 className="eco-h2">Experiencias diferenciadas para cada necesidad</h2>
            <p className="eco-sub">
              El sistema está diseñado para que estudiantes y administradores trabajen sobre el mismo
              flujo, pero con responsabilidades claras y vistas específicas.
            </p>
          </div>

          <div className="eco-grid eco-grid-2">
            <Role
              tone="ok"
              title="Prestador (Estudiante)"
              subtitle="Gestiona entregas y seguimiento con claridad"
              bullets={[
                "Explora actividades e inscríbete",
                "Sube evidencias y revisa su estatus",
                "Entrega reportes bimestrales",
                "Consulta observaciones y avances",
                "Solicita apoyo mediante EcoBot o Tickets",
              ]}
              ctaText="Entrar como estudiante"
              ctaTo="/login"
            />

            <Role
              tone="warn"
              title="Administrador"
              subtitle="Valida, acompaña y da trazabilidad"
              bullets={[
                "Revisa evidencias y reportes",
                "Aprueba o rechaza con comentarios",
                "Gestiona tickets de soporte",
                "Administra actividades y cupos",
                "Consulta indicadores de avance",
              ]}
              ctaText="Entrar como admin"
              ctaTo="/login"
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <span className="eco-section-kicker">FLUJO</span>
            <h2 className="eco-h2">Cómo funciona EcoSteps</h2>
            <p className="eco-sub">
              Un proceso simple, estructurado y entendible desde el registro hasta el cierre del
              servicio social.
            </p>
          </div>

          <div className="eco-steps">
            <Step n="1" title="Crea tu cuenta" desc="Regístrate e ingresa al sistema con tu rol correspondiente." />
            <Step n="2" title="Participa en actividades" desc="Inscríbete, colabora y registra tu participación." />
            <Step n="3" title="Sube evidencias y reportes" desc="Entrega documentación y revisa observaciones." />
            <Step n="4" title="Da seguimiento al avance" desc="Consulta horas, estado de aprobación y soporte." />
          </div>

          <div className="eco-callout">
            <div className="eco-callout-title">Menos desorden, más control</div>
            <p className="eco-callout-text">
              EcoSteps centraliza la operación diaria del servicio social para reducir errores,
              duplicidad y falta de seguimiento.
            </p>
          </div>
        </div>
      </section>

      <section id="beneficios" className="eco-section eco-section-alt">
        <div className="eco-container">
          <div className="eco-section-head">
            <span className="eco-section-kicker">VALOR</span>
            <h2 className="eco-h2">Beneficios principales</h2>
            <p className="eco-sub">
              Diseñado para ofrecer una experiencia más profesional, consistente y confiable en la
              gestión del servicio social.
            </p>
          </div>

          <div className="eco-grid eco-grid-4">
            <Benefit title="Estandarización" desc="Formatos y pasos claros para reducir dudas y errores." />
            <Benefit title="Orden real" desc="Todo centralizado con historial, estatus y seguimiento." />
            <Benefit title="Transparencia" desc="Decisiones visibles con comentarios y trazabilidad." />
            <Benefit title="Acompañamiento" desc="Soporte guiado para resolver bloqueos rápidamente." />
          </div>

          <div className="eco-testimonials">
            <Testimonial
              quote="Ahora sé exactamente qué debo subir y en qué etapa voy. Todo es mucho más claro."
              name="Estudiante"
              role="Prestador"
            />
            <Testimonial
              quote="La validación es más ordenada y queda registro de cada revisión. Eso mejora bastante la operación."
              name="Administrador"
              role="Coordinación"
            />
            <Testimonial
              quote="El flujo de tickets y ayuda guiada reduce dudas repetidas y facilita el seguimiento."
              name="Soporte"
              role="Operación"
            />
          </div>
        </div>
      </section>

      <section id="faq" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <span className="eco-section-kicker">FAQ</span>
            <h2 className="eco-h2">Preguntas frecuentes</h2>
            <p className="eco-sub">Respuestas directas para entender el sistema rápidamente.</p>
          </div>

          <div className="eco-faq">
            <Faq
              q="¿EcoSteps reemplaza todo lo que ya hago?"
              a="Centraliza actividades, evidencias, reportes y soporte. Reduce fricción y mejora la trazabilidad del proceso."
            />
            <Faq
              q="¿Cómo se valida una evidencia o reporte?"
              a="El administrador revisa la entrega, la aprueba o rechaza y agrega comentarios. El estudiante puede ver el estatus desde su panel."
            />
            <Faq
              q="¿Qué pasa si tengo un problema o duda?"
              a="Puedes usar EcoBot para dudas frecuentes o abrir un ticket para seguimiento formal con historial y estado."
            />
          </div>

          <div className="eco-final-cta">
            <div>
              <div className="eco-final-cta-title">
                Empieza tu Servicio Social con una plataforma más clara y profesional
              </div>
              <div className="eco-final-cta-sub">
                Regístrate y conoce el flujo completo en minutos.
              </div>
            </div>

            <div className="eco-final-cta-actions">
              <Link className="eco-btn eco-btn-solid eco-btn-lg" to="/register">
                Crear cuenta
              </Link>
              <Link className="eco-btn eco-btn-ghost eco-btn-lg" to="/login">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="eco-footer">
        <div className="eco-container eco-footer-inner">
          <div className="eco-footer-left">
            <div className="eco-footer-brand">
              <span className="eco-footer-mark" aria-hidden="true">
                🌿
              </span>
              EcoSteps SGSS
            </div>

            <div className="eco-footer-sub">
              Plataforma para gestionar servicio social con seguimiento, evidencias, reportes y soporte.
            </div>

            <div className="eco-footer-copy">© {year} EcoSteps</div>
          </div>

          <div className="eco-footer-right">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                className="eco-footer-link"
                href={`#${item.id}`}
                onClick={onNavClick(item.id)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <a className="eco-backtop" href="#top" onClick={onNavClick("top")} aria-label="Volver arriba">
        ↑
      </a>
    </div>
  );
}

/* UI Components */

function Feature({ icon, title, desc }) {
  return (
    <div className="eco-card eco-hover">
      <div className="eco-card-ic" aria-hidden="true">
        {icon}
      </div>
      <div className="eco-card-title">{title}</div>
      <div className="eco-card-desc">{desc}</div>
    </div>
  );
}

function Role({ title, subtitle, bullets, ctaText, ctaTo, tone }) {
  return (
    <div className={`eco-role eco-hover ${tone === "warn" ? "is-warn" : "is-ok"}`}>
      <div className="eco-role-head">
        <div>
          <div className="eco-role-title">{title}</div>
          <div className="eco-role-sub">{subtitle}</div>
        </div>

        <span className={`eco-chip ${tone === "warn" ? "eco-chip-warn" : "eco-chip-ok"}`}>
          {tone === "warn" ? "Gestión" : "Estudiante"}
        </span>
      </div>

      <ul className="eco-role-list">
        {bullets.map((b, i) => (
          <li key={i} className="eco-role-item">
            <span className="eco-check" aria-hidden="true">
              ✓
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="eco-role-foot">
        <Link className="eco-btn eco-btn-solid" to={ctaTo}>
          {ctaText}
        </Link>
      </div>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="eco-step eco-hover">
      <div className="eco-step-n">{n}</div>
      <div>
        <div className="eco-step-title">{title}</div>
        <div className="eco-step-desc">{desc}</div>
      </div>
    </div>
  );
}

function Benefit({ title, desc }) {
  return (
    <div className="eco-benefit eco-hover">
      <div className="eco-benefit-title">{title}</div>
      <div className="eco-benefit-desc">{desc}</div>
    </div>
  );
}

function Testimonial({ quote, name, role }) {
  return (
    <div className="eco-testimonial eco-hover">
      <div className="eco-testimonial-quote">“{quote}”</div>
      <div className="eco-testimonial-meta">
        <div className="eco-testimonial-name">{name}</div>
        <div className="eco-testimonial-role">{role}</div>
      </div>
    </div>
  );
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      className={`eco-faq-item ${open ? "is-open" : ""}`}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
    >
      <div className="eco-faq-q">
        <span>{q}</span>
        <span className="eco-faq-plus" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </div>
      <div className="eco-faq-a">{a}</div>
    </button>
  );
}

function PreviewKpi({ label, value, hint }) {
  return (
    <div className="eco-pkpi">
      <div className="eco-pkpi-label">{label}</div>
      <div className="eco-pkpi-value">{value}</div>
      <div className="eco-pkpi-hint">{hint}</div>
    </div>
  );
}

function MiniRow({ title, chips }) {
  return (
    <div className="eco-minirow">
      <div className="eco-minirow-main">
        <div className="eco-minirow-title">{title}</div>
        <div className="eco-minirow-chips">
          {chips.map((c, i) => (
            <span
              key={i}
              className={`eco-chip ${
                c.tone === "ok"
                  ? "eco-chip-ok"
                  : c.tone === "warn"
                  ? "eco-chip-warn"
                  : "eco-chip-muted"
              }`}
            >
              {c.text}
            </span>
          ))}
        </div>
      </div>

      <span className="eco-minirow-cta eco-muted" aria-hidden="true">
        Ver →
      </span>
    </div>
  );
}