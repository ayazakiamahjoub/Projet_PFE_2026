import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getDashboardUrl } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const dashboardUrl = getDashboardUrl();
      navigate(dashboardUrl);
    }
  }, [isAuthenticated, navigate, getDashboardUrl]);

  // Détecter le scroll pour changer le header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Gestion de Projets',
      description: 'Organisez et suivez vos projets avec une interface intuitive et puissante.'
    },
    {
      icon: '👥',
      title: 'Collaboration d\'Équipe',
      description: 'Travaillez ensemble efficacement avec des outils de collaboration en temps réel.'
    },
    {
      icon: '📊',
      title: 'Tableaux de Bord',
      description: 'Visualisez vos performances avec des tableaux de bord personnalisés et des rapports détaillés.'
    },
    {
      icon: '⚡',
      title: 'Performance Optimale',
      description: 'Plateforme rapide et réactive pour une productivité maximale.'
    },
    {
      icon: '🔒',
      title: 'Sécurité Avancée',
      description: 'Vos données sont protégées avec les dernières technologies de sécurité.'
    },
    {
      icon: '📱',
      title: 'Multi-Plateformes',
      description: 'Accédez à vos projets depuis n\'importe quel appareil, n\'importe où.'
    }
  ];

  const testimonials = [
    {
      name: 'Sophie Martin',
      role: 'Chef de Projet',
      company: 'TechCorp',
      avatar: 'SM',
      text: 'Pioneer Tech a transformé notre façon de gérer les projets. Un outil indispensable !'
    },
    {
      name: 'Jean Dupont',
      role: 'Directeur Technique',
      company: 'InnovateLab',
      avatar: 'JD',
      text: 'Interface intuitive et fonctionnalités puissantes. Exactement ce dont nous avions besoin.'
    },
    {
      name: 'Marie Lambert',
      role: 'Product Manager',
      company: 'StartupX',
      avatar: 'ML',
      text: 'La collaboration d\'équipe n\'a jamais été aussi simple. Bravo à l\'équipe Pioneer Tech !'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Utilisateurs Actifs' },
    { value: '50K+', label: 'Projets Créés' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'Satisfaction Client' }
  ];

  return (
    <div className="home-page">
      {/* Header / Navbar */}
      <header className={`home-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">PT</div>
              <span className="logo-text">
                <span className="pioneer">PIONEER</span>
                <span className="tech">TECH</span>
              </span>
            </div>

            <nav className="nav-menu">
              <a href="#features" className="nav-link">Fonctionnalités</a>
              <a href="#about" className="nav-link">À propos</a>
              <a href="#testimonials" className="nav-link">Témoignages</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>

            <div className="header-actions">
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Connexion
              </button>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Commencer
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-shape shape-1"></div>
          <div className="hero-shape shape-2"></div>
          <div className="hero-shape shape-3"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Gérez vos projets avec
                <span className="gradient-text"> simplicité et efficacité</span>
              </h1>
              <p className="hero-subtitle">
                Pioneer Tech est la plateforme de gestion de projets moderne qui transforme 
                votre façon de travailler. Collaborez, organisez et réussissez ensemble.
              </p>
              <div className="hero-buttons">
                <button className="btn-hero-primary" onClick={() => navigate('/register')}>
                  <span>Essayer gratuitement</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                  </svg>
                  <span>Voir la démo</span>
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-image">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-dot"></div>
                  <div className="mockup-dot"></div>
                  <div className="mockup-dot"></div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-sidebar"></div>
                  <div className="mockup-main">
                    <div className="mockup-card"></div>
                    <div className="mockup-card"></div>
                    <div className="mockup-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Fonctionnalités puissantes</h2>
            <p className="section-subtitle">
              Tout ce dont vous avez besoin pour gérer vos projets efficacement
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <div className="about-card card-1">
                <div className="card-icon">📊</div>
                <div className="card-text">
                  <div className="card-title">Productivité +47%</div>
                  <div className="card-subtitle">En moyenne</div>
                </div>
              </div>
              <div className="about-card card-2">
                <div className="card-icon">⚡</div>
                <div className="card-text">
                  <div className="card-title">Temps économisé</div>
                  <div className="card-subtitle">15h par semaine</div>
                </div>
              </div>
              <div className="about-card card-3">
                <div className="card-icon">🎯</div>
                <div className="card-text">
                  <div className="card-title">Projets réussis</div>
                  <div className="card-subtitle">+92% de succès</div>
                </div>
              </div>
            </div>

            <div className="about-text">
              <h2 className="about-title">
                Pourquoi choisir <span className="gradient-text">Pioneer Tech</span> ?
              </h2>
              <p className="about-description">
                Pioneer Tech a été conçu par des chefs de projet, pour des chefs de projet. 
                Notre plateforme combine simplicité d'utilisation et fonctionnalités avancées 
                pour vous permettre de vous concentrer sur l'essentiel : la réussite de vos projets.
              </p>
              <ul className="about-list">
                <li>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.2"/>
                    <path d="M9 12l2 2 4-4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Interface intuitive et moderne
                </li>
                <li>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.2"/>
                    <path d="M9 12l2 2 4-4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Collaboration en temps réel
                </li>
                <li>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.2"/>
                    <path d="M9 12l2 2 4-4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Support client réactif 24/7
                </li>
                <li>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#FF6B35" opacity="0.2"/>
                    <path d="M9 12l2 2 4-4" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Sécurité et confidentialité garanties
                </li>
              </ul>
              <button className="btn-about" onClick={() => navigate('/register')}>
                Commencer gratuitement
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Ce que disent nos utilisateurs</h2>
            <p className="section-subtitle">
              Rejoignez des milliers d'équipes qui font confiance à Pioneer Tech
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div className="testimonial-info">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role} • {testimonial.company}</div>
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-stars">
                  {'★★★★★'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Prêt à transformer votre gestion de projets ?</h2>
            <p className="cta-subtitle">
              Rejoignez Pioneer Tech aujourd'hui et découvrez une nouvelle façon de travailler
            </p>
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => navigate('/register')}>
                Commencer gratuitement
              </button>
              <button className="btn-cta-secondary" onClick={() => navigate('/login')}>
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">PT</div>
                <span className="logo-text">
                  <span className="pioneer">PIONEER</span>
                  <span className="tech">TECH</span>
                </span>
              </div>
              <p className="footer-tagline">
                La plateforme moderne de gestion de projets
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4>Produit</h4>
                <a href="#features">Fonctionnalités</a>
                <a href="#pricing">Tarifs</a>
                <a href="#demo">Démo</a>
              </div>
              <div className="footer-column">
                <h4>Entreprise</h4>
                <a href="#about">À propos</a>
                <a href="#careers">Carrières</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Ressources</h4>
                <a href="#blog">Blog</a>
                <a href="#docs">Documentation</a>
                <a href="#support">Support</a>
              </div>
              <div className="footer-column">
                <h4>Légal</h4>
                <a href="#privacy">Confidentialité</a>
                <a href="#terms">Conditions</a>
                <a href="#security">Sécurité</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Pioneer Tech. Tous droits réservés.</p>
            <div className="footer-social">
              <a href="#linkedin" aria-label="LinkedIn">in</a>
              <a href="#twitter" aria-label="Twitter">𝕏</a>
              <a href="#github" aria-label="GitHub">⚙</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;