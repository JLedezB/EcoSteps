import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function LandingPage() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="eco-landing">
      {/* ==========================
          TOPBAR (compact on scroll)
         ========================== */}
      <header className={`eco-landing-topbar ${compact ? "is-compact" : ""}`}>
        <div className="eco-landing-container eco-landing-topbar-inner">
          <div className="eco-brand">
            {/* Si tienes logo:
                <img className="eco-brand-logo" src="/assets/logo.png" alt="EcoSteps" />
            */}
            <div className="eco-brand-text">
              <div className="eco-brand-name">EcoSteps</div>
              <div className="eco-brand-sub">SGSS • Servicio Social</div>
            </div>
          </div>

          <nav className="eco-landing-nav" aria-label="Navegación principal">
            <a className="eco-nav-link" href="#modulos">Módulos</a>
            <a className="eco-nav-link" href="#roles">Roles</a>
            <a className="eco-nav-link" href="#bolsa">Bolsa de trabajo</a>
            <a className="eco-nav-link" href="#como-funciona">Cómo funciona</a>
            <a className="eco-nav-link" href="#beneficios">Beneficios</a>
          </nav>

          <div className="eco-landing-cta">
            <Link className="btn btn-eco-ghost" to="/login">Iniciar sesión</Link>
            <Link className="btn btn-eco-solid" to="/register">Crear cuenta</Link>
          </div>
        </div>
      </header>

      {/* ==========================
          HERO
         ========================== */}
      <section className="eco-hero" id="top">
        <div className="eco-landing-container eco-hero-grid">
          <div className="eco-hero-left eco-anim-in">
            <div className="eco-hero-badge">
              <span className="eco-dot" />
              Plataforma para Servicio Social
            </div>

            <h1 className="eco-hero-title">
              Digitaliza, organiza y valida tu{" "}
              <span className="eco-hero-highlight">Servicio Social</span> en un solo lugar
            </h1>

            <p className="eco-hero-text">
              EcoSteps SGSS te ayuda a llevar tu servicio social con claridad:
              <b> actividades</b>, <b>evidencias</b>, <b>reportes</b> y <b>soporte</b> en una experiencia simple.
            </p>

            <div className="eco-hero-actions">
              <Link className="btn btn-eco-solid" to="/register">Empezar</Link>
              <a className="btn btn-eco-ghost" href="#como-funciona">Ver cómo funciona</a>
            </div>

            <div className="eco-hero-stats" aria-label="Resumen rápido">
              <Stat k="Actividades" v="En un solo lugar" />
              <Stat k="Evidencias" v="Ordenadas y revisadas" />
              <Stat k="Soporte" v="EcoBot + Tickets" />
            </div>
          </div>

          <div className="eco-hero-right eco-anim-in eco-delay-1">
            <div className="eco-hero-card">
              <div className="eco-hero-card-head">
                <div>
                  <div className="eco-hero-card-title">Tu progreso, claro</div>
                  <div className="eco-hero-card-sub">Ejemplo de seguimiento</div>
                </div>
                <span className="eco-chip eco-chip-ok">Al día</span>
              </div>

              <div className="eco-hero-kpis">
                <div className="eco-kpi">
                  <div className="eco-kpi-title">Actividades</div>
                  <div className="eco-kpi-value">Disponibles</div>
                  <div className="eco-kpi-hint">para participar</div>
                </div>
                <div className="eco-kpi">
                  <div className="eco-kpi-title">Evidencias</div>
                  <div className="eco-kpi-value">Subidas</div>
                  <div className="eco-kpi-hint">con estatus</div>
                </div>
                <div className="eco-kpi">
                  <div className="eco-kpi-title">Progreso</div>
                  <div className="eco-kpi-value">Visible</div>
                  <div className="eco-kpi-hint">por etapas</div>
                </div>
              </div>

              <div className="eco-hero-list">
                <div className="eco-row">
                  <div className="eco-row-main">
                    <div className="eco-row-title">Evidencia: Actividad</div>
                    <div className="eco-row-sub">
                      <span className="eco-chip eco-chip-muted">Documento</span>
                      <span className="eco-chip eco-chip-ok">Aprobada</span>
                    </div>
                  </div>
                  <div className="eco-row-actions">
                    <button className="btn btn-eco-ghost" type="button" disabled>
                      Ver
                    </button>
                  </div>
                </div>

                <div className="eco-row">
                  <div className="eco-row-main">
                    <div className="eco-row-title">Ticket: Duda</div>
                    <div className="eco-row-sub">
                      <span className="eco-chip eco-chip-warn">En proceso</span>
                    </div>
                  </div>
                  <div className="eco-row-actions">
                    <button className="btn btn-eco-ghost" type="button" disabled>
                      Revisar
                    </button>
                  </div>
                </div>

                <div className="eco-empty-state eco-empty-compact">
                  <div className="eco-empty-icon">🌿</div>
                  <h3 className="eco-empty-title">Todo en orden</h3>
                  <p className="eco-empty-text">
                    Mantén tu servicio social organizado y con seguimiento.
                  </p>
                </div>
              </div>
            </div>

            <div className="eco-hero-glow" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ==========================
          MÓDULOS
         ========================== */}
      <section id="modulos" className="eco-section">
        <div className="eco-landing-container">
          <h2 className="eco-section-title">Módulos principales</h2>
          <p className="eco-section-sub">
            Todo lo que necesitas para llevar tu servicio social de forma ordenada.
          </p>

          <div className="eco-feature-grid">
            <FeatureCard title="Actividades" desc="Consulta actividades y lo que se requiere para completarlas." badge="Estudiante" />
            <FeatureCard title="Evidencias" desc="Sube evidencias por actividad y revisa su estatus." badge="Seguimiento" />
            <FeatureCard title="Reportes" desc="Entrega tus reportes de forma clara y centralizada." badge="Entrega" />
            <FeatureCard title="Tickets" desc="Pide apoyo cuando tengas dudas o problemas." badge="Soporte" />
            <FeatureCard title="Progreso" desc="Visualiza tu avance y lo pendiente por completar." badge="Control" />
            <FeatureCard title="EcoBot" desc="Asistente para guiarte en pasos comunes del sistema." badge="Ayuda" />
          </div>
        </div>
      </section>

      {/* ==========================
          ROLES
         ========================== */}
      <section id="roles" className="eco-section eco-section-alt">
        <div className="eco-landing-container">
          <h2 className="eco-section-title">Roles</h2>
          <p className="eco-section-sub">
            EcoSteps SGSS se adapta a lo que necesitas según tu rol.
          </p>

          <div className="eco-roles-grid">
            <RoleCard
              title="Prestador (Estudiante)"
              subtitle="Gestiona tu servicio social"
              items={[
                "Explora actividades y participa",
                "Sube evidencias por actividad",
                "Entrega reportes en un solo lugar",
                "Revisa estatus y comentarios",
                "Solicita ayuda con tickets o EcoBot",
              ]}
              ctaText="Entrar como estudiante"
              ctaTo="/login"
              variant="user"
            />

            <RoleCard
              title="Administrador"
              subtitle="Da seguimiento y valida"
              items={[
                "Revisa evidencias y reportes",
                "Acompaña el proceso con comentarios",
                "Gestiona solicitudes y tickets",
                "Mantiene orden y trazabilidad",
                "Consulta indicadores de avance",
              ]}
              ctaText="Entrar como admin"
              ctaTo="/login"
              variant="admin"
            />
          </div>
        </div>
      </section>

      {/* ==========================
          BOLSA DE TRABAJO (teaser)
         ========================== */}
      <section id="bolsa" className="eco-section">
        <div className="eco-landing-container">
          <div className="eco-teaser card-soft">
            <div className="eco-teaser-left">
              <div className="eco-teaser-badge">Próximamente</div>
              <h2 className="eco-teaser-title">Bolsa de Trabajo</h2>
              <p className="eco-teaser-text">
                Un espacio para conectar a estudiantes con oportunidades alineadas a su perfil y experiencia
                durante el servicio social.
              </p>

              <div className="eco-teaser-points">
                <span className="eco-pill">Oportunidades por área</span>
                <span className="eco-pill">Perfil y habilidades</span>
                <span className="eco-pill">Postulación simple</span>
              </div>
            </div>

            <div className="eco-teaser-right">
              <div className="eco-teaser-mini">
                <div className="eco-teaser-mini-title">Tu perfil</div>
                <div className="eco-teaser-mini-sub">Intereses • Área • Experiencia</div>
              </div>

              <div className="eco-teaser-mini">
                <div className="eco-teaser-mini-title">Recomendaciones</div>
                <div className="eco-teaser-mini-sub">Oportunidades sugeridas</div>
              </div>

              <div className="eco-teaser-mini eco-teaser-mini-accent">
                <div className="eco-teaser-mini-title">Aplicación</div>
                <div className="eco-teaser-mini-sub">Postula en pocos pasos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================
          CÓMO FUNCIONA
         ========================== */}
      <section id="como-funciona" className="eco-section eco-section-alt">
        <div className="eco-landing-container">
          <h2 className="eco-section-title">Cómo funciona</h2>
          <p className="eco-section-sub">
            Un flujo simple para que tu servicio social sea claro y verificable.
          </p>

          <div className="eco-steps">
            <Step num="1" title="Regístrate" desc="Crea tu cuenta y accede al sistema." />
            <Step num="2" title="Realiza actividades" desc="Participa y mantén tu avance actualizado." />
            <Step num="3" title="Entrega evidencias y reportes" desc="Sube tus documentos y revisa el estatus." />
            <Step num="4" title="Soporte" desc="Resuelve dudas con EcoBot o con tickets de apoyo." />
          </div>
        </div>
      </section>

      {/* ==========================
          BENEFICIOS
         ========================== */}
      <section id="beneficios" className="eco-section">
        <div className="eco-landing-container">
          <h2 className="eco-section-title">Beneficios</h2>

          <div className="eco-benefits-grid">
            <Benefit title="Estandarización" desc="Todo con un formato claro: evidencias, reportes y actividades." />
            <Benefit title="Orden" desc="Menos confusión: todo centralizado, con estatus y seguimiento." />
            <Benefit title="Transparencia" desc="Revisa comentarios y avances en cada entrega." />
            <Benefit title="Acompañamiento" desc="Soporte guiado para que no te quedes atorado." />
          </div>
        </div>
      </section>

      {/* ==========================
          CTA
         ========================== */}
      <section className="eco-cta-block">
        <div className="eco-landing-container eco-cta-inner">
          <div>
            <h2 className="eco-cta-title">¿Listo para empezar tu servicio social?</h2>
            <p className="eco-cta-text">
              Entra a EcoSteps SGSS y lleva tu proceso con claridad.
            </p>
          </div>
          <div className="eco-cta-actions">
            <Link className="btn btn-eco-solid" to="/register">Crear cuenta</Link>
            <Link className="btn btn-eco-ghost" to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </section>

      {/* ==========================
          FOOTER
         ========================== */}
      <footer className="eco-footer">
        <div className="eco-landing-container eco-footer-inner">
          <div className="eco-footer-left">
            <div className="eco-footer-brand">EcoSteps SGSS</div>
            <div className="eco-footer-sub">
              Plataforma para llevar tu servicio social con orden y seguimiento.
            </div>
            <div className="eco-footer-copy">© {year} EcoSteps</div>
          </div>

          <div className="eco-footer-right">
            <a className="eco-footer-link" href="#modulos">Módulos</a>
            <a className="eco-footer-link" href="#roles">Roles</a>
            <a className="eco-footer-link" href="#bolsa">Bolsa</a>
            <a className="eco-footer-link" href="#como-funciona">Cómo funciona</a>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <a className="eco-backtop" href="#top" aria-label="Volver arriba">↑</a>
    </div>
  );
}

/* ==============================
   UI pieces
============================== */

function Stat({ k, v }) {
  return (
    <div className="eco-stat">
      <div className="eco-stat-k">{k}</div>
      <div className="eco-stat-v">{v}</div>
    </div>
  );
}

function FeatureCard({ title, desc, badge }) {
  return (
    <div className="eco-feature card-soft eco-hover-lift">
      <div className="eco-feature-head">
        <h3 className="eco-feature-title">{title}</h3>
        <span className="eco-chip eco-chip-muted">{badge}</span>
      </div>
      <p className="eco-feature-desc">{desc}</p>
      <div className="eco-feature-foot">
        <span className="eco-mini">EcoSteps • SGSS</span>
      </div>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="eco-step card-soft eco-hover-lift">
      <div className="eco-step-num">{num}</div>
      <div className="eco-step-body">
        <div className="eco-step-title">{title}</div>
        <div className="eco-step-desc">{desc}</div>
      </div>
    </div>
  );
}

function Benefit({ title, desc }) {
  return (
    <div className="eco-benefit card-soft eco-hover-lift">
      <div className="eco-benefit-title">{title}</div>
      <div className="eco-benefit-desc">{desc}</div>
    </div>
  );
}

function RoleCard({ title, subtitle, items, ctaText, ctaTo, variant }) {
  return (
    <div className={`eco-role card-soft eco-hover-lift ${variant === "admin" ? "is-admin" : "is-user"}`}>
      <div className="eco-role-head">
        <div>
          <div className="eco-role-title">{title}</div>
          <div className="eco-role-sub">{subtitle}</div>
        </div>
        <span className={`eco-chip ${variant === "admin" ? "eco-chip-warn" : "eco-chip-ok"}`}>
          {variant === "admin" ? "Gestión" : "Estudiante"}
        </span>
      </div>

      <ul className="eco-role-list">
        {items.map((t, i) => (
          <li key={i} className="eco-role-item">✓ {t}</li>
        ))}
      </ul>

      <div className="eco-role-foot">
        <Link className="btn btn-eco-solid" to={ctaTo}>{ctaText}</Link>
      </div>
    </div>
  );
}
