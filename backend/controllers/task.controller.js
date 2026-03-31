const { Task, Project, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 📋 Obtenir toutes les tâches d'un projet
 * GET /api/projects/:projectId/tasks
 */
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce projet'
      });
    }

    const where = { projectId, isArchived: false };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('❌ Erreur récupération tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🔍 Obtenir une tâche par ID
 * GET /api/tasks/:id
 */
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'managerId', 'color']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const isAssignedMember = task.assignedTo === userId;
    const isProjectManager = task.project.managerId === userId;
    
    if (userRole === 'member' && !isAssignedMember) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette tâche'
      });
    }
    
    if (userRole === 'manager' && !isProjectManager && userId !== task.project.managerId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette tâche'
      });
    }

    res.status(200).json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('❌ Erreur récupération tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ➕ Créer une nouvelle tâche
 * POST /api/projects/:projectId/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      estimatedHours,
      assignedTo,
      tags
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez créer des tâches que pour vos propres projets'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          message: 'La date d\'échéance doit être après la date de début'
        });
      }
    }

    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur assigné non trouvé'
        });
      }
    }

    const task = await Task.create({
      title,
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      startDate: startDate || null,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || null,
      assignedTo: assignedTo || null,
      tags: tags || [],
      projectId,
      createdBy: userId,
      progress: 0,
      actualHours: 0,
      approvalRequest: null,
      approvalResponse: null
    });

    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: { task: taskWithRelations }
    });
  } catch (error) {
    console.error('❌ Erreur création tâche:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ✏️ Modifier une tâche
 * PUT /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      estimatedHours,
      actualHours,
      progress,
      assignedTo,
      tags
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'managerId']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que les tâches de vos propres projets'
      });
    }

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        return res.status(400).json({
          success: false,
          message: 'La date d\'échéance doit être après la date de début'
        });
      }
    }

    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur assigné non trouvé'
        });
      }
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (progress !== undefined) task.progress = progress;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Tâche modifiée avec succès',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('❌ Erreur modification tâche:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🗑️ Supprimer une tâche (archiver)
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'managerId']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que les tâches de vos propres projets'
      });
    }

    task.isArchived = true;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📋 Obtenir toutes les tâches assignées à l'utilisateur connecté
 * GET /api/my-tasks
 */
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const where = { 
      assignedTo: userId,
      isArchived: false
    };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await Task.findAll({
      where,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'color', 'status'],
          include: [
            {
              model: User,
              as: 'manager',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      pendingApproval: tasks.filter(t => t.status === 'pending_approval').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && !['done', 'cancelled'].includes(t.status);
      }).length
    };

    res.status(200).json({
      success: true,
      data: { tasks, stats }
    });
  } catch (error) {
    console.error('❌ Erreur récupération mes tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🔄 Mettre à jour le statut d'une tâche (avec workflow d'approbation)
 * PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'managerId']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const isAssignedMember = task.assignedTo === userId;
    const isProjectManager = task.project.managerId === userId;
    const isAdmin = req.user.role === 'admin';

    if (userRole === 'member') {
      if (!isAssignedMember) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que vos propres tâches'
        });
      }

      const allowedTransitions = {
        'todo': ['in_progress'],
        'in_progress': ['review'],
        'review': ['pending_approval']
      };
      
      if (allowedTransitions[task.status] && !allowedTransitions[task.status].includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Transition non autorisée: ${task.status} → ${status}`
        });
      }

      if (status === 'pending_approval') {
        if (!comment) {
          return res.status(400).json({
            success: false,
            message: 'Un commentaire est requis pour soumettre la tâche à approbation'
          });
        }
        
        task.approvalRequest = {
          requestedAt: new Date(),
          requestedBy: userId,
          comment: comment,
          status: 'pending'
        };
      }
      
      task.status = status;
      await task.save();
      
    } else if (userRole === 'manager' || isAdmin) {
      if (userRole === 'manager' && !isProjectManager && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que les tâches de vos projets'
        });
      }

      if (task.status === 'pending_approval') {
        if (status === 'done') {
          task.status = 'done';
          task.progress = 100;
          task.approvalResponse = {
            approvedAt: new Date(),
            approvedBy: userId,
            status: 'approved',
            comment: comment || null
          };
        } else if (status === 'review') {
          task.status = 'review';
          task.approvalResponse = {
            rejectedAt: new Date(),
            rejectedBy: userId,
            status: 'rejected',
            comment: comment || null
          };
        } else {
          return res.status(403).json({
            success: false,
            message: 'Pour une tâche en attente d\'approbation, vous devez approuver (done) ou rejeter (review)'
          });
        }
      } else {
        const validStatuses = ['todo', 'in_progress', 'review', 'pending_approval', 'done', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Statut invalide'
          });
        }
        
        task.status = status;
        if (status === 'done') task.progress = 100;
      }
      await task.save();
    }

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'color', 'status']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    let message = 'Statut mis à jour avec succès';
    if (status === 'pending_approval') {
      message = 'Tâche soumise pour approbation. Le manager sera notifié.';
    } else if (status === 'done' && updatedTask.approvalResponse?.status === 'approved') {
      message = 'Tâche approuvée et marquée comme terminée.';
    } else if (status === 'review' && updatedTask.approvalResponse?.status === 'rejected') {
      message = 'Tâche rejetée, retour en révision.';
    }

    res.status(200).json({
      success: true,
      message: message,
      data: { task: updatedTask }
    });
    
  } catch (error) {
    console.error('❌ Erreur modification statut tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📋 Obtenir les tâches en attente d'approbation (pour le manager)
 * GET /api/pending-approval
 */
exports.getPendingApprovalTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`🔍 Recherche tâches en attente - Utilisateur: ${userId}, Rôle: ${userRole}`);

    // Récupérer toutes les tâches en attente
    const allTasks = await Task.findAll({
      where: { 
        status: 'pending_approval',
        isArchived: false 
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'managerId', 'color']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    // Filtrer par manager
    let tasks;
    if (userRole === 'admin') {
      // Admin voit toutes les tâches
      tasks = allTasks;
      console.log(`👑 Admin: ${allTasks.length} tâches trouvées`);
    } else {
      // Manager ne voit que les tâches de ses projets
      tasks = allTasks.filter(task => task.project?.managerId === userId);
      console.log(`👤 Manager ${userId}: ${tasks.length} tâches trouvées sur ${allTasks.length} total`);
      
      // Log pour déboguer
      allTasks.forEach(task => {
        console.log(`  - Tâche "${task.title}" (projet: ${task.project?.title}, manager du projet: ${task.project?.managerId})`);
      });
    }

    res.status(200).json({
      success: true,
      data: { tasks }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération tâches en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📊 Obtenir les statistiques des tâches (pour le manager)
 * GET /api/tasks/stats
 */
exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let where = { isArchived: false };
    
    if (userRole === 'manager') {
      where['$project.managerId$'] = userId;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'managerId']
        }
      ]
    });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      pendingApproval: tasks.filter(t => t.status === 'pending_approval').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && !['done', 'cancelled'].includes(t.status);
      }).length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
        : 0
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
/**
 * 📊 Obtenir toutes les tâches (Admin uniquement)
 * GET /api/tasks/all
 */
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, projectId, assignedTo, search } = req.query;

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Construire les filtres
    const where = { isArchived: false };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        where.assignedTo = null;
      } else {
        where.assignedTo = assignedTo;
      }
    }
    
    // Recherche par titre
    if (search) {
      where.title = {
        [Op.iLike]: `%${search}%`
      };
    }

    const tasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'color', 'status'],
          include: [
            {
              model: User,
              as: 'manager',
              attributes: ['id', 'firstName', 'lastName', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl', 'role']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Statistiques globales
    const allTasks = await Task.findAll({
      where: { isArchived: false }
    });

    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      pendingApproval: allTasks.filter(t => t.status === 'pending_approval').length,
      done: allTasks.filter(t => t.status === 'done').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      unassigned: allTasks.filter(t => !t.assignedTo).length,
      overdue: allTasks.filter(t => {
        if (!t.dueDate || t.status === 'done' || t.status === 'cancelled') return false;
        return new Date(t.dueDate) < new Date();
      }).length,
      highPriority: allTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length
    };

    // Stats par projet
    const tasksByProject = {};
    allTasks.forEach(task => {
      if (!tasksByProject[task.projectId]) {
        tasksByProject[task.projectId] = 0;
      }
      tasksByProject[task.projectId]++;
    });

    console.log('✅ Tâches globales récupérées:', {
      admin: req.user.email,
      count: tasks.length,
      totalTasks: stats.total
    });

    res.status(200).json({
      success: true,
      data: { 
        tasks, 
        stats,
        tasksByProject
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération tâches globales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/*module.exports = {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks,
  updateTaskStatus,
  getPendingApprovalTasks,
  getTaskStats
};*/