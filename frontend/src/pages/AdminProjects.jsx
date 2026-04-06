import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ThemeToggle from '../components/common/ThemeToggle';
import Alert from '../components/common/Alert';
import './AdminProjects.css';

/* ================================================================
   TAUX DE CHANGE VERS TND (Dinar Tunisien)
   Taux de fallback si l'API est indisponible.
   Source : taux approximatifs BNT / BCT
   ================================================================ */
const FALLBACK_RATES_TO_TND = {
  TND: 1,
  EUR: 3.38,   // 1 EUR ≈ 3.38 TND
  USD: 3.12,   // 1 USD ≈ 3.12 TND
  GBP: 3.95,   // 1 GBP ≈ 3.95 TND
};

const convertToTND = (amount, currency, rates) => {
  if (!amount) return 0;
  const rate = rates[currency] ?? FALLBACK_RATES_TO_TND[currency] ?? 1;
  return amount * rate;
};

const formatTND = (amount) => {
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + ' TND';
};

const AdminProjects = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  // Etats projets
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Taux de change
  const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES_TO_TND);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesSource, setRatesSource] = useState('fallback'); // 'api' | 'fallback'

  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0,
    totalBudget: 0
  });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showFilters, setShowFilters] = useState(false);

  // Modal suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExchangeRates();
    fetchProjects();
    fetchProjectStats();
    fetchManagers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, statusFilter, priorityFilter, managerFilter, sortBy]);

  /* ── Récupérer les taux de change en temps réel ── */
  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    try {
      // API gratuite — pas de clé nécessaire
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/TND');
      if (!res.ok) throw new Error('API indisponible');
      const data = await res.json();

      // data.rates donne X/TND → on veut TND/X donc on inverse
      const rates = { TND: 1 };
      ['EUR', 'USD', 'GBP'].forEach(cur => {
        if (data.rates[cur]) {
          rates[cur] = 1 / data.rates[cur]; // 1 EUR = ? TND
        }
      });

      setExchangeRates(rates);
      setRatesSource('api');
      console.log('✅ Taux de change chargés:', rates);
    } catch (err) {
      console.warn('⚠️ API taux indisponible, taux de fallback utilisés:', err.message);
      setExchangeRates(FALLBACK_RATES_TO_TND);
      setRatesSource('fallback');
    } finally {
      setRatesLoading(false);
    }
  };

  /* ── Budget total converti en TND ── */
  const totalBudgetTND = projects.reduce((sum, p) => {
    if (!p.budget) return sum;
    return sum + convertToTND(parseFloat(p.budget), p.currency, exchangeRates);
  }, 0);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects?limit=200', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setProjects(data.data.projects);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setAlert({ type: 'error', message: 'Erreur de connexion au serveur' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setProjectStats(data.data.stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users?role=manager', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setManagers(data.data.users);
    } catch (error) {
      console.error('Erreur chargement managers:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (searchTerm.trim()) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all')   filtered = filtered.filter(p => p.status === statusFilter);
    if (priorityFilter !== 'all') filtered = filtered.filter(p => p.priority === priorityFilter);
    if (managerFilter !== 'all')  filtered = filtered.filter(p => p.managerId === parseInt(managerFilter));

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':    return a.title.localeCompare(b.title);
        case 'endDate':  return new Date(a.endDate) - new Date(b.endDate);
        case 'progress': return b.progress - a.progress;
        case 'budget':
          // Tri par budget converti en TND
          const bA = convertToTND(parseFloat(a.budget || 0), a.currency, exchangeRates);
          const bB = convertToTND(parseFloat(b.budget || 0), b.currency, exchangeRates);
          return bB - bA;
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredProjects(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setManagerFilter('all');
    setSortBy('createdAt');
  };

  const hasActiveFilters = () =>
    searchTerm !== '' || statusFilter !== 'all' ||
    priorityFilter !== 'all' || managerFilter !== 'all' || sortBy !== 'createdAt';

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Projet supprimé avec succès !' });
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
        fetchProjectStats();
      } else {
        setAlert({ type: 'error', message: data.message || 'Erreur lors de la suppression' });
      }
    } catch (error) {
      console.error('Erreur suppression projet:', error);
      setAlert({ type: 'error', message: 'Erreur de connexion au serveur' });
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
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'active':    { label: 'En cours',  class: 'status-active' },
      'completed': { label: 'Terminé',   class: 'status-completed' },
      'on_hold':   { label: 'En pause',  class: 'status-hold' },
      'draft':     { label: 'Brouillon', class: 'status-draft' },
      'cancelled': { label: 'Annulé',    class: 'status-cancelled' }
    };
    return statusMap[status] || { label: status, class: 'status-default' };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'urgent': { label: 'Urgent',  class: 'priority-urgent' },
      'high':   { label: 'Haute',   class: 'priority-high' },
      'medium': { label: 'Moyenne', class: 'priority-medium' },
      'low':    { label: 'Basse',   class: 'priority-low' }
    };
    return priorityMap[priority] || { label: priority, class: 'priority-default' };
  };

  return (
    <div className="dashboard-clean">
      {/* Header */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div className="brand" onClick={() => navigate(getDashboardUrl())} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Gestion des Projets</span>
            </div>
          </div>

          <div className="header-end">
            <ThemeToggle />
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl ? (
                  <img src={`http://localhost:5000${user.avatarUrl}`} alt="Avatar" className="avatar-img" />
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5m0 0l-5-5m5 5H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="content">
        <div className="content-wrapper">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour au dashboard
          </button>

          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Header de la page */}
          <div className="page-header-admin">
            <div className="page-header-content">
              <h1 className="page-title">Tous les projets</h1>
              <p className="page-subtitle">Supervision et gestion complète des projets de la plateforme</p>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="quick-stats-admin">
            <div className="quick-stat-item">
              <div className="quick-stat-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"/>
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{projectStats.total}</div>
                <div className="quick-stat-label">Total</div>
              </div>
            </div>

            <div className="quick-stat-item">
              <div className="quick-stat-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
                  <polyline points="1 20 1 14 7 14" strokeWidth="2"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth="2"/>
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{projectStats.active}</div>
                <div className="quick-stat-label">En cours</div>
              </div>
            </div>

            <div className="quick-stat-item">
              <div className="quick-stat-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{projectStats.completed}</div>
                <div className="quick-stat-label">Terminés</div>
              </div>
            </div>

            <div className="quick-stat-item">
              <div className="quick-stat-icon amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="6" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{projectStats.onHold}</div>
                <div className="quick-stat-label">En pause</div>
              </div>
            </div>

            {/* ── Budget total en TND ── */}
            <div className="quick-stat-item">
              <div className="quick-stat-icon purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                </svg>
              </div>
              <div className="quick-stat-content">
                {ratesLoading ? (
                  <div className="quick-stat-value" style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>...</div>
                ) : (
                  <div className="quick-stat-value" style={{ fontSize: '16px' }}>
                    {formatTND(totalBudgetTND)}
                  </div>
                )}
                <div className="quick-stat-label">
                  Budget total
                  {ratesSource === 'api' && (
                    <span className="rates-live-badge" title="Taux en temps réel">• live</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="filters-section">
            <div className="search-bar">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                  </svg>
                </button>
              )}
            </div>

            <button className={`btn-filters ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeWidth="2"/>
              </svg>
              Filtres
              {hasActiveFilters() && <span className="filters-badge"></span>}
            </button>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-row">
                <div className="filter-group">
                  <label className="filter-label">Statut</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
                    <option value="all">Tous les statuts</option>
                    <option value="active">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="on_hold">En pause</option>
                    <option value="draft">Brouillon</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Priorité</label>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
                    <option value="all">Toutes les priorités</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Manager</label>
                  <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="filter-select">
                    <option value="all">Tous les managers</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Trier par</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                    <option value="createdAt">Date de création</option>
                    <option value="endDate">Date de fin</option>
                    <option value="title">Titre (A-Z)</option>
                    <option value="progress">Progression</option>
                    <option value="budget">Budget (TND)</option>
                  </select>
                </div>

                {hasActiveFilters() && (
                  <button className="btn-reset-filters" onClick={resetFilters}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2"/>
                    </svg>
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Compteur de résultats */}
          {(hasActiveFilters() || searchTerm) && (
            <div className="results-count">
              <span className="results-count-text">
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} trouvé{filteredProjects.length > 1 ? 's' : ''}
              </span>
              {filteredProjects.length !== projects.length && (
                <span className="results-count-total"> sur {projects.length} au total</span>
              )}
            </div>
          )}

          {/* Liste des projets */}
          <div className="projects-container-admin">
            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Chargement des projets...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {hasActiveFilters() || searchTerm ? (
                      <>
                        <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                        <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                      </>
                    ) : (
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"/>
                    )}
                  </svg>
                </div>
                <h3>{hasActiveFilters() || searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}</h3>
                <p>{hasActiveFilters() || searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Les projets apparaîtront ici'}</p>
                {(hasActiveFilters() || searchTerm) && (
                  <button className="btn-create-first" onClick={resetFilters}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2"/>
                    </svg>
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="projects-grid-admin">
                {filteredProjects.map(project => {
                  const statusInfo   = getStatusInfo(project.status);
                  const priorityInfo = getPriorityInfo(project.priority);
                  const budgetTND    = project.budget
                    ? convertToTND(parseFloat(project.budget), project.currency, exchangeRates)
                    : null;
                  const showConversion = project.budget && project.currency !== 'TND';

                  return (
                    <div key={project.id} className="project-card-admin">
                      <div className="project-color-bar-admin" style={{ background: project.color }}></div>

                      <div className="project-card-content">
                        <div className="project-header-admin">
                          <h4 className="project-title-admin">{project.title}</h4>
                          <div className="project-badges-admin">
                            <span className={`badge-admin ${statusInfo.class}`}>{statusInfo.label}</span>
                            <span className={`badge-admin ${priorityInfo.class}`}>{priorityInfo.label}</span>
                          </div>
                        </div>

                        {project.description && (
                          <p className="project-description-admin">
                            {project.description.length > 100
                              ? project.description.substring(0, 100) + '...'
                              : project.description}
                          </p>
                        )}

                        <div className="project-progress-admin">
                          <div className="progress-header-admin">
                            <span className="progress-label-admin">Progression</span>
                            <span className="progress-value-admin">{project.progress}%</span>
                          </div>
                          <div className="progress-bar-admin">
                            <div
                              className="progress-fill-admin"
                              style={{ width: `${project.progress}%`, background: project.color }}
                            ></div>
                          </div>
                        </div>

                        <div className="project-meta-grid">
                          <div className="meta-item-admin">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                              <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                            </svg>
                            <span>{project.manager?.firstName} {project.manager?.lastName}</span>
                          </div>

                          {/* ── Budget affiché en TND ── */}
                          {budgetTND !== null && (
                            <div className="meta-item-admin budget-item">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                              </svg>
                              <span className="budget-tnd">{formatTND(budgetTND)}</span>
                              {showConversion && (
                                <span className="budget-original" title={`Montant original : ${project.budget} ${project.currency}`}>
                                  ({project.budget} {project.currency})
                                </span>
                              )}
                            </div>
                          )}

                          <div className="meta-item-admin">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                              <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                            </svg>
                            <span>{formatDate(project.endDate)}</span>
                          </div>
                        </div>

                        <div className="project-actions-admin">
                          <button className="btn-action-admin view" onClick={() => navigate(`/manager/projects/${project.id}`)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                            </svg>
                            Voir
                          </button>
                          <button className="btn-action-admin edit" onClick={() => navigate(`/manager/projects/${project.id}/edit`)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                            </svg>
                            Modifier
                          </button>
                          <button className="btn-action-admin delete" onClick={() => handleDeleteClick(project)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3 6 5 6 21 6" strokeWidth="2"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FAB */}
        <button className="fab-create-project" onClick={() => navigate('/manager/projects/create')} title="Créer un projet">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </button>
      </main>

      {/* Modal suppression */}
      {showDeleteModal && projectToDelete && (
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
              <p>Êtes-vous sûr de vouloir supprimer <strong>{projectToDelete.title}</strong> ? Cette action est irréversible.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Annuler
              </button>
              <button className="btn-modal-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <><span className="btn-spinner"></span> Suppression...</> : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;