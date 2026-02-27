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

  // Scroll spy (sección activa)
  useEffect(() => {
    const ids = ["top", ...NAV_ITEMS.map((x) => x.id)];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!els.length) return;

    if (observerRef.current) observerRef.current.disconnect();

    const obs = new IntersectionObserver(
      (entries) => {
        // prioriza la entrada con mayor intersección
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

  // Cierra el menú al cambiar tamaño (desktop)
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
      {/* ======= Topbar ======= */}
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

        {/* Mobile drawer */}
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

      {/* ======= Hero ======= */}
      <section className="eco-hero" id="top">
        <div className="eco-container eco-hero-grid">
          <div className="eco-hero-left eco-anim">
            <div className="eco-badge">
              <span className="eco-badge-dot" aria-hidden="true" />
              Plataforma para gestionar Servicio Social
            </div>

            <h1 className="eco-h1">
              Todo tu <span className="eco-gradient-text">Servicio Social</span> en un solo lugar:
              evidencias, reportes y seguimiento real.
            </h1>

            <p className="eco-lead">
              EcoSteps SGSS te ayuda a llevar el proceso **con orden y trazabilidad**.
              Menos confusión, menos “¿dónde va esto?”, más claridad para estudiantes y administradores.
            </p>

            <div className="eco-hero-cta">
              <Link className="eco-btn eco-btn-solid eco-btn-lg" to="/register">
                Empezar ahora
              </Link>
              <a className="eco-btn eco-btn-ghost eco-btn-lg" href="#como-funciona" onClick={onNavClick("como-funciona")}>
                Ver cómo funciona
              </a>
            </div>

            <div className="eco-proof">
              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Actividades</div>
                <div className="eco-proof-desc">Publicadas y controladas</div>
              </div>
              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Evidencias</div>
                <div className="eco-proof-desc">Con estatus y comentarios</div>
              </div>
              <div className="eco-proof-item">
                <div className="eco-proof-kpi">Soporte</div>
                <div className="eco-proof-desc">EcoBot + Tickets</div>
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
                  <div className="eco-preview-sub">Ejemplo de visualización</div>
                </div>
                <span className="eco-chip eco-chip-ok">Al día</span>
              </div>

              <div className="eco-preview-kpis">
                <PreviewKpi label="Reportes" value="0/3" hint="bimestrales" />
                <PreviewKpi label="Evidencias" value="0" hint="pendientes" />
                <PreviewKpi label="Horas" value="0/480" hint="acumuladas" />
              </div>

              <div className="eco-progress">
                <div className="eco-progress-head">
                  <span>Progreso</span>
                  <span className="eco-muted">Bimestre 1 · 2 · 3</span>
                </div>
                <div className="eco-progress-track" aria-hidden="true">
                  <div className="eco-progress-bar" style={{ width: "22%" }} />
                </div>
                <div className="eco-progress-foot eco-muted">
                  Cada reporte aprobado equivale a 160h
                </div>
              </div>

              <div className="eco-preview-list">
                <MiniRow
                  title="Evidencia: Actividad comunitaria"
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
                  <div className="eco-empty-title">Todo claro</div>
                  <div className="eco-empty-text">Seguimiento simple y verificable.</div>
                </div>
              </div>
            </div>

            <div className="eco-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ======= Módulos ======= */}
      <section id="modulos" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <h2 className="eco-h2">Módulos principales</h2>
            <p className="eco-sub">
              Un sistema completo para administrar el servicio social sin perder evidencias, reportes o trazabilidad.
            </p>
          </div>

          <div className="eco-grid eco-grid-3">
            <Feature
              icon="📌"
              title="Actividades"
              desc="Explora actividades disponibles, requisitos y cupo. Inscripción clara y controlada."
            />
            <Feature
              icon="📎"
              title="Evidencias"
              desc="Sube evidencias por actividad, con estatus (aprobada/pendiente/rechazada) y feedback."
            />
            <Feature
              icon="🧾"
              title="Reportes"
              desc="Entrega bimestral centralizada con verificación. Menos correos, más orden."
            />
            <Feature
              icon="📈"
              title="Progreso"
              desc="Visualiza horas, reportes y avances por etapas para saber exactamente qué falta."
            />
            <Feature
              icon="🎫"
              title="Tickets"
              desc="Soporte con trazabilidad: abre un ticket, sigue el estado y conserva historial."
            />
            <Feature
              icon="🤖"
              title="EcoBot"
              desc="Asistente que guía pasos frecuentes (qué subir, dónde, y cómo resolver dudas)."
            />
          </div>
        </div>
      </section>

      {/* ======= Roles ======= */}
      <section id="roles" className="eco-section eco-section-alt">
        <div className="eco-container">
          <div className="eco-section-head">
            <h2 className="eco-h2">Roles</h2>
            <p className="eco-sub">
              Dos experiencias claras: estudiantes para ejecutar y admins para validar y acompañar.
            </p>
          </div>

          <div className="eco-grid eco-grid-2">
            <Role
              tone="ok"
              title="Prestador (Estudiante)"
              subtitle="Gestiona y entrega con orden"
              bullets={[
                "Explora actividades e inscríbete",
                "Sube evidencias y revisa estatus",
                "Entrega reportes bimestrales",
                "Recibe comentarios y seguimiento",
                "Solicita soporte con EcoBot o Tickets",
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
                "Aprueba / rechaza con comentarios",
                "Gestiona tickets y seguimiento",
                "Organiza actividades y cupos",
                "Consulta indicadores de avance",
              ]}
              ctaText="Entrar como admin"
              ctaTo="/login"
            />
          </div>
        </div>
      </section>

      {/* ======= Cómo funciona ======= */}
      <section id="como-funciona" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <h2 className="eco-h2">Cómo funciona</h2>
            <p className="eco-sub">Un flujo simple para que el proceso sea claro desde el día 1.</p>
          </div>

          <div className="eco-steps">
            <Step n="1" title="Crea tu cuenta" desc="Regístrate y entra al sistema con tu rol." />
            <Step n="2" title="Participa en actividades" desc="Inscríbete, completa actividades y registra evidencias." />
            <Step n="3" title="Sube evidencias y reportes" desc="Carga documentos y revisa estatus con comentarios." />
            <Step n="4" title="Cierra con trazabilidad" desc="Horas y reportes organizados: todo queda registrado." />
          </div>

          <div className="eco-callout">
            <div className="eco-callout-title">Diseñado para evitar el caos</div>
            <p className="eco-callout-text">
              Centraliza entregas y validaciones. Menos WhatsApp, menos correos, más claridad.
            </p>
          </div>
        </div>
      </section>

      {/* ======= Beneficios ======= */}
      <section id="beneficios" className="eco-section eco-section-alt">
        <div className="eco-container">
          <div className="eco-section-head">
            <h2 className="eco-h2">Beneficios</h2>
            <p className="eco-sub">Lo que hace que EcoSteps se sienta “profesional” y útil en la práctica.</p>
          </div>

          <div className="eco-grid eco-grid-4">
            <Benefit title="Estandarización" desc="Formatos claros para evidencias y reportes. Sin dudas." />
            <Benefit title="Orden real" desc="Todo centralizado con estatus, historial y trazabilidad." />
            <Benefit title="Transparencia" desc="Comentarios y decisiones visibles: menos confusión." />
            <Benefit title="Acompañamiento" desc="Soporte guiado para avanzar sin atorarte." />
          </div>

          <div className="eco-testimonials">
            <Testimonial
              quote="Ahora sé exactamente qué subir y en qué etapa voy. Ya no ando adivinando."
              name="Estudiante"
              role="Prestador"
            />
            <Testimonial
              quote="Validar evidencias es más rápido y queda registro. Eso era lo que faltaba."
              name="Administrador"
              role="Coordinación"
            />
            <Testimonial
              quote="El flujo de tickets + bot reduce dudas repetidas y mejora el seguimiento."
              name="Soporte"
              role="Operación"
            />
          </div>
        </div>
      </section>

      {/* ======= FAQ ======= */}
      <section id="faq" className="eco-section">
        <div className="eco-container">
          <div className="eco-section-head">
            <h2 className="eco-h2">Preguntas frecuentes</h2>
            <p className="eco-sub">Respuestas cortas, claras y sin humo.</p>
          </div>

          <div className="eco-faq">
            <Faq
              q="¿EcoSteps reemplaza todo lo que ya hago?"
              a="Centraliza y ordena: actividades, evidencias, reportes y soporte. Reduce fricción y mejora trazabilidad."
            />
            <Faq
              q="¿Cómo se valida una evidencia o reporte?"
              a="El administrador revisa, aprueba o rechaza con comentarios. El estudiante ve el estatus en su panel."
            />
            <Faq
              q="¿Qué pasa si tengo un problema?"
              a="Puedes usar EcoBot para dudas comunes o abrir un ticket para seguimiento formal (estado e historial)."
            />
          </div>

          <div className="eco-final-cta">
            <div>
              <div className="eco-final-cta-title">Listo para empezar tu Servicio Social con orden</div>
              <div className="eco-final-cta-sub">Crea tu cuenta y prueba el flujo en minutos.</div>
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

      {/* ======= Footer ======= */}
      <footer className="eco-footer">
        <div className="eco-container eco-footer-inner">
          <div className="eco-footer-left">
            <div className="eco-footer-brand">
              <span className="eco-footer-mark" aria-hidden="true">🌿</span>
              EcoSteps SGSS
            </div>
            <div className="eco-footer-sub">
              Plataforma para gestionar Servicio Social con seguimiento, evidencias y soporte.
            </div>
            <div className="eco-footer-copy">© {year} EcoSteps</div>
          </div>

          <div className="eco-footer-right">
            {NAV_ITEMS.map((item) => (
              <a key={item.id} className="eco-footer-link" href={`#${item.id}`} onClick={onNavClick(item.id)}>
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

/* ========== UI Components ========== */

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
            <span className="eco-check" aria-hidden="true">✓</span>
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
                c.tone === "ok" ? "eco-chip-ok" : c.tone === "warn" ? "eco-chip-warn" : "eco-chip-muted"
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