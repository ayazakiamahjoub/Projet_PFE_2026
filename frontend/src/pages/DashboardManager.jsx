import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardManager.css';

const DashboardManager = () => {
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
      label: 'Mes projets', 
      value: '8', 
      icon: '📁',
      trend: '3 en cours'
    },
    { 
      label: 'Tâches assignées', 
      value: '34', 
      icon: '✓',
      trend: '12 cette semaine'
    },
    { 
      label: 'Mon équipe', 
      value: '12', 
      icon: '👥',
      trend: '2 nouveaux'
    },
    { 
      label: 'Taux de complétion', 
      value: '87%', 
      icon: '📈',
      trend: '+5% ce mois'
    }
  ];

  const myProjects = [
    { 
      id: 1, 
      name: 'Refonte Site Web', 
      progress: 65, 
      status: 'En cours',
      team: 5,
      deadline: '2026-04-15'
    },
    { 
      id: 2, 
      name: 'Application Mobile', 
      progress: 40, 
      status: 'En cours',
      team: 4,
      deadline: '2026-05-01'
    },
    { 
      id: 3, 
      name: 'Migration Cloud', 
      progress: 90, 
      status: 'Presque fini',
      team: 3,
      deadline: '2026-03-20'
    }
  ];

  return (
    <div className="dashboard-clean">
      {/* Header */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div className="brand">
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Espace Manager</span>
            </div>
          </div>

          <div className="header-end">
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

      {/* Contenu */}
      <main className="content">
        <div className="content-wrapper">
          {/* Bienvenue */}
          <div className="welcome">
            <h1 className="page-title">
              {getGreeting()}, {user?.firstName}
            </h1>
            <p className="page-subtitle">
              Gérez vos projets et votre équipe efficacement
            </p>
          </div>

          {/* Statistiques */}
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

          {/* Grille */}
          <div className="grid">
            {/* Mes projets */}
            <div className="box box-full">
              <div className="box-header">
                <h3 className="box-title">Mes projets actifs</h3>
                <button className="btn-add">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Nouveau projet
                </button>
              </div>
              <div className="box-content">
                <div className="projects-list">
                  {myProjects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header-row">
                        <h4 className="project-name">{project.name}</h4>
                        <span className="project-status">{project.status}</span>
                      </div>
                      <div className="project-progress">
                        <div className="progress-info">
                          <span className="progress-label">Progression</span>
                          <span className="progress-value">{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="project-footer-row">
                        <div className="project-meta">
                          <span className="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                              <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                            </svg>
                            {project.team} membres
                          </span>
                          <span className="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                              <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                            </svg>
                            {new Date(project.deadline).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <button className="btn-view">Voir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="box">
              <div className="box-header">
                <h3 className="box-title">Mon profil</h3>
              </div>
              <div className="box-content">
                <div className="info-rows">
                  <div className="info-row">
                    <span className="info-key">Email</span>
                    <span className="info-val">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Téléphone</span>
                    <span className="info-val">{user?.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Rôle</span>
                    <span className="pill pill-orange">Chef de projet</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Statut</span>
                    <span className="pill pill-green">
                      <span className="pill-dot"></span>
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="box">
              <div className="box-header">
                <h3 className="box-title">Actions rapides</h3>
              </div>
              <div className="box-content">
                <div className="actions">
                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span>Créer une tâche</span>
                  </button>
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
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                        <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                        <line x1="19" y1="8" x2="19" y2="14" strokeWidth="2"/>
                        <line x1="22" y1="11" x2="16" y2="11" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Inviter un membre</span>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Planifier réunion</span>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" strokeWidth="2"/>
                        <path d="M14 2v6h6M12 18v-6M9 15h6" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Rapport d'activité</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardManager;