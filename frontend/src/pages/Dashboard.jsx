import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch user stats
      const usersStatsResponse = await fetch('http://localhost:5000/api/users/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersStatsData = await usersStatsResponse.json();

      // Fetch project stats
      const projectsStatsResponse = await fetch('http://localhost:5000/api/projects/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projectsStatsData = await projectsStatsResponse.json();

      // Fetch recent users
      const recentUsersResponse = await fetch('http://localhost:5000/api/users?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recentUsersData = await recentUsersResponse.json();

      // Fetch recent projects
      const recentProjectsResponse = await fetch('http://localhost:5000/api/projects?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recentProjectsData = await recentProjectsResponse.json();

      if (usersStatsData.success) {
        setStats(prev => ({
          ...prev,
          totalUsers: usersStatsData.data.stats.total,
          activeUsers: usersStatsData.data.stats.active
        }));
      }

      if (projectsStatsData.success) {
        setStats(prev => ({
          ...prev,
          totalProjects: projectsStatsData.data.stats.total,
          activeProjects: projectsStatsData.data.stats.active,
          completedProjects: projectsStatsData.data.stats.completed
        }));
      }

      if (recentUsersData.success) {
        setRecentUsers(recentUsersData.data.users);
      }

      if (recentProjectsData.success) {
        setRecentProjects(recentProjectsData.data.projects);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'active': { label: 'En cours', class: 'status-active', icon: '🔄' },
      'completed': { label: 'Terminé', class: 'status-completed', icon: '✅' },
      'on_hold': { label: 'En pause', class: 'status-hold', icon: '⏸️' },
      'draft': { label: 'Brouillon', class: 'status-draft', icon: '📝' },
      'cancelled': { label: 'Annulé', class: 'status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: status, class: 'status-default', icon: '❓' };
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'admin': { label: 'Admin', class: 'role-admin' },
      'manager': { label: 'Manager', class: 'role-manager' },
      'member': { label: 'Membre', class: 'role-member' }
    };
    return roleMap[role] || { label: role, class: 'role-default' };
  };

  if (loading) {
    return (
      <div className="dashboard-clean">
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
                <span className="brand-tagline">Administration</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-wrapper">
            <div className="loading-container">
              <LoadingSpinner />
              <p>Chargement du tableau de bord...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              <span className="brand-tagline">Administration</span>
            </div>
          </div>

          <div className="header-end">
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:5000${user.avatarUrl}`} 
                    alt="Avatar" 
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
          {/* Header de la page */}
          <div className="page-header-admin">
  <div className="page-header-content">
    <h1 className="page-title">Tableau de bord administrateur</h1>
    <p className="page-subtitle">Vue d'ensemble de la plateforme PioneerTech</p>
  </div>
  <div className="header-buttons">
    <button 
      className="btn-create-project"
      onClick={() => navigate('/manager/projects/create')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Créer un projet
    </button>
    <button 
      className="btn-manage-users"
      onClick={() => navigate('/admin/users')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
        <circle cx="9" cy="7" r="4" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
      </svg>
      Gérer les utilisateurs
    </button>
  </div>
</div>

          {/* Statistiques rapides */}
          <div className="quick-stats-admin">
            <div 
              className="quick-stat-item clickable"
              onClick={() => navigate('/admin/users')}
            >
              <div className="quick-stat-icon blue">👥</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{stats.totalUsers}</div>
                <div className="quick-stat-label">Utilisateurs</div>
              </div>
            </div>
            
            <div 
              className="quick-stat-item clickable"
              onClick={() => navigate('/admin/projects')}
            >
              <div className="quick-stat-icon orange">📁</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{stats.totalProjects}</div>
                <div className="quick-stat-label">Projets</div>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <div className="quick-stat-icon blue">🔄</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{stats.activeProjects}</div>
                <div className="quick-stat-label">En cours</div>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <div className="quick-stat-icon green">✅</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{stats.completedProjects}</div>
                <div className="quick-stat-label">Terminés</div>
              </div>
            </div>
            
            <div className="quick-stat-item">
              <div className="quick-stat-icon purple">📋</div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{stats.totalTasks}</div>
                <div className="quick-stat-label">Tâches</div>
              </div>
            </div>
          </div>

          {/* Grille */}
          <div className="admin-grid">
            {/* Utilisateurs récents */}
            <div className="admin-box">
              <div className="box-header">
                <h3 className="box-title">Utilisateurs récents</h3>
                <button 
                  className="btn-view-all"
                  onClick={() => navigate('/admin/users')}
                >
                  Voir tout
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="box-content">
                {recentUsers.length === 0 ? (
                  <div className="empty-state-small">
                    <p>Aucun utilisateur récent</p>
                  </div>
                ) : (
                  <div className="users-list-admin">
                    {recentUsers.map(user => {
                      const roleInfo = getRoleBadge(user.role);
                      return (
                        <div key={user.id} className="user-item-admin">
                          <div className="user-avatar-small">
                            {user.avatarUrl ? (
                              <img 
                                src={`http://localhost:5000${user.avatarUrl}`} 
                                alt={`${user.firstName} ${user.lastName}`}
                              />
                            ) : (
                              <span>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="user-info-admin">
                            <div className="user-name-admin">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="user-email-admin">{user.email}</div>
                          </div>
                          <span className={`role-badge ${roleInfo.class}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Projets récents */}
            <div className="admin-box">
              <div className="box-header">
                <h3 className="box-title">Projets récents</h3>
                <button 
                  className="btn-view-all"
                  onClick={() => navigate('/admin/projects')}
                >
                  Voir tout
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="box-content">
                {recentProjects.length === 0 ? (
                  <div className="empty-state-small">
                    <p>Aucun projet récent</p>
                  </div>
                ) : (
                  <div className="projects-list-admin">
                    {recentProjects.map(project => {
                      const statusInfo = getStatusInfo(project.status);
                      return (
                        <div 
                          key={project.id} 
                          className="project-item-admin"
                          onClick={() => navigate(`/manager/projects/${project.id}`)}
                        >
                          <div 
                            className="project-color-indicator" 
                            style={{ background: project.color }}
                          ></div>
                          <div className="project-info-admin">
                            <div className="project-name-admin">{project.title}</div>
                            <div className="project-meta-admin">
                              <span className="project-manager">
                                👤 {project.manager?.firstName} {project.manager?.lastName}
                              </span>
                              <span className="project-date">
                                📅 {formatDate(project.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="project-status-admin">
                            <span className={`status-badge ${statusInfo.class}`}>
                              <span className="status-icon">{statusInfo.icon}</span>
                              {statusInfo.label}
                            </span>
                            <div className="project-progress-small">
                              <div 
                                className="progress-fill-small"
                                style={{ 
                                  width: `${project.progress}%`,
                                  background: project.color
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
<div className="quick-actions-admin">
  <h3 className="section-title">Actions rapides</h3>
  <div className="actions-grid">
    <button 
      className="action-card"
      onClick={() => navigate('/manager/projects/create')}
    >
      <div className="action-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="action-content">
        <h4>Créer un projet</h4>
        <p>Lancer un nouveau projet</p>
      </div>
    </button>

    <button 
      className="action-card"
      onClick={() => navigate('/admin/users')}
    >
      <div className="action-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
          <circle cx="8.5" cy="7" r="4" strokeWidth="2"/>
          <line x1="20" y1="8" x2="20" y2="14" strokeWidth="2"/>
          <line x1="23" y1="11" x2="17" y2="11" strokeWidth="2"/>
        </svg>
      </div>
      <div className="action-content">
        <h4>Ajouter un utilisateur</h4>
        <p>Créer un nouveau compte</p>
      </div>
    </button>

    <button 
      className="action-card"
      onClick={() => navigate('/admin/projects')}
    >
      <div className="action-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"/>
        </svg>
      </div>
      <div className="action-content">
        <h4>Gérer les projets</h4>
        <p>Superviser tous les projets</p>
      </div>
    </button>

    <button 
      className="action-card"
      onClick={() => navigate('/profile')}
    >
      <div className="action-icon purple">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeWidth="2"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="2"/>
        </svg>
      </div>
      <div className="action-content">
        <h4>Paramètres</h4>
        <p>Configurer la plateforme</p>
      </div>
    </button>
  </div>
</div>
</div>
      </main>
    </div>
  );
};

export default Dashboard;