import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getDashboardUrl } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardUrl());
    }
  }, [isAuthenticated, navigate, getDashboardUrl]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2"/>
          <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Développement Web',
      description: 'Sites vitrine, e-commerce et plateformes sur mesure. Développés selon les derniers standards en design, sécurité et expérience utilisateur.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Maintenance & Gestion',
      description: 'Monitoring technique, mises à jour, sauvegardes automatiques, optimisation des performances et support technique continu.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
          <path d="M12 8v4l3 3" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Design Graphique',
      description: 'Création de logos, chartes graphiques, supports de communication, visuels réseaux sociaux et présentations professionnelles.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 4s-2.5 3-8 3-8-3-8-3v7c0 5.25 8 9 8 9s8-3.75 8-9V4z" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Réseaux Sociaux',
      description: 'Stratégie de contenu, création graphique, planification éditoriale, community management et reporting analytique.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeWidth="2"/>
          <path d="M22 6l-10 7L2 6" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'E-mail Marketing',
      description: 'Campagnes ciblées, marketing automation, newsletters professionnelles et gestion des bases de données clients.'
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2"/>
        </svg>
      ),
      title: 'Solutions Sur Mesure',
      description: 'Plateformes personnalisées adaptées aux besoins réels de chaque client, avec un accompagnement stratégique et un support technique à long terme.'
    }
  ];

  const whyUs = [
    { title: 'Solutions personnalisées', desc: 'Adaptées aux besoins réels de chaque client' },
    { title: 'Tarification claire', desc: 'Accessible pour les entreprises en démarrage' },
    { title: 'Équipe compétente', desc: 'Jeune, réactive et passionnée par le digital' },
    { title: 'Support stratégique', desc: 'Accompagnement et support technique à long terme' },
    { title: 'Maîtrise technologique', desc: 'Dernières technologies web et tendances digitales' },
  ];

  const targets = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Startups & Nouveaux Projets',
      desc: 'Accompagnement pour une présence numérique solide et évolutive dès le départ.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeWidth="2"/>
        </svg>
      ),
      title: 'PME',
      desc: 'Professionnalisation de la communication digitale et renforcement de la présence en ligne.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
          <circle cx="12" cy="7" r="4" strokeWidth="2"/>
        </svg>
      ),
      title: 'Indépendants & Experts',
      desc: 'Renforcement de l\'image de marque et de la crédibilité en ligne pour les professionnels.'
    }
  ];

  const stats = [
    { value: '100+', label: 'Clients Satisfaits' },
    { value: '5+', label: "Années d'Expertise" },
    { value: '200+', label: 'Projets Livrés' },
    { value: '100%', label: 'Sur Mesure' },
  ];

  return (
    <div className="home-page">

      {/* ── HEADER ── */}
      <header className={`home-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">PT</div>
              <div className="logo-text">
                <span className="pioneer">PIONEER</span>
                <span className="tech">ONLINE TECH SERVICES</span>
              </div>
            </div>

            <nav className="nav-menu">
              <a href="#services" className="nav-link">Services</a>
              <a href="#about" className="nav-link">À propos</a>
              <a href="#clients" className="nav-link">Clients</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>

            <div className="header-actions">
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Connexion
              </button>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Accéder à la plateforme
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-orb orb-1"></div>
          <div className="hero-orb orb-2"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                Entreprise digitale · Tunisie
              </div>
              <h1 className="hero-title">
                Votre transformation
                <span className="hero-accent"> digitale</span>
                <br />commence ici
              </h1>
              <p className="hero-subtitle">
                Pioneer Online Tech Services accompagne les startups, PME et professionnels
                dans leur transformation digitale avec des solutions numériques sur mesure,
                innovantes et adaptées à leurs objectifs.
              </p>
              <div className="hero-buttons">
                <button className="btn-hero-primary" onClick={() => navigate('/login')}>
                  Accéder à la plateforme
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <a href="#services" className="btn-hero-secondary">
                  Découvrir nos services
                </a>
              </div>

              <div className="hero-stats">
                {stats.map((s, i) => (
                  <div key={i} className="stat-item">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-card card-main">
                <div className="vc-header">
                  <div className="vc-dot"></div>
                  <div className="vc-dot"></div>
                  <div className="vc-dot"></div>
                  <span>Pioneer Tech — Dashboard</span>
                </div>
                <div className="vc-body">
                  <div className="vc-sidebar">
                    <div className="vc-nav-item active"></div>
                    <div className="vc-nav-item"></div>
                    <div className="vc-nav-item"></div>
                    <div className="vc-nav-item"></div>
                  </div>
                  <div className="vc-main">
                    <div className="vc-stats-row">
                      <div className="vc-stat orange"></div>
                      <div className="vc-stat gray"></div>
                      <div className="vc-stat gray"></div>
                    </div>
                    <div className="vc-cards">
                      <div className="vc-card"></div>
                      <div className="vc-card"></div>
                      <div className="vc-card"></div>
                      <div className="vc-card"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="visual-badge badge-a">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/><polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round"/></svg>
                Projet livré
              </div>
              <div className="visual-badge badge-b">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/><circle cx="9" cy="7" r="4" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/></svg>
                Équipe active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Nos expertises</div>
            <h2 className="section-title">Des solutions digitales complètes</h2>
            <p className="section-subtitle">
              De la conception à la livraison, Pioneer Tech couvre l'ensemble de vos besoins digitaux
            </p>
          </div>

          <div className="services-grid">
            {services.map((s, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.description}</p>
                <div className="service-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / WHY US ── */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-left">
              <div className="section-tag">Pourquoi nous choisir</div>
              <h2 className="about-title">
                Une équipe passionnée au service de votre
                <span className="hero-accent"> succès digital</span>
              </h2>
              <p className="about-desc">
                Pioneer Tech est une entreprise digitale basée en Tunisie, spécialisée dans
                la conception et la mise en œuvre de solutions numériques sur mesure.
                Notre mission : accompagner les marques dans leur transformation digitale
                avec des services innovants, flexibles et adaptés à leurs objectifs.
              </p>
              <ul className="why-list">
                {whyUs.map((w, i) => (
                  <li key={i} className="why-item">
                    <div className="why-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <strong>{w.title}</strong>
                      <span> — {w.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="btn-about" onClick={() => navigate('/login')}>
                Accéder à la plateforme
              </button>
            </div>

            <div className="about-right">
              <div className="advantages-grid">
                {[
                  { icon: '⚙', label: 'Maîtrise technologique' },
                  { icon: '👥', label: 'Équipe compétente' },
                  { icon: '✦', label: 'Solutions personnalisées' },
                  { icon: '◈', label: 'Support stratégique' },
                  { icon: '◉', label: 'Tarification claire' },
                ].map((a, i) => (
                  <div key={i} className={`adv-card adv-${i}`}>
                    <div className="adv-icon">{a.icon}</div>
                    <div className="adv-label">{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENTS CIBLES ── */}
      <section id="clients" className="clients-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Nos clients cibles</div>
            <h2 className="section-title">Qui accompagnons-nous ?</h2>
            <p className="section-subtitle">
              Pioneer Tech s'adresse aux entreprises et professionnels qui souhaitent renforcer leur présence numérique
            </p>
          </div>

          <div className="targets-grid">
            {targets.map((t, i) => (
              <div key={i} className="target-card">
                <div className="target-icon">{t.icon}</div>
                <h3 className="target-title">{t.title}</h3>
                <p className="target-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-bg">
          <div className="cta-orb"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Prêt à démarrer votre projet digital ?
            </h2>
            <p className="cta-subtitle">
              Rejoignez les entreprises qui font confiance à Pioneer Online Tech Services
              pour leur transformation digitale
            </p>
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => navigate('/login')}>
                Accéder à la plateforme
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <a href="mailto:contact@pioneertech.tn" className="btn-cta-secondary">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">PT</div>
                <div className="logo-text">
                  <span className="pioneer">PIONEER</span>
                  <span className="tech">ONLINE TECH SERVICES</span>
                </div>
              </div>
              <p className="footer-tagline">
                Solutions numériques sur mesure pour startups, PME et professionnels.
                Basés en Tunisie.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <a href="#services">Développement Web</a>
                <a href="#services">Maintenance</a>
                <a href="#services">Design Graphique</a>
                <a href="#services">Réseaux Sociaux</a>
                <a href="#services">E-mail Marketing</a>
              </div>
              <div className="footer-column">
                <h4>Entreprise</h4>
                <a href="#about">À propos</a>
                <a href="#clients">Nos clients</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Plateforme</h4>
                <a href="/login">Connexion</a>
                <a href="#contact">Demander un accès</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Pioneer Online Tech Services. Tous droits réservés. · Tunisie</p>
            <div className="footer-social">
              <a href="#linkedin" aria-label="LinkedIn">in</a>
              <a href="#facebook" aria-label="Facebook">f</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;