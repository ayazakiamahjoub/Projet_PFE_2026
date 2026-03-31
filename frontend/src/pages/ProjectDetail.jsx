import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, getDashboardUrl } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal création tâche
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    assignedTo: '',
    tags: ''
  });
  
  // États pour édition de tâche
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskFormData, setEditTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    progress: 0,
    assignedTo: '',
    tags: ''
  });
  
  // États pour suppression de tâche
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
    fetchUsers();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setProject(data.data.project);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Projet non trouvé'
        });
        setTimeout(() => navigate(getDashboardUrl()), 2000);
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

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Projet supprimé avec succès !'
        });
        setTimeout(() => navigate(getDashboardUrl()), 1500);
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
  // Récupérer les membres assignables (accessible à admin et manager)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');

      // Les admins utilisent /api/users, les managers utilisent /api/users/members
      const endpoint = user?.role === 'admin'
        ? 'http://localhost:5000/api/users'
        : 'http://localhost:5000/api/users/members';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        // Filtrer pour n'afficher que les utilisateurs actifs
        const members = data.data.users || data.data.members || [];
        console.log('👥 Membres récupérés:', members.length, members);
        setUsers(members);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  // Vérifie si l'utilisateur connecté peut gérer les tâches (assigner, créer, modifier, supprimer)
  const canManageTasks = user?.role === 'admin' || user?.role === 'manager';
  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);

    try {
      const token = localStorage.getItem('token');

      const taskData = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || null,
        priority: taskFormData.priority,
        status: taskFormData.status,
        startDate: taskFormData.startDate || null,
        dueDate: taskFormData.dueDate || null,
        estimatedHours: taskFormData.estimatedHours ? parseFloat(taskFormData.estimatedHours) : null,
        assignedTo: taskFormData.assignedTo || null,
        tags: taskFormData.tags ? taskFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const response = await fetch(`http://localhost:5000/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Tâche créée avec succès !'
        });
        setShowTaskModal(false);
        setTaskFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          startDate: '',
          dueDate: '',
          estimatedHours: '',
          assignedTo: '',
          tags: ''
        });
        fetchTasks();
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la création de la tâche'
        });
      }
    } catch (error) {
      console.error('Erreur création tâche:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditTaskClick = (task) => {
    setEditingTask(task);
    setEditTaskFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      estimatedHours: task.estimatedHours || '',
      actualHours: task.actualHours || '',
      progress: task.progress || 0,
      assignedTo: task.assignedTo || task.assignee?.id || '',
      tags: task.tags ? task.tags.join(', ') : ''
    });
    setShowEditTaskModal(true);
  };

  const handleEditTaskFormChange = (e) => {
    const { name, value } = e.target;
    setEditTaskFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);

    try {
      const token = localStorage.getItem('token');

      const taskData = {
        title: editTaskFormData.title.trim(),
        description: editTaskFormData.description.trim() || null,
        priority: editTaskFormData.priority,
        status: editTaskFormData.status,
        startDate: editTaskFormData.startDate || null,
        dueDate: editTaskFormData.dueDate || null,
        estimatedHours: editTaskFormData.estimatedHours ? parseFloat(editTaskFormData.estimatedHours) : null,
        actualHours: editTaskFormData.actualHours ? parseFloat(editTaskFormData.actualHours) : null,
        progress: parseInt(editTaskFormData.progress),
        assignedTo: editTaskFormData.assignedTo || null,
        tags: editTaskFormData.tags ? editTaskFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      const response = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Tâche modifiée avec succès !'
        });
        setShowEditTaskModal(false);
        setEditingTask(null);
        fetchTasks();
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la modification de la tâche'
        });
      }
    } catch (error) {
      console.error('Erreur modification tâche:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTaskClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteTaskModal(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;

    setDeletingTask(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message: 'Tâche supprimée avec succès !'
        });
        setShowDeleteTaskModal(false);
        setTaskToDelete(null);
        fetchTasks();
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Erreur lors de la suppression'
        });
      }
    } catch (error) {
      console.error('Erreur suppression tâche:', error);
      setAlert({
        type: 'error',
        message: 'Erreur de connexion au serveur'
      });
    } finally {
      setDeletingTask(false);
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

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + currency;
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

  const getTaskStatusInfo = (status) => {
    const statusMap = {
      'todo': { label: 'À faire', class: 'task-status-todo', icon: '📝' },
      'in_progress': { label: 'En cours', class: 'task-status-progress', icon: '🔄' },
      'review': { label: 'En révision', class: 'task-status-review', icon: '👀' },
      'done': { label: 'Terminée', class: 'task-status-done', icon: '✅' },
      'cancelled': { label: 'Annulée', class: 'task-status-cancelled', icon: '❌' }
    };
    return statusMap[status] || { label: status, class: 'task-status-default', icon: '❓' };
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
                <span className="brand-tagline">Détails du Projet</span>
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
              <span className="brand-tagline">Détails du Projet</span>
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
          <button className="btn-back" onClick={() => navigate(getDashboardUrl())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Retour au tableau de bord
          </button>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Header du projet */}
          <div className="project-detail-header" style={{ borderTopColor: project.color }}>
            <div className="project-header-content">
              <h1 className="project-detail-title">{project.title}</h1>
              <div className="project-badges">
                <span className={`badge ${statusInfo.class}`}>
                  <span className="badge-icon">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
                <span className={`badge ${priorityInfo.class}`}>
                  <span className="badge-icon">{priorityInfo.icon}</span>
                  {priorityInfo.label}
                </span>
              </div>
              <div className="project-detail-actions">
                <button 
                  className="btn-action btn-edit"
                  onClick={() => navigate(`/manager/projects/${id}/edit`)}
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
          </div>

          {/* Description */}
          {project.description && (
            <div className="project-section">
              <h2 className="section-title">Description</h2>
              <div className="project-description">
                <p>{project.description}</p>
              </div>
            </div>
          )}

          {/* Informations du projet */}
          <div className="project-info-grid">
            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                </svg>
              </div>
              <div className="info-content">
                <div className="info-label">Chef de projet</div>
                <div className="info-value">
                  {project.manager?.firstName} {project.manager?.lastName}
                </div>
              </div>
            </div>

            {project.budget && (
              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="info-content">
                  <div className="info-label">Budget</div>
                  <div className="info-value">{formatCurrency(project.budget, project.currency)}</div>
                </div>
              </div>
            )}

            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                </svg>
              </div>
              <div className="info-content">
                <div className="info-label">Date de début</div>
                <div className="info-value">{formatDate(project.startDate)}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                </svg>
              </div>
              <div className="info-content">
                <div className="info-label">Date de fin</div>
                <div className="info-value">{formatDate(project.endDate)}</div>
              </div>
            </div>
          </div>

          {/* Progression */}
          <div className="project-section">
            <h2 className="section-title">Progression</h2>
            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-label">Avancement du projet</span>
                <span className="progress-value">{project.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${project.progress}%`,
                    background: project.color
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="project-section">
              <h2 className="section-title">Tags</h2>
              <div className="tags-container">
                {project.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Section Tâches */}
          <div className="project-section">
            <div className="section-header">
              <h2 className="section-title">
                Tâches ({tasks.length})
              </h2>
              {canManageTasks && (
              <button 
                className="btn-add-task"
                onClick={() => setShowTaskModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Ajouter une tâche
              </button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="empty-tasks">
                <div className="empty-tasks-icon">📋</div>
                <h3>Aucune tâche</h3>
                <p>Commencez par ajouter des tâches à ce projet</p>
                {canManageTasks && (
                <button 
                  className="btn-create-first-task"
                  onClick={() => setShowTaskModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Créer la première tâche
                </button>
                )}
              </div>
            ) : (
              <div className="tasks-list">
                {tasks.map(task => {
                  const taskStatus = getTaskStatusInfo(task.status);
                  const taskPriority = getPriorityInfo(task.priority);
                  
                  return (
                    <div key={task.id} className="task-item">
                      <div className="task-header">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-badges">
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

                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}

                      {/* Progression de la tâche */}
                      <div className="task-progress-wrapper">
                        <div className="task-progress-header">
                          <span className="task-progress-label">Progression</span>
                          <span className="task-progress-value">{task.progress}%</span>
                        </div>
                        <div className="task-progress-bar">
                          <div 
                            className="task-progress-fill"
                            style={{ 
                              width: `${task.progress}%`,
                              background: project.color
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="task-meta">
                        {task.assignee && (
                          <div className="task-assignee">
                            <div className="task-avatar">
                              {task.assignee.avatarUrl ? (
                                <img src={`http://localhost:5000${task.assignee.avatarUrl}`} alt="" />
                              ) : (
                                <span>{task.assignee.firstName?.charAt(0)}{task.assignee.lastName?.charAt(0)}</span>
                              )}
                            </div>
                            <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="task-due-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                              <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                            </svg>
                            {formatDate(task.dueDate)}
                          </div>
                        )}

                        {task.estimatedHours && (
                          <div className="task-hours">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                            </svg>
                            {task.estimatedHours}h
                          </div>
                        )}
                      </div>

                      {/* Actions de la tâche - visibles uniquement pour admin/manager */}
                      {canManageTasks && (
                      <div className="task-actions">
                        <button 
                          className="btn-task-action edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTaskClick(task);
                          }}
                          title="Modifier la tâche"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                          </svg>
                          Modifier
                        </button>
                        
                        <button 
                          className="btn-task-action delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTaskClick(task);
                          }}
                          title="Supprimer la tâche"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="3 6 5 6 21 6" strokeWidth="2"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                          </svg>
                          Supprimer
                        </button>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Suppression Projet */}
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
              <p>Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.</p>
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
                onClick={handleDeleteProject}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Modal Création Tâche */}
{showTaskModal && (
  <div className="modal-overlay" onClick={() => !savingTask && setShowTaskModal(false)}>
    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Créer une nouvelle tâche</h2>
        <button 
          className="modal-close"
          onClick={() => setShowTaskModal(false)}
          disabled={savingTask}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleCreateTask} className="task-form">
        <div className="form-group">
          <label htmlFor="task-title">Titre de la tâche *</label>
          <input
            type="text"
            id="task-title"
            name="title"
            value={taskFormData.title}
            onChange={handleTaskFormChange}
            placeholder="Ex: Créer la maquette de la page d'accueil"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            value={taskFormData.description}
            onChange={handleTaskFormChange}
            rows="4"
            placeholder="Décrivez la tâche en détail..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-priority">Priorité</label>
            <select
              id="task-priority"
              name="priority"
              value={taskFormData.priority}
              onChange={handleTaskFormChange}
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-status">Statut</label>
            <select
              id="task-status"
              name="status"
              value={taskFormData.status}
              onChange={handleTaskFormChange}
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="review">En révision</option>
              <option value="done">Terminée</option>
            </select>
          </div>
        </div>

        {/* NOUVEAU CHAMP : Assigner à */}
        <div className="form-group">
          <label htmlFor="task-assignedTo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
              <circle cx="12" cy="7" r="4" strokeWidth="2"/>
            </svg>
            Assigner à
          </label>
          <select
            id="task-assignedTo"
            name="assignedTo"
            value={taskFormData.assignedTo}
            onChange={handleTaskFormChange}
            className="select-with-avatar"
          >
            <option value="">Non assignée</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </option>
            ))}
          </select>
          <p className="field-hint">
            Choisissez un membre de l'équipe pour cette tâche
          </p>
          {taskFormData.assignedTo && (
            <div className="current-assignee">
              <span className="label-small">Assignée à :</span>
              <div className="assignee-info">
                <div className="assignee-avatar-small">
                  <span>
                    {users.find(u => String(u.id) === String(taskFormData.assignedTo))?.firstName?.charAt(0)}
                    {users.find(u => String(u.id) === String(taskFormData.assignedTo))?.lastName?.charAt(0)}
                  </span>
                </div>
                <span>
                  {users.find(u => String(u.id) === String(taskFormData.assignedTo))?.firstName}{' '}
                  {users.find(u => String(u.id) === String(taskFormData.assignedTo))?.lastName}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-startDate">Date de début</label>
            <input
              type="date"
              id="task-startDate"
              name="startDate"
              value={taskFormData.startDate}
              onChange={handleTaskFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-dueDate">Date d'échéance</label>
            <input
              type="date"
              id="task-dueDate"
              name="dueDate"
              value={taskFormData.dueDate}
              onChange={handleTaskFormChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-estimatedHours">Heures estimées</label>
          <input
            type="number"
            id="task-estimatedHours"
            name="estimatedHours"
            value={taskFormData.estimatedHours}
            onChange={handleTaskFormChange}
            min="0"
            step="0.5"
            placeholder="0.0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-tags">Tags (séparés par des virgules)</label>
          <input
            type="text"
            id="task-tags"
            name="tags"
            value={taskFormData.tags}
            onChange={handleTaskFormChange}
            placeholder="frontend, ui, design"
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-secondary"
            onClick={() => setShowTaskModal(false)}
            disabled={savingTask}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-modal-primary"
            disabled={savingTask}
          >
            {savingTask ? 'Création...' : 'Créer la tâche'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Modal Modification Tâche */}
{showEditTaskModal && editingTask && (
  <div className="modal-overlay" onClick={() => !savingTask && setShowEditTaskModal(false)}>
    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Modifier la tâche</h2>
        <button 
          className="modal-close"
          onClick={() => setShowEditTaskModal(false)}
          disabled={savingTask}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleUpdateTask} className="task-form">
        <div className="form-group">
          <label htmlFor="edit-task-title">Titre de la tâche *</label>
          <input
            type="text"
            id="edit-task-title"
            name="title"
            value={editTaskFormData.title}
            onChange={handleEditTaskFormChange}
            placeholder="Ex: Créer la maquette de la page d'accueil"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-task-description">Description</label>
          <textarea
            id="edit-task-description"
            name="description"
            value={editTaskFormData.description}
            onChange={handleEditTaskFormChange}
            rows="4"
            placeholder="Décrivez la tâche en détail..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-task-priority">Priorité</label>
            <select
              id="edit-task-priority"
              name="priority"
              value={editTaskFormData.priority}
              onChange={handleEditTaskFormChange}
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-status">Statut</label>
            <select
              id="edit-task-status"
              name="status"
              value={editTaskFormData.status}
              onChange={handleEditTaskFormChange}
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="review">En révision</option>
              <option value="done">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>

        {/* NOUVEAU CHAMP : Assigner à */}
        <div className="form-group">
          <label htmlFor="edit-task-assignedTo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
              <circle cx="12" cy="7" r="4" strokeWidth="2"/>
            </svg>
            Assigner à
          </label>
          <select
            id="edit-task-assignedTo"
            name="assignedTo"
            value={editTaskFormData.assignedTo}
            onChange={handleEditTaskFormChange}
            className="select-with-avatar"
          >
            <option value="">Non assignée</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role})
              </option>
            ))}
          </select>
          {editingTask.assignee && editTaskFormData.assignedTo && (
            <div className="current-assignee">
              <span className="label-small">Actuellement assignée à :</span>
              <div className="assignee-info">
                <div className="assignee-avatar-small">
                  {editingTask.assignee.avatarUrl ? (
                    <img src={`http://localhost:5000${editingTask.assignee.avatarUrl}`} alt="" />
                  ) : (
                    <span>{editingTask.assignee.firstName?.charAt(0)}{editingTask.assignee.lastName?.charAt(0)}</span>
                  )}
                </div>
                <span>{editingTask.assignee.firstName} {editingTask.assignee.lastName}</span>
              </div>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-task-startDate">Date de début</label>
            <input
              type="date"
              id="edit-task-startDate"
              name="startDate"
              value={editTaskFormData.startDate}
              onChange={handleEditTaskFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-dueDate">Date d'échéance</label>
            <input
              type="date"
              id="edit-task-dueDate"
              name="dueDate"
              value={editTaskFormData.dueDate}
              onChange={handleEditTaskFormChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-task-estimatedHours">Heures estimées</label>
            <input
              type="number"
              id="edit-task-estimatedHours"
              name="estimatedHours"
              value={editTaskFormData.estimatedHours}
              onChange={handleEditTaskFormChange}
              min="0"
              step="0.5"
              placeholder="0.0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-task-actualHours">Heures réelles</label>
            <input
              type="number"
              id="edit-task-actualHours"
              name="actualHours"
              value={editTaskFormData.actualHours}
              onChange={handleEditTaskFormChange}
              min="0"
              step="0.5"
              placeholder="0.0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-task-progress">
            Progression ({editTaskFormData.progress}%)
          </label>
          <input
            type="range"
            id="edit-task-progress"
            name="progress"
            min="0"
            max="100"
            value={editTaskFormData.progress}
            onChange={handleEditTaskFormChange}
            className="range-input"
          />
          <div className="range-values">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-task-tags">Tags (séparés par des virgules)</label>
          <input
            type="text"
            id="edit-task-tags"
            name="tags"
            value={editTaskFormData.tags}
            onChange={handleEditTaskFormChange}
            placeholder="frontend, ui, design"
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-modal-secondary"
            onClick={() => setShowEditTaskModal(false)}
            disabled={savingTask}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-modal-primary"
            disabled={savingTask}
          >
            {savingTask ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* Modal Suppression Tâche */}
      {showDeleteTaskModal && taskToDelete && (
        <div className="modal-overlay" onClick={() => !deletingTask && setShowDeleteTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon danger">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2>Supprimer la tâche</h2>
              <p>Êtes-vous sûr de vouloir supprimer <strong>{taskToDelete.title}</strong> ? Cette action est irréversible.</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-secondary"
                onClick={() => setShowDeleteTaskModal(false)}
                disabled={deletingTask}
              >
                Annuler
              </button>
              <button
                className="btn-modal-danger"
                onClick={handleDeleteTaskConfirm}
                disabled={deletingTask}
              >
                {deletingTask ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;