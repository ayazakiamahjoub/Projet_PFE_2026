import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardMember.css';

const DashboardMember = () => {
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
      label: 'Mes tâches', 
      value: '15', 
      icon: '✓',
      trend: '5 en cours'
    },
    { 
      label: 'Complétées', 
      value: '28', 
      icon: '✅',
      trend: '8 cette semaine'
    },
    { 
      label: 'Mes projets', 
      value: '4', 
      icon: '📁',
      trend: '2 actifs'
    },
    { 
      label: 'Performance', 
      value: '92%', 
      icon: '🎯',
      trend: '+7% ce mois'
    }
  ];

  const myTasks = [
    { 
      id: 1, 
      title: 'Créer le design de la page d\'accueil', 
      project: 'Site Web',
      priority: 'high',
      dueDate: '2026-03-08',
      status: 'En cours'
    },
    { 
      id: 2, 
      title: 'Tests unitaires du module authentification', 
      project: 'App Mobile',
      priority: 'medium',
      dueDate: '2026-03-10',
      status: 'En cours'
    },
    { 
      id: 3, 
      title: 'Rédiger la documentation API', 
      project: 'Backend',
      priority: 'low',
      dueDate: '2026-03-15',
      status: 'À faire'
    },
    { 
      id: 4, 
      title: 'Révision du code frontend', 
      project: 'Site Web',
      priority: 'high',
      dueDate: '2026-03-06',
      status: 'En attente'
    }
  ];

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return '';
    }
  };

  return (
    <div className="dashboard-clean">
      {/* Header */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div className="brand">
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Espace Membre</span>
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
              Voici vos tâches et votre activité du jour
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
            {/* Mes tâches */}
            <div className="box box-full">
              <div className="box-header">
                <h3 className="box-title">Mes tâches assignées</h3>
                <button className="btn-add">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Nouvelle tâche
                </button>
              </div>
              <div className="box-content">
                <div className="tasks-table">
                  {myTasks.map(task => (
                    <div key={task.id} className="task-row">
                      <div className="task-checkbox">
                        <input type="checkbox" id={`task-${task.id}`} />
                        <label htmlFor={`task-${task.id}`}></label>
                      </div>
                      <div className="task-info">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-meta">
                          <span className="task-project">{task.project}</span>
                          <span className="task-separator">•</span>
                          <span className="task-date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path d="M12 6v6l4 2" strokeWidth="2"/>
                            </svg>
                            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="task-status">{task.status}</span>
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
                    <span className="pill pill-orange">Membre</span>
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
                        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" 
                              strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span>Voir mes tâches</span>
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
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Mon calendrier</span>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" 
                              strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Mes projets</span>
                  </button>

                  <button className="action">
                    <div className="action-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" strokeWidth="2"/>
                      </svg>
                    </div>
                    <span>Aide & Support</span>
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

export default DashboardMember;