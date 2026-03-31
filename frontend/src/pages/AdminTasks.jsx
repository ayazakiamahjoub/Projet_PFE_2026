import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import './AdminTasks.css';

const AdminTasks = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    pendingApproval: 0,
    done: 0,
    cancelled: 0,
    unassigned: 0,
    overdue: 0,
    highPriority: 0
  });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Listes pour les filtres
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, [filterStatus, filterPriority, filterProject, filterAssignee, searchQuery]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:5000/api/tasks/all';
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterProject !== 'all') params.append('projectId', filterProject);
      if (filterAssignee !== 'all') params.append('assignedTo', filterAssignee);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
        setStats(data.data.stats);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors du chargement des tâches'
        });
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users.filter(u => u.isActive));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterProject('all');
    setFilterAssignee('all');
    setSearchQuery('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pas de date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `En retard de ${Math.abs(diffDays)} jour(s)`;
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays <= 7) return `Dans ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'todo': { label: 'À faire', class: 'task-status-todo', icon: '📝' },
      'in_progress': { label: 'En cours', class: 'task-status-progress', icon: '🔄' },
      'review': { label: 'En révision', class: 'task-status-review', icon: '👀' },
      'pending_approval': { label: 'En attente', class: 'task-status-pending', icon: '⏳' },
      'done': { label: 'Terminée', class: 'task-status-done', icon: '✅' },
      'cancelled': { label: 'Annulée', class: 'task-status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: status, class: 'task-status-default', icon: '❓' };
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

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done' || status === 'cancelled') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' || 
                          filterProject !== 'all' || filterAssignee !== 'all' || 
                          searchQuery.trim() !== '';

  if (loading) {
    return (
      <div className="dashboard-clean">
        <header className="header-clean">
          <div className="header-wrapper">
            <div className="brand">
              <div className="brand-icon">PT</div>
              <div className="brand-text">
                <span className="brand-name">Pioneer Tech</span>
                <span className="brand-tagline">Supervision des Tâches</span>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <div className="content-wrapper">
            <div className="loading-container">
              <LoadingSpinner />
              <p>Chargement des tâches...</p>
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
          <div className="brand" onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Supervision des Tâches</span>
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
                <span className="profile-role">Administrateur</span>
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
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Bouton retour */}
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour au tableau de bord
          </button>

          {/* Header de la page */}
          <div className="page-header-tasks">
            <div className="page-header-content">
              <h1 className="page-title">Supervision Globale des Tâches</h1>
              <p className="page-subtitle">
                Vue d'ensemble de toutes les tâches de tous les projets
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="stats-grid-admin">
            <div className="stat-card-admin stat-total">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 11l3 3L22 4" strokeWidth="2"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.total}</div>
                <div className="stat-label-admin">Tâches totales</div>
              </div>
            </div>

            <div className="stat-card-admin stat-todo">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.todo}</div>
                <div className="stat-label-admin">À faire</div>
              </div>
            </div>

            <div className="stat-card-admin stat-progress">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.inProgress}</div>
                <div className="stat-label-admin">En cours</div>
              </div>
            </div>

            <div className="stat-card-admin stat-review">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.review}</div>
                <div className="stat-label-admin">En révision</div>
              </div>
            </div>

            <div className="stat-card-admin stat-pending">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.pendingApproval}</div>
                <div className="stat-label-admin">En attente</div>
              </div>
            </div>

            <div className="stat-card-admin stat-done">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.done}</div>
                <div className="stat-label-admin">Terminées</div>
              </div>
            </div>

            <div className="stat-card-admin stat-unassigned">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  <line x1="18" y1="8" x2="23" y2="13" strokeWidth="2"/>
                  <line x1="23" y1="8" x2="18" y2="13" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.unassigned}</div>
                <div className="stat-label-admin">Non assignées</div>
              </div>
            </div>

            <div className="stat-card-admin stat-overdue">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.overdue}</div>
                <div className="stat-label-admin">En retard</div>
              </div>
            </div>

            <div className="stat-card-admin stat-high-priority">
              <div className="stat-icon-admin">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
                </svg>
              </div>
              <div className="stat-content-admin">
                <div className="stat-value-admin">{stats.highPriority}</div>
                <div className="stat-label-admin">Priorité élevée</div>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="filters-section">
            <div className="filters-row">
              <div className="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="review">En révision</option>
                <option value="pending_approval">En attente</option>
                <option value="done">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>

              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="all">Toutes priorités</option>
                <option value="urgent">Urgent</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>

              <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
                <option value="all">Tous les projets</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                <option value="all">Tous les membres</option>
                <option value="unassigned">Non assignées</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button className="btn-reset-all" onClick={handleResetFilters}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Liste des tâches */}
          <div className="tasks-container-admin">
            {tasks.length === 0 ? (
              <div className="empty-tasks-admin">
                <div className="empty-icon-admin">🔍</div>
                <h3>Aucune tâche trouvée</h3>
                <p>
                  {hasActiveFilters
                    ? 'Aucune tâche ne correspond aux filtres sélectionnés'
                    : 'Aucune tâche n\'existe actuellement'}
                </p>
              </div>
            ) : (
              <div className="tasks-table-admin">
                {tasks.map(task => {
                  const taskStatus = getStatusInfo(task.status);
                  const taskPriority = getPriorityInfo(task.priority);
                  const overdueTask = isOverdue(task.dueDate, task.status);

                  return (
                    <div 
                      key={task.id} 
                      className={`task-row-admin ${overdueTask ? 'task-row-overdue' : ''}`}
                      onClick={() => navigate(`/admin/projects/${task.project.id}`)}
                    >
                      <div 
                        className="task-project-dot"
                        style={{ backgroundColor: task.project?.color || '#6B7785' }}
                      ></div>

                      <div className="task-info-admin">
                        <h4 className="task-title-admin">{task.title}</h4>
                        <div className="task-meta-admin">
                          <span className="task-project-name">{task.project?.title}</span>
                          <span className="task-separator">•</span>
                          {task.assignee ? (
                            <span className="task-assignee-name">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                              </svg>
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          ) : (
                            <span className="task-unassigned-admin">Non assignée</span>
                          )}
                          {task.dueDate && (
                            <>
                              <span className="task-separator">•</span>
                              <span className={`task-date-admin ${overdueTask ? 'task-date-overdue' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                                </svg>
                                {formatDate(task.dueDate)}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="task-progress-wrapper-admin">
                          <div className="task-progress-bar-admin">
                            <div 
                              className="task-progress-fill-admin"
                              style={{ 
                                width: `${task.progress}%`,
                                background: task.project?.color || '#FF6B35'
                              }}
                            ></div>
                          </div>
                          <span className="task-progress-text-admin">{task.progress}%</span>
                        </div>
                      </div>

                      <div className="task-badges-admin">
                        <span className={`task-badge ${taskStatus.class}`}>
                          <span className="badge-icon">{taskStatus.icon}</span>
                          {taskStatus.label}
                        </span>
                        <span className={`task-badge ${taskPriority.class}`}>
                          <span className="badge-icon">{taskPriority.icon}</span>
                          {taskPriority.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTasks;