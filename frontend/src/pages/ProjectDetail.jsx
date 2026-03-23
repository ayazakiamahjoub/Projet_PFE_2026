import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProject(data.data.project);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Projet non trouvé'
        });
        setTimeout(() => navigate('/manager/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Erreur chargement projet:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Projet supprimé avec succès !'
        });

        setTimeout(() => {
          navigate('/manager/dashboard');
        }, 1500);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la suppression'
        });
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Erreur suppression projet:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
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

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'urgent': { label: 'Urgent', class: 'priority-urgent', icon: '🔥' },
      'high': { label: 'Haute', class: 'priority-high', icon: '⚠️' },
      'medium': { label: 'Moyenne', class: 'priority-medium', icon: '➡️' },
      'low': { label: 'Basse', class: 'priority-low', icon: '⬇️' }
    };
    return priorityMap[priority] || { label: priority, class: 'priority-default', icon: '❓' };
  };

  const calculateDaysRemaining = () => {
    if (!project) return 0;
    const today = new Date();
    const endDate = new Date(project.endDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDuration = () => {
    if (!project) return 0;
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateElapsedDays = () => {
    if (!project) return 0;
    const today = new Date();
    const start = new Date(project.startDate);
    const diffTime = today - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
                <span className="brand-tagline">Détail du Projet</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-wrapper">
            <div className="loading-container">
              <LoadingSpinner />
              <p>Chargement du projet...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = getStatusInfo(project.status);
  const priorityInfo = getPriorityInfo(project.priority);
  const daysRemaining = calculateDaysRemaining();
  const totalDuration = calculateDuration();
  const elapsedDays = calculateElapsedDays();

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
              <span className="brand-tagline">Détail du Projet</span>
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
          {/* Bouton retour */}
          <button className="btn-back" onClick={() => navigate('/manager/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour aux projets
          </button>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          {/* En-tête du projet */}
          <div className="project-detail-header">
            <div className="project-detail-title-section">
              <div className="project-detail-color-bar" style={{ background: project.color }}></div>
              <div className="project-detail-title-content">
                <h1 className="project-detail-title">{project.title}</h1>
                <div className="project-detail-badges">
                  <span className={`project-detail-badge ${statusInfo.class}`}>
                    <span className="badge-icon">{statusInfo.icon}</span>
                    {statusInfo.label}
                  </span>
                  <span className={`project-detail-badge ${priorityInfo.class}`}>
                    <span className="badge-icon">{priorityInfo.icon}</span>
                    {priorityInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="project-detail-actions">
              <button 
                className="btn-action btn-edit"
                onClick={() => navigate(`/manager/projects/${project.id}/edit`)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                </svg>
                Modifier
              </button>
              <button 
                className="btn-action btn-delete"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3 6 5 6 21 6" strokeWidth="2"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                </svg>
                Supprimer
              </button>
            </div>
          </div>

          {/* Grille principale */}
          <div className="project-detail-grid">
            {/* Description */}
            {project.description && (
              <div className="detail-card detail-card-full">
                <div className="detail-card-header">
                  <div className="detail-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" strokeWidth="2"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h2 className="detail-card-title">Description</h2>
                </div>
                <div className="detail-card-content">
                  <p className="project-description-text">{project.description}</p>
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="detail-card-title">Statistiques</h2>
              </div>
              <div className="detail-card-content">
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">Progression</span>
                    <span className="stat-value primary">{project.progress}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Durée totale</span>
                    <span className="stat-value">{totalDuration} jours</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Jours écoulés</span>
                    <span className="stat-value">{elapsedDays} jours</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Jours restants</span>
                    <span className={`stat-value ${daysRemaining < 7 ? 'danger' : daysRemaining < 30 ? 'warning' : 'success'}`}>
                      {daysRemaining > 0 ? `${daysRemaining} jours` : 'Terminé'}
                    </span>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Avancement</span>
                    <span className="progress-percentage">{project.progress}%</span>
                  </div>
                  <div className="progress-bar-detail">
                    <div 
                      className="progress-bar-fill-detail"
                      style={{ 
                        width: `${project.progress}%`,
                        background: project.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="detail-card-title">Informations</h2>
              </div>
              <div className="detail-card-content">
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                      Date de début
                    </span>
                    <span className="info-value">{formatDate(project.startDate)}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                      </svg>
                      Date de fin
                    </span>
                    <span className="info-value">{formatDate(project.endDate)}</span>
                  </div>

                  {project.budget && (
                    <div className="info-item">
                      <span className="info-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                        </svg>
                        Budget
                      </span>
                      <span className="info-value">{project.budget} {project.currency}</span>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                        <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                      </svg>
                      Chef de projet
                    </span>
                    <span className="info-value">
                      {project.manager?.firstName} {project.manager?.lastName}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                      </svg>
                      Créé le
                    </span>
                    <span className="info-value">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="detail-card detail-card-full">
                <div className="detail-card-header">
                  <div className="detail-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeWidth="2"/>
                      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h2 className="detail-card-title">Tags</h2>
                </div>
                <div className="detail-card-content">
                  <div className="tags-container">
                    {project.tags.map((tag, index) => (
                      <span key={index} className="project-tag-detail">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2>Supprimer le projet</h2>
              <p>Êtes-vous sûr de vouloir supprimer <strong>{project.title}</strong> ? Cette action est irréversible.</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="btn-modal-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Suppression...
                  </>
                ) : (
                  'Supprimer définitivement'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;