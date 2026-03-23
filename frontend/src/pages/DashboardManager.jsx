import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './DashboardManager.css';

const DashboardManager = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  // ⬇️ AJOUTER CES ÉTATS ⬇️
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  // ⬇️ CHARGER LES PROJETS AU MONTAGE ⬇️
  useEffect(() => {
    fetchProjects();
    fetchProjectStats();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMyProjects(data.data.projects);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProjectStats(data.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

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

  // ⬇️ METTRE À JOUR LES STATS AVEC LES VRAIES DONNÉES ⬇️
  const stats = [
    { 
      label: 'Mes projets', 
      value: projectStats.total.toString(), 
      icon: '📁',
      trend: `${projectStats.active} en cours`
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

  // ⬇️ FONCTION POUR FORMATER LES DATES ⬇️
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // ⬇️ FONCTION POUR OBTENIR LA COULEUR DU STATUT ⬇️
  const getStatusInfo = (status) => {
    const statusMap = {
      'active': { label: 'En cours', class: 'status-active' },
      'completed': { label: 'Terminé', class: 'status-completed' },
      'on_hold': { label: 'En pause', class: 'status-hold' },
      'draft': { label: 'Brouillon', class: 'status-draft' },
      'cancelled': { label: 'Annulé', class: 'status-cancelled' }
    };
    return statusMap[status] || { label: status, class: 'status-default' };
  };

  // ⬇️ FONCTION POUR OBTENIR LA COULEUR DE PRIORITÉ ⬇️
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'urgent': { label: 'Urgent', class: 'priority-urgent' },
      'high': { label: 'Haute', class: 'priority-high' },
      'medium': { label: 'Moyenne', class: 'priority-medium' },
      'low': { label: 'Basse', class: 'priority-low' }
    };
    return priorityMap[priority] || { label: priority, class: 'priority-default' };
  };

  return (
    <div className="dashboard-clean">
      {/* Header */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div 
            className="brand" 
            onClick={() => navigate(getDashboardUrl())}
            style={{ cursor: 'pointer' }}
          >
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
                <button 
                  className="btn-add"
                  onClick={() => navigate('/manager/projects/create')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Nouveau projet
                </button>
              </div>
              <div className="box-content">
                {/* ⬇️ AFFICHAGE CONDITIONNEL ⬇️ */}
                {loading ? (
                  <div className="loading-container">
                    <LoadingSpinner />
                    <p>Chargement des projets...</p>
                  </div>
                ) : myProjects.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>Aucun projet</h3>
                    <p>Créez votre premier projet pour commencer</p>
                    <button 
                      className="btn-create-first"
                      onClick={() => navigate('/manager/projects/create')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Créer mon premier projet
                    </button>
                  </div>
                ) : (
                  <div className="projects-list">
                    {myProjects.map(project => {
                      const statusInfo = getStatusInfo(project.status);
                      const priorityInfo = getPriorityInfo(project.priority);
                      
                      return (
                        <div key={project.id} className="project-card">
                          <div className="project-header-row">
                            <div className="project-title-section">
                              <h4 className="project-name">{project.title}</h4>
                              {project.priority && (
                                <span className={`project-priority ${priorityInfo.class}`}>
                                  {priorityInfo.label}
                                </span>
                              )}
                            </div>
                            <span className={`project-status ${statusInfo.class}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          {project.description && (
                            <p className="project-description">{project.description}</p>
                          )}

                          <div className="project-progress">
                            <div className="progress-info">
                              <span className="progress-label">Progression</span>
                              <span className="progress-value">{project.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${project.progress}%`,
                                  background: project.color || 'linear-gradient(90deg, #FF8C42, #FF6B35)'
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="project-footer-row">
                            <div className="project-meta">
                              {project.budget && (
                                <span className="meta-item">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                                  </svg>
                                  {project.budget} {project.currency}
                                </span>
                              )}
                              <span className="meta-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                                </svg>
                                {formatDate(project.endDate)}
                              </span>
                            </div>
                             <div className="project-actions">
    <button 
      className="btn-edit"
      onClick={() => navigate(`/manager/projects/${project.id}`)}
      title="Voir les détails"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
      </svg>
      Voir
    </button>
  </div>

                          </div>

                          {/* Tags */}
                          {project.tags && project.tags.length > 0 && (
                            <div className="project-tags">
                              {project.tags.map((tag, idx) => (
                                <span key={idx} className="project-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  <button 
                    className="action"
                    onClick={() => navigate('/manager/projects/create')}
                  >
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <span className="action-title">Créer un projet</span>
                      <span className="action-subtitle">Nouveau projet</span>
                    </div>
                  </button>

                  <button className="action" onClick={() => navigate('/profile')}>
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <span className="action-title">Mon profil</span>
                      <span className="action-subtitle">Paramètres personnels</span>
                    </div>
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
                    <div className="action-content">
                      <span className="action-title">Inviter un membre</span>
                      <span className="action-subtitle">Agrandir votre équipe</span>
                    </div>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <span className="action-title">Planifier réunion</span>
                      <span className="action-subtitle">Calendrier d'équipe</span>
                    </div>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" strokeWidth="2"/>
                        <path d="M14 2v6h6M12 18v-6M9 15h6" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="action-content">
                      <span className="action-title">Rapport d'activité</span>
                      <span className="action-subtitle">Analyser les performances</span>
                    </div>
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