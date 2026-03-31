import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import './DashboardMember.css';

// ─── Workflow : transitions autorisées pour le membre ───────────────────────
const ALLOWED_TRANSITIONS = {
  'todo':        ['in_progress'],
  'in_progress': ['review'],
  'review':      ['pending_approval'],  // ← demande d'approbation
  'pending_approval': [],               // en attente, ne peut plus modifier
  'done':        [],
  'cancelled':   []
};

// Statuts qui nécessitent un commentaire obligatoire
const COMMENT_REQUIRED = ['pending_approval'];

// Colonnes Kanban
const KANBAN_COLUMNS = [
  { key: 'todo',             label: 'À faire',     color: '#6B7280', icon: '📝' },
  { key: 'in_progress',      label: 'En cours',    color: '#F59E0B', icon: '🔄' },
  { key: 'review',           label: 'En révision', color: '#3B82F6', icon: '👀' },
  { key: 'pending_approval', label: 'Approbation', color: '#8B5CF6', icon: '⏳' },
  { key: 'done',             label: 'Terminée',    color: '#10B981', icon: '✅' }
];

const DashboardMember = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [statsData, setStatsData] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    pendingApproval: 0,
    done: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Modal commentaire / approbation
  const [pendingChange, setPendingChange] = useState(null); // { taskId, newStatus }
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);

  // Drag & drop Kanban
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Réunions
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    fetchMyTasks();
  }, [filterStatus, filterPriority]);

  useEffect(() => { fetchMyMeetings(); }, []);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/my-tasks';
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.data.tasks);
        setStatsData(data.data.stats);
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

  // ─── Réunions ─────────────────────────────────────────────────────────────
  const fetchMyMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/meetings/my-meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMeetings(data.data.meetings);
    } catch (e) { console.error('Erreur chargement réunions:', e); }
  };

  const formatMeetingDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const d = new Date(date); d.setHours(0,0,0,0);
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (d.getTime() === today.getTime()) return `Aujourd'hui à ${timeStr}`;
    if (d.getTime() === tomorrow.getTime()) return `Demain à ${timeStr}`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ` à ${timeStr}`;
  };

  const isMeetingPast = (dateString) => new Date(dateString) < new Date();

  const upcomingMeetings = meetings
    .filter(m => !isMeetingPast(m.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  // ─── Vérifie si la transition est autorisée ─────────────────────────────
  const canTransition = (fromStatus, toStatus) => {
    return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
  };

  // ─── Démarre un changement de statut (avec vérifications) ───────────────
  const initiateStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Vérifier la transition
    if (!canTransition(task.status, newStatus)) {
      setAlert({
        type: 'error',
        message: `Transition impossible : ${getStatusLabel(task.status)} → ${getStatusLabel(newStatus)}`
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    // Si commentaire requis
    if (COMMENT_REQUIRED.includes(newStatus)) {
      setPendingChange({ taskId, newStatus });
      setComment('');
      setShowCommentModal(true);
      return;
    }

    // Sinon on applique directement
    applyStatusChange(taskId, newStatus, '');
  };

  // ─── Soumet le changement avec commentaire ──────────────────────────────
  const submitWithComment = async () => {
    if (!comment.trim()) {
      setAlert({ type: 'error', message: 'Le commentaire est obligatoire' });
      return;
    }
    setShowCommentModal(false);
    await applyStatusChange(pendingChange.taskId, pendingChange.newStatus, comment);
    setPendingChange(null);
    setComment('');
  };

  // ─── Appelle l'API ───────────────────────────────────────────────────────
  const applyStatusChange = async (taskId, newStatus, comment) => {
    setUpdatingTaskId(taskId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, comment })
      });
      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour la tâche localement
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus, progress: newStatus === 'done' ? 100 : t.progress }
            : t
        ));
        
        // Mettre à jour les stats localement
        setStatsData(prev => {
          const task = tasks.find(t => t.id === taskId);
          if (!task) return prev;
          
          const newStats = { ...prev };
          
          // Décrémenter l'ancien statut
          if (task.status === 'todo') newStats.todo--;
          if (task.status === 'in_progress') newStats.inProgress--;
          if (task.status === 'review') newStats.review--;
          if (task.status === 'pending_approval') newStats.pendingApproval--;
          if (task.status === 'done') newStats.done--;
          
          // Incrémenter le nouveau statut
          if (newStatus === 'todo') newStats.todo++;
          if (newStatus === 'in_progress') newStats.inProgress++;
          if (newStatus === 'review') newStats.review++;
          if (newStatus === 'pending_approval') newStats.pendingApproval++;
          if (newStatus === 'done') newStats.done++;
          
          return newStats;
        });
        
        const msg = newStatus === 'pending_approval'
          ? '✅ Tâche soumise pour approbation ! Le manager sera notifié.'
          : '✅ Statut mis à jour avec succès !';
        setAlert({ type: 'success', message: msg });
        setTimeout(() => setAlert(null), 3000);
      } else {
        setAlert({ type: 'error', message: data.message || 'Erreur lors de la mise à jour' });
      }
    } catch (error) {
      console.error('Erreur modification statut:', error);
      setAlert({ type: 'error', message: 'Erreur de connexion au serveur' });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // ─── Drag & drop ────────────────────────────────────────────────────────
  const handleDragStart = (e, task) => {
    setDraggingTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingTask || draggingTask.status === columnKey) {
      setDraggingTask(null);
      return;
    }
    initiateStatusChange(draggingTask.id, columnKey);
    setDraggingTask(null);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setDragOverColumn(null);
  };

  // ─── Helpers UI ─────────────────────────────────────────────────────────
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

  const getStatusLabel = (status) => {
    const map = {
      'todo': 'À faire',
      'in_progress': 'En cours',
      'review': 'En révision',
      'pending_approval': 'En attente d\'approbation',
      'done': 'Terminée',
      'cancelled': 'Annulée'
    };
    return map[status] || status;
  };

  const getStatusInfo = (status) => {
    const map = {
      'todo':             { label: 'À faire',     cls: 'task-status-todo' },
      'in_progress':      { label: 'En cours',    cls: 'task-status-progress' },
      'review':           { label: 'En révision', cls: 'task-status-review' },
      'pending_approval': { label: 'Approbation', cls: 'task-status-pending' },
      'done':             { label: 'Terminée',    cls: 'task-status-done' },
      'cancelled':        { label: 'Annulée',     cls: 'task-status-cancelled' }
    };
    return map[status] || { label: status, cls: 'task-status-default' };
  };

  const getPriorityInfo = (priority) => {
    const map = {
      'urgent': { label: 'Urgent',  cls: 'priority-urgent' },
      'high':   { label: 'Haute',   cls: 'priority-high' },
      'medium': { label: 'Moyenne', cls: 'priority-medium' },
      'low':    { label: 'Basse',   cls: 'priority-low' }
    };
    return map[priority] || { label: priority, cls: 'priority-default' };
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done' || status === 'cancelled' || status === 'pending_approval') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pas de date';
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `En retard de ${Math.abs(diff)}j`;
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Demain";
    if (diff <= 7) return `Dans ${diff} jours`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const stats = [
    { label: 'Mes tâches',   value: String(statsData.total),           icon: '📋', trend: `${statsData.inProgress} en cours` },
    { label: 'À faire',      value: String(statsData.todo),            icon: '📝', trend: 'en attente' },
    { label: 'En cours',     value: String(statsData.inProgress),      icon: '🔄', trend: 'en progression' },
    { label: 'En révision',  value: String(statsData.review),          icon: '👀', trend: 'à valider' },
    { label: 'Approbation',  value: String(statsData.pendingApproval), icon: '⏳', trend: 'en attente manager' },
    { label: 'Terminées',    value: String(statsData.done),            icon: '✅', trend: `sur ${statsData.total} tâches` }
  ];

  // ─── Composant carte tâche (partagé liste & kanban) ─────────────────────
  const TaskCard = ({ task, compact = false }) => {
    const statusInfo = getStatusInfo(task.status);
    const priorityInfo = getPriorityInfo(task.priority);
    const overdueTask = isOverdue(task.dueDate, task.status);
    const isUpdating = updatingTaskId === task.id;
    const nextStatuses = ALLOWED_TRANSITIONS[task.status] || [];

    return (
      <div
        className={`task-row ${overdueTask ? 'task-row-overdue' : ''} ${compact ? 'task-row-compact' : ''} ${isUpdating ? 'task-row-updating' : ''}`}
        draggable={viewMode === 'kanban' && task.status !== 'pending_approval' && task.status !== 'done'}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
      >
        <div className="task-project-dot" style={{ backgroundColor: task.project?.color || '#6B7785' }} title={task.project?.title} />

        <div className="task-info" onClick={() => navigate(`/member/projects/${task.project?.id}`)}>
          <h3 className="task-title">{task.title}</h3>
          <div className="task-meta">
            <span className="task-project">{task.project?.title}</span>
            <span className="task-separator">•</span>
            <span className={`task-date ${overdueTask ? 'task-date-overdue' : ''}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
              </svg>
              {formatDate(task.dueDate)}
            </span>
          </div>
          {!compact && (
            <div className="task-progress-mini">
              <div className="task-progress-mini-bar">
                <div className="task-progress-mini-fill" style={{ width: `${task.progress}%`, background: task.project?.color || '#FF6B35' }} />
              </div>
              <span className="task-progress-mini-value">{task.progress}%</span>
            </div>
          )}
        </div>

        <span className={`task-badge ${priorityInfo.cls}`}>{priorityInfo.label}</span>

        {/* Bouton(s) de transition */}
        <div className="task-actions-btns">
          {isUpdating ? (
            <div className="task-updating-spinner">
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 6v6l4 2" strokeWidth="2"/>
              </svg>
            </div>
          ) : nextStatuses.length > 0 ? (
            nextStatuses.map(next => (
              <button
                key={next}
                className={`btn-transition btn-transition-${next}`}
                onClick={() => initiateStatusChange(task.id, next)}
                title={`Passer à : ${getStatusLabel(next)}`}
              >
                {next === 'pending_approval' ? '⏳' : next === 'review' ? '👀' : '🔄'}
                <span>{next === 'pending_approval' ? 'Soumettre' : getStatusLabel(next)}</span>
                {next === 'pending_approval' && <span className="approval-hint">· Approbation requise</span>}
              </button>
            ))
          ) : (
            <span className={`task-badge ${statusInfo.cls}`}>
              {task.status === 'pending_approval' ? '⏳ En attente' : statusInfo.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-clean">
        <header className="header-clean">
          <div className="header-wrapper">
            <div className="brand">
              <div className="brand-icon">PT</div>
              <div className="brand-text">
                <span className="brand-name">Pioneer Tech</span>
                <span className="brand-tagline">Tableau de bord</span>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <div className="content-wrapper">
            <div className="loading-container">
              <LoadingSpinner />
              <p>Chargement de vos tâches...</p>
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
          <div className="brand">
            <div className="brand-icon">PT</div>
            <div className="brand-text">
              <span className="brand-name">Pioneer Tech</span>
              <span className="brand-tagline">Tableau de bord</span>
            </div>
          </div>

          <div className="header-end">
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
                <span className="profile-role">Membre</span>
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
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

          {/* Bienvenue */}
          <div className="welcome-message">
            <h1 className="welcome-title">{getGreeting()}, {user?.firstName}</h1>
            <p className="welcome-subtitle">Voici vos tâches et votre activité du jour</p>
          </div>

          {/* Statistiques */}
          <div className="stats-overview">
            {stats.map((stat, index) => (
              <div key={index} className="stat-box">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-trend">{stat.trend}</div>
              </div>
            ))}
          </div>

          {/* Boîte principale */}
          <div className="box-white">
            <div className="box-header">
              <h2 className="box-title">Mes tâches assignées ({statsData.total})</h2>

              <div className="box-header-right">
                {/* Toggle vue */}
                <div className="view-toggle">
                  <button
                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Vue liste"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="3" cy="6" r="1.5" fill="currentColor"/>
                      <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="3" cy="18" r="1.5" fill="currentColor"/>
                    </svg>
                    Liste
                  </button>
                  <button
                    className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                    onClick={() => setViewMode('kanban')}
                    title="Vue Kanban"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="5" height="18" rx="1" strokeWidth="2"/>
                      <rect x="10" y="3" width="5" height="12" rx="1" strokeWidth="2"/>
                      <rect x="17" y="3" width="5" height="15" rx="1" strokeWidth="2"/>
                    </svg>
                    Kanban
                  </button>
                </div>

                {/* Filtres */}
                <div className="task-filters">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tous les statuts</option>
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="review">En révision</option>
                    <option value="pending_approval">En attente</option>
                    <option value="done">Terminées</option>
                  </select>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                    <option value="all">Toutes priorités</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">Haute</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                  {(filterStatus !== 'all' || filterPriority !== 'all') && (
                    <button className="btn-reset-filters" onClick={() => { setFilterStatus('all'); setFilterPriority('all'); }}>
                      ✕ Réinitialiser
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="box-body">
              {tasks.length === 0 ? (
                <div className="empty-tasks">
                  <div className="empty-tasks-icon">📋</div>
                  <h3>Aucune tâche</h3>
                  <p>
                    {filterStatus !== 'all' || filterPriority !== 'all'
                      ? 'Aucune tâche ne correspond aux filtres'
                      : "Vous n'avez aucune tâche assignée pour le moment"}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                /* ── VUE LISTE ── */
                <div className="tasks-table">
                  {tasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
              ) : (
                /* ── VUE KANBAN ── */
                <div className="kanban-board">
                  {KANBAN_COLUMNS.map(col => {
                    const colTasks = tasks.filter(t => t.status === col.key);
                    const isDragOver = dragOverColumn === col.key;
                    return (
                      <div
                        key={col.key}
                        className={`kanban-column ${isDragOver ? 'kanban-column-dragover' : ''}`}
                        onDragOver={(e) => handleDragOver(e, col.key)}
                        onDrop={(e) => handleDrop(e, col.key)}
                        onDragLeave={() => setDragOverColumn(null)}
                      >
                        <div className="kanban-column-header" style={{ borderTopColor: col.color }}>
                          <span className="kanban-col-icon">{col.icon}</span>
                          <span className="kanban-col-title">{col.label}</span>
                          <span className="kanban-col-count" style={{ backgroundColor: col.color + '22', color: col.color }}>
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="kanban-column-body">
                          {colTasks.length === 0 ? (
                            <div className="kanban-empty">
                              {isDragOver ? 'Déposer ici' : 'Aucune tâche'}
                            </div>
                          ) : (
                            colTasks.map(task => <TaskCard key={task.id} task={task} compact />)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

          {/* ── Réunions à venir ── */}
          <div className="box-white member-meetings-box">
            <div className="box-header">
              <h2 className="box-title">
                Mes réunions à venir
                {upcomingMeetings.length > 0 && (
                  <span className="member-meeting-badge">{upcomingMeetings.length}</span>
                )}
              </h2>
            </div>
            <div className="box-body">
              {upcomingMeetings.length === 0 ? (
                <div className="empty-tasks">
                  <div className="empty-tasks-icon">📅</div>
                  <h3>Aucune réunion à venir</h3>
                  <p>Votre manager n'a pas encore planifié de réunion</p>
                </div>
              ) : (
                <div className="member-meetings-list">
                  {upcomingMeetings.map(meeting => (
                    <div key={meeting.id} className={`member-meeting-card ${meeting.meetLink ? "member-meeting-card-clickable" : ""}`} onClick={() => meeting.meetLink && window.open(meeting.meetLink, "_blank", "noopener,noreferrer")} style={{ cursor: meeting.meetLink ? "pointer" : "default" }}>
                      {/* Bloc date */}
                      <div className="member-meeting-date-col">
                        <div className="member-meeting-day">
                          {new Date(meeting.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="member-meeting-time">
                          {new Date(meeting.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="member-meeting-info">
                        <h4 className="member-meeting-title">{meeting.title}</h4>
                        {meeting.description && (
                          <p className="member-meeting-desc">{meeting.description}</p>
                        )}
                        <div className="member-meeting-meta">
                          <span className="member-meeting-duration">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                            </svg>
                            {meeting.duration} min
                          </span>
                          {meeting.creator && (
                            <span className="member-meeting-organizer">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                              </svg>
                              {meeting.creator.firstName} {meeting.creator.lastName}
                            </span>
                          )}
                          {meeting.participants?.length > 0 && (
                            <span className="member-meeting-participants-count">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                                <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
                              </svg>
                              {meeting.participants.length} participant{meeting.participants.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bouton rejoindre */}
                      {meeting.meetLink && (
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="member-btn-join"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polygon points="23 7 16 12 23 17 23 7" strokeWidth="2"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="2"/>
                          </svg>
                          Rejoindre
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
       
      </main>

      {/* ── MODAL COMMENTAIRE / APPROBATION ── */}
      {showCommentModal && pendingChange && (
        <div className="modal-overlay" onClick={() => { setShowCommentModal(false); setPendingChange(null); }}>
          <div className="modal-content modal-comment" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon approval">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 11l3 3L22 4" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
                </svg>
              </div>
              <h2>Soumettre pour approbation</h2>
              <p>
                Marquer cette tâche comme <strong>terminée</strong> nécessite l'approbation du manager.<br />
                Laissez un commentaire expliquant ce qui a été réalisé.
              </p>
            </div>

            <div className="modal-body">
              <label className="comment-label">
                Commentaire <span className="required">*</span>
              </label>
              <textarea
                className="comment-textarea"
                placeholder="Décrivez ce qui a été accompli, les livrables produits, les points importants..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                autoFocus
              />
              <p className="comment-hint">
                ⚠️ Le manager recevra une notification et devra approuver avant que la tâche soit marquée terminée.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => { setShowCommentModal(false); setPendingChange(null); }}>
                Annuler
              </button>
              <button
                className="btn-modal-primary"
                onClick={submitWithComment}
                disabled={!comment.trim()}
              >
                Soumettre pour approbation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMember;