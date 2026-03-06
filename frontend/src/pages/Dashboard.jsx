import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const stats = [
    { 
      label: 'Projets actifs', 
      value: '12', 
      icon: '📁',
      trend: '+18% ce mois'
    },
    { 
      label: 'Tâches en cours', 
      value: '48', 
      icon: '✓',
      trend: '+12% ce mois'
    },
    { 
      label: 'Membres actifs', 
      value: '24', 
      icon: '👥',
      trend: '+3 nouveaux'
    },
    { 
      label: 'Taux de réussite', 
      value: '94%', 
      icon: '📊',
      trend: '+5% ce mois'
    }
  ];

  return (
    <div className="dashboard-clean">
      {/* Header épuré */}
      <header className="header-clean">
        <div className="header-wrapper">
          {/* Logo minimaliste */}
          <div className="brand">
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Dashboard</span>
            </div>
          </div>

          {/* Actions header */}
          <div className="header-end">
            {/* Profil utilisateur */}
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${user.avatarUrl}`} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="avatar-img"
                  />
                ) : (
                  <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
                )}
              </div>
              <div className="profile-details">
                <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                <span className="profile-role">{user?.role}</span>
              </div>
            </div>

            {/* Bouton déconnexion */}
            <button className="btn-logout" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5m0 0l-5-5m5 5H9" 
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="content">
        <div className="content-wrapper">
          {/* Section bienvenue */}
          <div className="welcome">
            <h1 className="page-title">
              {getGreeting()}, {user?.firstName}
            </h1>
            <p className="page-subtitle">
              Voici un aperçu de votre activité aujourd'hui
            </p>
          </div>

          {/* Grille de statistiques */}
          <div className="stats-row">
            {stats.map((stat, index) => (
              <div key={index} className="stat-box">
                <div className="stat-header">
                  <span className="stat-emoji">{stat.icon}</span>
                  <span className="stat-trend">{stat.trend}</span>
                </div>
                <div className="stat-body">
                  <h2 className="stat-number">{stat.value}</h2>
                  <p className="stat-text">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grille de contenu */}
          <div className="grid">
            {/* Carte informations */}
            <div className="box">
              <div className="box-header">
                <h3 className="box-title">Informations du compte</h3>
              </div>
              <div className="box-content">
                <div className="info-rows">
                  <div className="info-row">
                    <span className="info-key">Email</span>
                    <span className="info-val">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Rôle</span>
                    <span className="pill pill-orange">{user?.role}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Statut</span>
                    <span className="pill pill-green">
                      <span className="pill-dot"></span>
                      Actif
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Dernière connexion</span>
                    <span className="info-val">
                      {user?.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Aujourd\'hui'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte actions rapides */}
            <div className="box">
              <div className="box-header">
                <h3 className="box-title">Actions rapides</h3>
              </div>
              <div className="box-content">
                <div className="actions">
                  <button className="action" onClick={() => navigate('/profile')}>
        <div className="action-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
            <circle cx="12" cy="7" r="4" strokeWidth="2"/>
          </svg>
        </div>
        <span>Mon profil</span>
      </button>

      <button className="action">
        <div className="action-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span>Nouvelle tâche</span>
      </button>


                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Calendrier</span>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="20" x2="18" y2="10" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="20" x2="12" y2="4" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="20" x2="6" y2="14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span>Analytics</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Carte succès */}
            <div className="box success-box">
              <div className="success-content">
                <div className="success-check">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M22 4L12 14.01l-3-3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="success-heading">Authentification réussie</h3>
                <p className="success-message">
                  Vous êtes connecté en tant qu'<strong>administrateur</strong>
                </p>
                <div className="success-tag">
                  User Story 1.1 ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;