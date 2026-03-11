import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  // ⬇️ AJOUTER CES ÉTATS ⬇️
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 24,
    totalTasks: 156,
    completion: 92
  });
  const [loading, setLoading] = useState(true);

  // ⬇️ CHARGER LES STATS AU MONTAGE ⬇️
  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalUsers: data.data.stats.total,
          activeUsers: data.data.stats.active
        }));
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
              <span className="brand-tagline">Tableau de bord Admin</span>
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
          {/* En-tête */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Bienvenue, {user?.firstName} ! 👋</h1>
              <p className="page-subtitle">Tableau de bord administrateur</p>
            </div>
          </div>

          {/* ⬇️ STATISTIQUES DYNAMIQUES ⬇️ */}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-icon-wrapper blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalProjects}</div>
                <div className="stat-label">Projets Actifs</div>
              </div>
            </div>

            {/* ⬇️ STAT UTILISATEURS DYNAMIQUE ⬇️ */}
            <div className="stat-box">
              <div className="stat-icon-wrapper green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                  <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content">
                {loading ? (
                  <div className="stat-loading">
                    <div className="mini-spinner"></div>
                  </div>
                ) : (
                  <>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Utilisateurs</div>
                    <div className="stat-detail">{stats.activeUsers} actifs</div>
                  </>
                )}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon-wrapper orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Tâches</div>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon-wrapper purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completion}%</div>
                <div className="stat-label">Complétion</div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="quick-actions">
            <h2 className="section-title">Actions rapides</h2>
            <div className="actions-grid">
              <button 
                className="action-card"
                onClick={() => navigate('/admin/users')}
              >
                <div className="action-icon blue">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Gérer les utilisateurs</h3>
                <p>Ajouter, modifier ou supprimer des utilisateurs</p>
                {/* ⬇️ BADGE AVEC LE NOMBRE ⬇️ */}
                {!loading && stats.totalUsers > 0 && (
                  <div className="action-badge">{stats.totalUsers} utilisateurs</div>
                )}
              </button>

              <button 
                className="action-card"
                onClick={() => navigate('/profile')}
              >
                <div className="action-icon orange">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Mon profil</h3>
                <p>Gérer mes informations personnelles</p>
              </button>

              <button className="action-card" disabled>
                <div className="action-icon green">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M2 12h20" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Nouveau projet</h3>
                <p>Créer un nouveau projet (Bientôt)</p>
              </button>

              <button className="action-card" disabled>
                <div className="action-icon purple">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                    <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Rapports</h3>
                <p>Consulter les rapports (Bientôt)</p>
              </button>
            </div>
          </div>

          {/* Projets récents */}
          <div className="recent-section">
            <h2 className="section-title">Projets récents</h2>
            <div className="projects-grid">
              <div className="project-card">
                <div className="project-header">
                  <div className="project-icon">🚀</div>
                  <span className="project-status active">En cours</span>
                </div>
                <h3 className="project-name">Refonte Site Web</h3>
                <p className="project-description">Migration vers React et nouvelle identité visuelle</p>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                  <span className="progress-text">75%</span>
                </div>
                <div className="project-footer">
                  <div className="project-team">
                    <div className="team-avatar">JD</div>
                    <div className="team-avatar">SM</div>
                    <div className="team-avatar">+3</div>
                  </div>
                  <span className="project-date">Échéance: 15 Mars</span>
                </div>
              </div>

              <div className="project-card">
                <div className="project-header">
                  <div className="project-icon">📱</div>
                  <span className="project-status active">En cours</span>
                </div>
                <h3 className="project-name">Application Mobile</h3>
                <p className="project-description">Développement de l'app iOS et Android</p>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '45%' }}></div>
                  </div>
                  <span className="progress-text">45%</span>
                </div>
                <div className="project-footer">
                  <div className="project-team">
                    <div className="team-avatar">ML</div>
                    <div className="team-avatar">PK</div>
                  </div>
                  <span className="project-date">Échéance: 30 Mars</span>
                </div>
              </div>

              <div className="project-card">
                <div className="project-header">
                  <div className="project-icon">🎨</div>
                  <span className="project-status completed">Terminé</span>
                </div>
                <h3 className="project-name">Design System</h3>
                <p className="project-description">Création du système de design complet</p>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%' }}></div>
                  </div>
                  <span className="progress-text">100%</span>
                </div>
                <div className="project-footer">
                  <div className="project-team">
                    <div className="team-avatar">SC</div>
                    <div className="team-avatar">MB</div>
                  </div>
                  <span className="project-date">Terminé le 05 Mars</span>
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