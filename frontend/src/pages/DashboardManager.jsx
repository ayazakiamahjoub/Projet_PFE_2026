import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import ThemeToggle from '../components/common/ThemeToggle';
import './DashboardManager.css';

const DashboardManager = () => {
  const { user, logout, getDashboardUrl } = useAuth();
  const navigate = useNavigate();

  const [myProjects, setMyProjects] = useState([]);
  const [pendingApprovalTasks, setPendingApprovalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const [alert, setAlert] = useState(null);
  const [processingTaskId, setProcessingTaskId] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'

  // États réunions
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [members, setMembers] = useState([]);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    description: '',
    meetLink: '',
    participants: []
  });

  useEffect(() => {
    fetchProjects();
    fetchProjectStats();
    fetchPendingApprovalTasks();
    fetchMeetings();
    fetchMembers();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyProjects(data.data.projects);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  const fetchProjectStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/projects/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjectStats(data.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const fetchPendingApprovalTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks/pending-approval', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingApprovalTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Erreur chargement tâches en attente:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMeetings(data.data.meetings);
    } catch (e) { console.error('Erreur chargement réunions:', e); }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMembers(data.data.users || []);
    } catch (e) { console.error('Erreur chargement membres:', e); }
  };

  const handleMeetingFormChange = (e) => {
    const { name, value } = e.target;
    setMeetingForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (memberId) => {
    setMeetingForm(prev => ({
      ...prev,
      participants: prev.participants.includes(memberId)
        ? prev.participants.filter(id => id !== memberId)
        : [...prev.participants, memberId]
    }));
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) {
      setAlert({ type: 'error', message: 'Le titre, la date et l heure sont obligatoires' });
      return;
    }
    setSavingMeeting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: meetingForm.title.trim(),
          scheduledAt: `${meetingForm.date}T${meetingForm.time}`,
          duration: parseInt(meetingForm.duration),
          description: meetingForm.description.trim() || null,
          meetLink: meetingForm.meetLink.trim() || null,
          participants: meetingForm.participants
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: '✅ Réunion planifiée avec succès !' });
        setShowMeetingModal(false);
        setMeetingForm({ title: '', date: '', time: '', duration: '60', description: '', meetLink: '', participants: [] });
        fetchMeetings();
        setTimeout(() => setAlert(null), 3000);
      } else {
        setAlert({ type: 'error', message: data.message || 'Erreur lors de la création' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Erreur de connexion au serveur' });
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
        setAlert({ type: 'success', message: 'Réunion supprimée' });
        setTimeout(() => setAlert(null), 2000);
      }
    } catch { console.error('Erreur suppression réunion'); }
  };

  const formatMeetingDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    today.setHours(0,0,0,0);
    tomorrow.setHours(0,0,0,0);
    const d = new Date(date); d.setHours(0,0,0,0);
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (d.getTime() === today.getTime()) return `Aujourd'hui à ${timeStr}`;
    if (d.getTime() === tomorrow.getTime()) return `Demain à ${timeStr}`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ` à ${timeStr}`;
  };

  const isMeetingPast = (dateString) => new Date(dateString) < new Date();

  const handleApproval = (task, action) => {
    setCurrentTask(task);
    setApprovalAction(action);
    setApprovalComment('');
    setShowCommentModal(true);
  };

  const submitApproval = async () => {
    if (!currentTask) return;

    setProcessingTaskId(currentTask.id);
    setShowCommentModal(false);

    try {
      const token = localStorage.getItem('token');
      const newStatus = approvalAction === 'approve' ? 'done' : 'review';
      
      const response = await fetch(`http://localhost:5000/api/tasks/${currentTask.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          comment: approvalComment 
        })
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: approvalAction === 'approve' 
            ? '✅ Tâche approuvée et marquée comme terminée !' 
            : '🔄 Tâche rejetée, retour en révision.'
        });
        
        // Retirer la tâche de la liste des attentes
        setPendingApprovalTasks(prev => prev.filter(t => t.id !== currentTask.id));
        
        setTimeout(() => setAlert(null), 3000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de l\'approbation'
        });
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setProcessingTaskId(null);
      setCurrentTask(null);
      setApprovalAction(null);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Pas de date';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      'urgent': { label: 'Urgent', class: 'priority-urgent' },
      'high': { label: 'Haute', class: 'priority-high' },
      'medium': { label: 'Moyenne', class: 'priority-medium' },
      'low': { label: 'Basse', class: 'priority-low' }
    };
    return priorityMap[priority] || { label: priority, class: 'priority-default' };
  };

  const stats = [
    { 
      label: 'Mes projets', 
      value: projectStats.total.toString(),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"/></svg>,
      trend: `${projectStats.active} en cours`
    },
    { 
      label: 'Tâches en attente', 
      value: pendingApprovalTasks.length.toString(),
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><polyline points="12 6 12 12 16 14" strokeWidth="2"/></svg>,
      trend: `à approuver`
    },
    { 
      label: 'Tâches terminées', 
      value: projectStats.completed?.toString() || '0',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/><polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/></svg>,
      trend: 'ce mois'
    },
    { 
      label: 'Taux de complétion', 
      value: projectStats.total > 0 
        ? `${Math.round((projectStats.completed / projectStats.total) * 100)}%` 
        : '0%',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10" strokeWidth="2"/><line x1="12" y1="20" x2="12" y2="4" strokeWidth="2"/><line x1="6" y1="20" x2="6" y2="14" strokeWidth="2"/></svg>,
      trend: '+5% ce mois'
    }
  ];

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
                <span className="profile-role">Manager</span>
              </div>
            </div>

            <ThemeToggle />
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

          {/* Bienvenue */}
          <div className="welcome">
            <h1 className="page-title">
              {getGreeting()}, {user?.firstName}
            </h1>
            <p className="page-subtitle">
              Gérez vos projets et approuvez les tâches de votre équipe
            </p>
          </div>

          {/* Statistiques */}
          <div className="stats-row">
            {stats.map((stat, index) => (
              <div key={index} className="stat-box">
                <div className="stat-header">
                  <div className="stat-icon-svg">{stat.icon}</div>
                  <span className="stat-trend">{stat.trend}</span>
                </div>
                <div className="stat-body">
                  <h2 className="stat-number">{stat.value}</h2>
                  <p className="stat-text">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Section Approbation - PRIORITAIRE */}
          <div className="approval-section">
            <div className="approval-header">
              <h2 className="approval-title">
                <span className="approval-badge">{pendingApprovalTasks.length}</span>
                Tâches en attente d'approbation
              </h2>
              <p className="approval-subtitle">
                Examinez et approuvez les tâches soumises par votre équipe
              </p>
            </div>

            {loading ? (
              <div className="loading-container">
                <LoadingSpinner />
                <p>Chargement des tâches en attente...</p>
              </div>
            ) : pendingApprovalTasks.length === 0 ? (
              <div className="empty-approval">
                
                <h3>Aucune tâche en attente</h3>
                <p>Toutes les tâches sont approuvées ou en cours</p>
              </div>
            ) : (
              <div className="approval-tasks-list">
                {pendingApprovalTasks.map(task => {
                  const priorityInfo = getPriorityInfo(task.priority);
                  const isProcessing = processingTaskId === task.id;
                  
                  return (
                    <div key={task.id} className="approval-task-card">
                      <div className="approval-task-header">
                        <div className="approval-task-title-section">
                          <h3 className="approval-task-title">{task.title}</h3>
                          <span className={`approval-priority ${priorityInfo.class}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <div className="approval-task-project">
                          <div 
                            className="approval-project-dot"
                            style={{ backgroundColor: task.project?.color || '#FF6B35' }}
                          ></div>
                          <span>{task.project?.title}</span>
                        </div>
                      </div>

                      {task.description && (
                        <p className="approval-task-description">{task.description}</p>
                      )}

                      <div className="approval-task-details">
                        <div className="approval-detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                            <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                          </svg>
                          <span>Assignée à : {task.assignee?.firstName} {task.assignee?.lastName}</span>
                        </div>
                        <div className="approval-detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                          </svg>
                          <span>Date limite : {formatDate(task.dueDate)}</span>
                        </div>
                        <div className="approval-detail-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                            <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                          </svg>
                          <span>Heures estimées : {task.estimatedHours || 0}h</span>
                        </div>
                      </div>

                      {/* Demande d'approbation */}
                      {task.approvalRequest && (
                        <div className="approval-request">
                          <div className="approval-request-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
                            </svg>
                            <span>Demande d'approbation</span>
                          </div>
                          <div className="approval-request-content">
                            <p className="approval-request-comment">{task.approvalRequest.comment}</p>
                            <div className="approval-request-meta">
                              <span>Soumis par : {task.assignee?.firstName} {task.assignee?.lastName}</span>
                              <span>•</span>
                              <span>Le : {formatDateTime(task.approvalRequest.requestedAt)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="approval-actions">
                        <button
                          className="approval-btn reject"
                          onClick={() => handleApproval(task, 'reject')}
                          disabled={isProcessing}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                          </svg>
                          Rejeter
                        </button>
                        <button
                          className="approval-btn approve"
                          onClick={() => handleApproval(task, 'approve')}
                          disabled={isProcessing}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                          </svg>
                          Approuver
                        </button>
                      </div>

                      {isProcessing && (
                        <div className="approval-processing">
                          <svg className="spinner-small" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                            <path d="M12 6v6l4 2" strokeWidth="2"/>
                          </svg>
                          Traitement en cours...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                {myProjects.length === 0 ? (
                  <div className="empty-state">
                    
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
                    {myProjects.slice(0, 3).map(project => {
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
                                className="btn-view"
                                onClick={() => navigate(`/manager/projects/${project.id}`)}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                                </svg>
                                Voir
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

            {/* Réunions planifiées */}
            <div className="box box-full">
              <div className="box-header">
                <h3 className="box-title">
                  Réunions planifiées
                  {meetings.length > 0 && <span className="meeting-count-badge">{meetings.length}</span>}
                </h3>
                <button className="btn-add" onClick={() => setShowMeetingModal(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Nouvelle réunion
                </button>
              </div>
              <div className="box-content">
                {meetings.length === 0 ? (
                  <div className="empty-state">
                    
                    <h3>Aucune réunion planifiée</h3>
                    <p>Planifiez votre première réunion d'équipe</p>
                    <button className="btn-create-first" onClick={() => setShowMeetingModal(true)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Planifier une réunion
                    </button>
                  </div>
                ) : (
                  <div className="meetings-list">
                    {meetings.sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)).map(meeting => {
                      const past = isMeetingPast(meeting.scheduledAt);
                      return (
                        <div key={meeting.id} className={`meeting-card ${past ? 'meeting-past' : ''} ${meeting.meetLink ? 'meeting-card-clickable' : ''}`} onClick={() => meeting.meetLink && window.open(meeting.meetLink, '_blank', 'noopener,noreferrer')} style={{ cursor: meeting.meetLink ? 'pointer' : 'default' }}>
                          <div className="meeting-time-col">
                            <div className="meeting-time">{formatMeetingDate(meeting.scheduledAt)}</div>
                            <div className="meeting-duration">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                                <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                              </svg>
                              {meeting.duration} min
                            </div>
                          </div>

                          <div className="meeting-info-col">
                            <h4 className="meeting-title">{meeting.title}</h4>
                            {meeting.description && <p className="meeting-description">{meeting.description}</p>}
                            {meeting.participants?.length > 0 && (
                              <div className="meeting-participants">
                                {meeting.participants.slice(0, 4).map((p, i) => (
                                  <div key={i} className="participant-avatar" title={`${p.firstName} ${p.lastName}`}>
                                    {p.avatarUrl
                                      ? <img src={`http://localhost:5000${p.avatarUrl}`} alt="" />
                                      : <span>{p.firstName?.charAt(0)}{p.lastName?.charAt(0)}</span>}
                                  </div>
                                ))}
                                {meeting.participants.length > 4 && (
                                  <div className="participant-avatar participant-more">
                                    +{meeting.participants.length - 4}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="meeting-actions-col">
                            {meeting.meetLink && !past && (
                              <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="btn-join-meeting">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <polygon points="23 7 16 12 23 17 23 7" strokeWidth="2"/>
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="2"/>
                                </svg>
                                Rejoindre
                              </a>
                            )}
                            {past && <span className="meeting-past-label">Passée</span>}
                            <button className="btn-delete-meeting" onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(meeting.id); }} title="Supprimer">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="3 6 5 6 21 6" strokeWidth="2"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
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

                  <button className="action" onClick={() => setShowMeetingModal(true)}>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL PLANIFICATION RÉUNION ── */}
      {showMeetingModal && (
        <div className="modal-overlay" onClick={() => !savingMeeting && setShowMeetingModal(false)}>
          <div className="modal-content modal-meeting" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                </svg>
                Planifier une réunion
              </h2>
              <button className="modal-close" onClick={() => setShowMeetingModal(false)} disabled={savingMeeting}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="meeting-form">
              {/* Titre */}
              <div className="form-group">
                <label htmlFor="meeting-title">Titre de la réunion *</label>
                <input
                  type="text"
                  id="meeting-title"
                  name="title"
                  value={meetingForm.title}
                  onChange={handleMeetingFormChange}
                  placeholder="Ex : Point hebdomadaire équipe"
                  required
                />
              </div>

              {/* Date + Heure */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="meeting-date">Date *</label>
                  <input
                    type="date"
                    id="meeting-date"
                    name="date"
                    value={meetingForm.date}
                    onChange={handleMeetingFormChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="meeting-time">Heure *</label>
                  <input
                    type="time"
                    id="meeting-time"
                    name="time"
                    value={meetingForm.time}
                    onChange={handleMeetingFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="meeting-duration">Durée</label>
                  <select id="meeting-duration" name="duration" value={meetingForm.duration} onChange={handleMeetingFormChange}>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1h</option>
                    <option value="90">1h30</option>
                    <option value="120">2h</option>
                    <option value="180">3h</option>
                  </select>
                </div>
              </div>

              {/* Lien visio */}
              <div className="form-group">
                <label htmlFor="meeting-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{verticalAlign:'middle', marginRight:'4px'}}>
                    <polygon points="23 7 16 12 23 17 23 7" strokeWidth="2"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" strokeWidth="2"/>
                  </svg>
                  Lien visioconférence
                </label>
                <input
                  type="url"
                  id="meeting-link"
                  name="meetLink"
                  value={meetingForm.meetLink}
                  onChange={handleMeetingFormChange}
                  placeholder="https://meet.google.com/xxx ou https://zoom.us/j/xxx"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="meeting-desc">Description / Ordre du jour</label>
                <textarea
                  id="meeting-desc"
                  name="description"
                  value={meetingForm.description}
                  onChange={handleMeetingFormChange}
                  rows="3"
                  placeholder="Points à aborder, objectifs de la réunion..."
                />
              </div>

              {/* Participants */}
              <div className="form-group">
                <label>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{verticalAlign:'middle', marginRight:'4px'}}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
                  </svg>
                  Participants ({meetingForm.participants.length} sélectionné{meetingForm.participants.length > 1 ? 's' : ''})
                </label>
                <div className="participants-grid">
                  {members.length === 0 ? (
                    <p className="no-members">Aucun membre disponible</p>
                  ) : (
                    members.map(member => {
                      const selected = meetingForm.participants.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          className={`participant-chip ${selected ? 'selected' : ''}`}
                          onClick={() => toggleParticipant(member.id)}
                        >
                          <div className="participant-chip-avatar">
                            {member.avatarUrl
                              ? <img src={`http://localhost:5000${member.avatarUrl}`} alt="" />
                              : <span>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</span>}
                          </div>
                          <span className="participant-chip-name">{member.firstName} {member.lastName}</span>
                          {selected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="participant-check">
                              <polyline points="20 6 9 17 4 12" strokeWidth="2.5"/>
                            </svg>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal-secondary" onClick={() => setShowMeetingModal(false)} disabled={savingMeeting}>
                  Annuler
                </button>
                <button type="submit" className="btn-modal-primary" disabled={savingMeeting}>
                  {savingMeeting ? 'Planification...' : 'Planifier la réunion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'approbation avec commentaire */}
      {showCommentModal && currentTask && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content modal-approval" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`modal-icon ${approvalAction === 'approve' ? 'approve' : 'reject'}`}>
                {approvalAction === 'approve' ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <h2>{approvalAction === 'approve' ? 'Approuver la tâche' : 'Rejeter la tâche'}</h2>
              <p>
                {approvalAction === 'approve'
                  ? 'Cette tâche sera marquée comme terminée.'
                  : 'Cette tâche retournera en révision pour modifications.'}
              </p>
            </div>

            <div className="modal-body">
              <label className="comment-label">
                Commentaire <span className="optional">(optionnel)</span>
              </label>
              <textarea
                className="comment-textarea"
                placeholder={approvalAction === 'approve'
                  ? "Félicitations ! Ajoutez un commentaire (optionnel)..."
                  : "Expliquez pourquoi la tâche est rejetée et ce qui doit être amélioré..."}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={4}
                autoFocus
              />
              <p className="comment-hint">
                {approvalAction === 'approve'
                  ? '💡 Le membre sera notifié de votre approbation.'
                  : '⚠️ Un commentaire est recommandé pour aider le membre à améliorer son travail.'}
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn-modal-secondary" onClick={() => setShowCommentModal(false)}>
                Annuler
              </button>
              <button
                className={`btn-modal-primary ${approvalAction === 'approve' ? 'approve' : 'reject'}`}
                onClick={submitApproval}
              >
                {approvalAction === 'approve' ? 'Approuver' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardManager;