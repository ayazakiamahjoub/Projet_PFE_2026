import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ThemeToggle from '../components/common/ThemeToggle';
import './AdminTasks.css';

const AdminTasks = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0, todo: 0, inProgress: 0, review: 0, pendingApproval: 0,
    done: 0, cancelled: 0, unassigned: 0, overdue: 0, highPriority: 0
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '', priority: '', projectId: '', assignedTo: '', search: ''
  });

  useEffect(() => { fetchTasksData(); }, [filters]);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      // Ajouter les filtres
      if (filters.status)    queryParams.append('status',    filters.status);
      if (filters.priority)  queryParams.append('priority',  filters.priority);
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.assignedTo)queryParams.append('assignedTo',filters.assignedTo);
      if (filters.search)    queryParams.append('search',    filters.search);
      
      // ⚠️ SOLUTION: Ajouter limit=10000 pour récupérer TOUTES les tâches
      queryParams.append('limit', '10000');

      const res  = await fetch(`http://localhost:5000/api/tasks/all?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        const allTasks = data.data.tasks || [];
        setTasks(allTasks);
        
        // Calculer les stats à partir des tâches récupérées
        setStats({
          total:           allTasks.length,
          todo:            allTasks.filter(t => t.status === 'todo').length,
          inProgress:      allTasks.filter(t => t.status === 'in_progress').length,
          review:          allTasks.filter(t => t.status === 'review').length,
          pendingApproval: allTasks.filter(t => t.status === 'pending_approval').length,
          done:            allTasks.filter(t => t.status === 'done').length,
          cancelled:       allTasks.filter(t => t.status === 'cancelled').length,
          unassigned:      allTasks.filter(t => !t.assignedTo).length,
          overdue:         allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done' && t.status !== 'cancelled').length,
          highPriority:    allTasks.filter(t => t.priority === 'high').length
        });
      }
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const handleFilterChange = (name, value) => setFilters(prev => ({ ...prev, [name]: value }));
  const resetFilters    = () => setFilters({ status:'', priority:'', projectId:'', assignedTo:'', search:'' });

  const getStatusBadgeClass = s => ({ 
    todo:'status-todo', 
    in_progress:'status-in-progress', 
    review:'status-review', 
    pending_approval:'status-pending', 
    done:'status-done', 
    cancelled:'status-cancelled' 
  }[s] || 'status-default');
  
  const getStatusLabel      = s => ({ 
    todo:'À faire', 
    in_progress:'En cours', 
    review:'En revue', 
    pending_approval:'En attente', 
    done:'Terminé', 
    cancelled:'Annulé' 
  }[s] || s);
  
  const getPriorityBadgeClass = p => ({ 
    low:'priority-low', 
    medium:'priority-medium', 
    high:'priority-high' 
  }[p] || 'priority-default');
  
  const getPriorityLabel    = p => ({ 
    low:'Basse', 
    medium:'Moyenne', 
    high:'Haute' 
  }[p] || p);
  
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : 'Non défini';

  if (loading) return (
    <div className="admin-tasks-page">
      <header className="header-clean">
        <div className="header-wrapper">
          <div className="brand" onClick={() => navigate('/admin/dashboard')} style={{ cursor:'pointer' }}>
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Supervision des tâches</span>
            </div>
          </div>
        </div>
      </header>
      <main className="content">
        <div className="content-wrapper">
          <div className="loading-container"><LoadingSpinner /><p>Chargement des tâches...</p></div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="admin-tasks-page">
      {/* ── Header ── */}
      <header className="header-clean">
        <div className="header-wrapper">
          <div className="brand" onClick={() => navigate('/admin/dashboard')} style={{ cursor:'pointer' }}>
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Supervision des tâches</span>
            </div>
          </div>

          <div className="header-end">
            <ThemeToggle />
            <div className="profile">
              <div className="profile-avatar">
                {user?.avatarUrl
                  ? <img src={`http://localhost:5000${user.avatarUrl}`} alt="Avatar" className="avatar-img" />
                  : <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>}
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

      {/* ── Contenu ── */}
      <main className="content">
        <div className="content-wrapper">

          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour au dashboard
          </button>

          <div className="page-header">
            <div className="page-header-content">
              <h1 className="page-title">Supervision des tâches</h1>
              <p className="page-subtitle">Vue globale de toutes les tâches de la plateforme</p>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4" strokeWidth="2"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.total}</div><div className="stat-label">Tâches totales</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><polyline points="12 6 12 12 16 14" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.inProgress}</div><div className="stat-label">En cours</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.pendingApproval}</div><div className="stat-label">En attente</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/><polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.done}</div><div className="stat-label">Terminées</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.overdue}</div><div className="stat-label">En retard</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/><line x1="12" y1="9" x2="12" y2="13" strokeWidth="2"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/></svg>
              </div>
              <div className="stat-content"><div className="stat-value">{stats.highPriority}</div><div className="stat-label">Haute priorité</div></div>
            </div>
          </div>

          {/* Filtres */}
          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Statut</label>
                <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="review">En revue</option>
                  <option value="pending_approval">En attente</option>
                  <option value="done">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Priorité</label>
                <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)}>
                  <option value="">Toutes les priorités</option>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Recherche</label>
                <input type="text" placeholder="Rechercher une tâche..." value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} />
              </div>
              <button className="btn-reset-filters" onClick={resetFilters}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10" strokeWidth="2"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeWidth="2"/></svg>
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Tableau */}
          <div className="tasks-section">
            <h2 className="section-title">Tâches ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4" strokeWidth="2"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/></svg>
                <p>Aucune tâche trouvée</p>
              </div>
            ) : (
              <div className="tasks-table">
                <table>
                  <thead>
                    <tr><th>Tâche</th><th>Projet</th><th>Assigné à</th><th>Statut</th><th>Priorité</th><th>Échéance</th></tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td>
                          <div className="task-title">{task.title}</div>
                          {task.description && <div className="task-description">{task.description}</div>}
                        </td>
                        <td>
                          <div className="project-cell">
                            <div className="project-color" style={{ background: task.project?.color }} />
                            <span>{task.project?.title}</span>
                          </div>
                        </td>
                        <td>
                          {task.assignee ? (
                            <div className="assignee-cell">
                              <div className="assignee-avatar">
                                {task.assignee.avatarUrl
                                  ? <img src={`http://localhost:5000${task.assignee.avatarUrl}`} alt="" className="avatar-img" />
                                  : <span>{task.assignee.firstName?.charAt(0)}{task.assignee.lastName?.charAt(0)}</span>}
                              </div>
                              <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-muted">Non assigné</span>
                          )}
                        </td>
                        <td><span className={`badge ${getStatusBadgeClass(task.status)}`}>{getStatusLabel(task.status)}</span></td>
                        <td><span className={`badge ${getPriorityBadgeClass(task.priority)}`}>{getPriorityLabel(task.priority)}</span></td>
                        <td>
                          <span className={task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-danger' : ''}>
                            {formatDate(task.dueDate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminTasks;