const { Task, Project, User } = require('../models');
const { Op } = require('sequelize');

/* ============================================================
   🔄 FONCTION CENTRALE — Recalcul automatique de la progression
   Appelée après chaque création / modification / suppression
   de tâche.

   Logique :
   - On compte toutes les tâches actives (non archivées) du projet
   - Chaque statut vaut un certain % de complétion :
       todo          →  0%
       in_progress   → 25%
       review        → 50%
       pending_approval → 75%
       done          → 100%
       cancelled     → ignorée (ne compte pas dans le total)
   - progress = somme des poids / nombre de tâches comptables
   - Si toutes les tâches sont "done" → progress = 100
   - Si le projet atteint 100 % → son statut passe à "completed"
   - Si le projet était "completed" mais descend sous 100 % → "active"
   ============================================================ */
const TASK_WEIGHT = {
  todo:               0,
  in_progress:       25,
  review:            50,
  pending_approval:  75,
  done:             100,
};

const recalculateProjectProgress = async (projectId) => {
  try {
    // Récupérer toutes les tâches actives (sauf annulées et archivées)
    const tasks = await Task.findAll({
      where: {
        projectId,
        isArchived: false,
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: ['status']
    });

    let newProgress = 0;

    if (tasks.length > 0) {
      const totalWeight = tasks.reduce((sum, t) => sum + (TASK_WEIGHT[t.status] ?? 0), 0);
      newProgress = Math.round(totalWeight / tasks.length);
    }

    // Mettre à jour le projet
    const project = await Project.findByPk(projectId);
    if (!project) return;

    project.progress = newProgress;

    // Mise à jour automatique du statut du projet
    if (newProgress === 100 && project.status === 'active') {
      project.status = 'completed';
      console.log(`✅ Projet #${projectId} automatiquement marqué comme terminé`);
    } else if (newProgress < 100 && project.status === 'completed') {
      project.status = 'active';
      console.log(`🔄 Projet #${projectId} remis en cours (progression: ${newProgress}%)`);
    }

    await project.save();

    console.log(`📊 Progression projet #${projectId} recalculée: ${newProgress}% (${tasks.length} tâches)`);
    return newProgress;
  } catch (error) {
    console.error(`❌ Erreur recalcul progression projet #${projectId}:`, error);
  }
};

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
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }

    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès refusé à ce projet' });
    }

    const where = { projectId, isArchived: false };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    console.error('❌ Erreur récupération tâches:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
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
        { model: Project, as: 'project',  attributes: ['id', 'title', 'managerId'] },
        { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User,    as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès refusé à cette tâche' });
    }

    res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    console.error('❌ Erreur récupération tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * ➕ Créer une nouvelle tâche
 * POST /api/projects/:projectId/tasks
 */
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, startDate, dueDate, estimatedHours, assignedTo, tags } = req.body;
    const userId   = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Projet non trouvé' });

    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez créer des tâches que pour vos propres projets' });
    }

    if (!title) return res.status(400).json({ success: false, message: 'Le titre est requis' });

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: "La date d'échéance doit être après la date de début" });
    }

    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) return res.status(404).json({ success: false, message: 'Utilisateur assigné non trouvé' });
    }

    // Progression individuelle de la tâche selon son statut
    const STATUS_PROGRESS = { todo: 0, in_progress: 25, review: 50, pending_approval: 75, done: 100, cancelled: 0 };
    const initialStatus = status || 'todo';
    const initialProgress = STATUS_PROGRESS[initialStatus] ?? 0;

    const task = await Task.create({
      title,
      description:    description    || null,
      status:         initialStatus,
      priority:       priority       || 'medium',
      startDate:      startDate      || null,
      dueDate:        dueDate        || null,
      estimatedHours: estimatedHours || null,
      assignedTo:     assignedTo     || null,
      tags:           tags           || [],
      projectId,
      createdBy: userId,
      progress:  initialProgress,
      actualHours: 0
    });

    // ✅ Recalcul automatique
    await recalculateProjectProgress(projectId);

    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    console.log('✅ Tâche créée:', { taskId: task.id, title: task.title, projectId, createdBy: req.user.email });

    res.status(201).json({ success: true, message: 'Tâche créée avec succès', data: { task: taskWithRelations } });
  } catch (error) {
    console.error('❌ Erreur création tâche:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: error.errors.map(e => ({ field: e.path, message: e.message })) });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * ✏️ Modifier une tâche
 * PUT /api/tasks/:id
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, startDate, dueDate, estimatedHours, actualHours, assignedTo, tags } = req.body;
    const userId   = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'managerId'] }]
    });

    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez modifier que les tâches de vos propres projets' });
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: "La date d'échéance doit être après la date de début" });
    }

    if (assignedTo) {
      const assignee = await User.findByPk(assignedTo);
      if (!assignee) return res.status(404).json({ success: false, message: 'Utilisateur assigné non trouvé' });
    }

    const TASK_STATUS_PROGRESS = { todo: 0, in_progress: 25, review: 50, pending_approval: 75, done: 100, cancelled: 0 };

    if (title           !== undefined) task.title           = title;
    if (description     !== undefined) task.description     = description;
    if (priority        !== undefined) task.priority        = priority;
    if (startDate       !== undefined) task.startDate       = startDate;
    if (dueDate         !== undefined) task.dueDate         = dueDate;
    if (estimatedHours  !== undefined) task.estimatedHours  = estimatedHours;
    if (actualHours     !== undefined) task.actualHours     = actualHours;
    if (assignedTo      !== undefined) task.assignedTo      = assignedTo;
    if (tags            !== undefined) task.tags            = tags;
    // Mise à jour du statut ET du progress individuel de la tâche
    if (status !== undefined) {
      task.status   = status;
      task.progress = TASK_STATUS_PROGRESS[status] ?? task.progress;
    }

    await task.save();

    // ✅ Recalcul automatique
    await recalculateProjectProgress(task.projectId);

    const updatedTask = await Task.findByPk(id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    console.log('✅ Tâche modifiée:', { taskId: task.id, modifiedBy: req.user.email });

    res.status(200).json({ success: true, message: 'Tâche modifiée avec succès', data: { task: updatedTask } });
  } catch (error) {
    console.error('❌ Erreur modification tâche:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: error.errors.map(e => ({ field: e.path, message: e.message })) });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * 🗑️ Supprimer (archiver) une tâche
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId   = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findOne({
      where: { id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'managerId'] }]
    });

    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez supprimer que les tâches de vos propres projets' });
    }

    const projectId = task.projectId;

    task.isArchived = true;
    await task.save();

    // ✅ Recalcul automatique après suppression
    await recalculateProjectProgress(projectId);

    console.log('✅ Tâche archivée:', { taskId: task.id, archivedBy: req.user.email });

    res.status(200).json({ success: true, message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression tâche:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * 🔄 Changer le statut d'une tâche (workflow membre)
 * PATCH /api/tasks/:id/status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId   = req.user.id;
    const userRole = req.user.role;

    const ALLOWED_TRANSITIONS_MEMBER = {
      todo:               ['in_progress'],
      in_progress:        ['review'],
      review:             ['pending_approval'],
      pending_approval:   [],
      done:               [],
      cancelled:          []
    };

    const ALLOWED_TRANSITIONS_MANAGER = {
      todo:               ['in_progress', 'done', 'cancelled'],
      in_progress:        ['review', 'done', 'cancelled'],
      review:             ['pending_approval', 'done', 'in_progress', 'cancelled'],
      pending_approval:   ['done', 'review'],
      done:               ['in_progress'],
      cancelled:          ['todo']
    };

    const task = await Task.findOne({
      where: { id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'managerId', 'title'] }]
    });

    if (!task) return res.status(404).json({ success: false, message: 'Tâche non trouvée' });

    // Vérifier les permissions
    if (userRole === 'member' && task.assignedTo !== userId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez modifier que vos propres tâches' });
    }

    if (userRole === 'manager' && task.project.managerId !== userId) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Vérifier la transition
    const allowedTransitions = userRole === 'member'
      ? ALLOWED_TRANSITIONS_MEMBER
      : ALLOWED_TRANSITIONS_MANAGER;

    const allowed = allowedTransitions[task.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition interdite : ${task.status} → ${status}`
      });
    }

    // Commentaire obligatoire pour pending_approval (membre)
    if (userRole === 'member' && status === 'pending_approval' && !comment?.trim()) {
      return res.status(400).json({ success: false, message: 'Un commentaire est obligatoire pour soumettre à approbation' });
    }

    const TASK_STATUS_PROGRESS_MAP = { todo: 0, in_progress: 25, review: 50, pending_approval: 75, done: 100, cancelled: 0 };
    task.status   = status;
    task.progress = TASK_STATUS_PROGRESS_MAP[status] ?? task.progress;

    // Stocker la demande d'approbation
    if (status === 'pending_approval') {
      task.approvalRequest = {
        comment:     comment?.trim(),
        requestedAt: new Date().toISOString(),
        requestedBy: userId
      };
    } else {
      task.approvalRequest = null;
    }

    await task.save();

    // ✅ Recalcul automatique après changement de statut
    const newProgress = await recalculateProjectProgress(task.projectId);

    console.log('✅ Statut tâche mis à jour:', { taskId: task.id, from: task.status, to: status, by: req.user.email });

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: {
        task: { id: task.id, status: task.status },
        projectProgress: newProgress
      }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * ⏳ Tâches en attente d'approbation (pour le manager)
 * GET /api/tasks/pending-approval
 */
exports.getPendingApprovalTasks = async (req, res) => {
  try {
    const userId   = req.user.id;
    const userRole = req.user.role;

    const where = {
      status: 'pending_approval',
      isArchived: false
    };

    // Manager ne voit que les tâches de ses projets
    const projectWhere = {};
    if (userRole === 'manager') projectWhere.managerId = userId;

    const tasks = await Task.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: Project,
          as: 'project',
          where: projectWhere,
          attributes: ['id', 'title', 'color', 'managerId']
        },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User, as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    console.error('❌ Erreur récupération tâches en attente:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * 📋 Mes tâches assignées (membre)
 * GET /api/my-tasks
 */
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const where = { assignedTo: userId, isArchived: false };
    if (status)    where.status    = status;
    if (priority)  where.priority  = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await Task.findAll({
      where,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'color', 'status'],
          include: [{ model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] }]
        },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    const stats = {
      total:           tasks.length,
      todo:            tasks.filter(t => t.status === 'todo').length,
      inProgress:      tasks.filter(t => t.status === 'in_progress').length,
      review:          tasks.filter(t => t.status === 'review').length,
      pendingApproval: tasks.filter(t => t.status === 'pending_approval').length,
      done:            tasks.filter(t => t.status === 'done').length,
      overdue:         tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    };

    res.status(200).json({ success: true, data: { tasks, stats } });
  } catch (error) {
    console.error('❌ Erreur récupération mes tâches:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * 📊 Stats globales des tâches (admin)
 * GET /api/tasks/stats
 */
exports.getTasksStats = async (req, res) => {
  try {
    const total           = await Task.count({ where: { isArchived: false } });
    const todo            = await Task.count({ where: { isArchived: false, status: 'todo' } });
    const inProgress      = await Task.count({ where: { isArchived: false, status: 'in_progress' } });
    const review          = await Task.count({ where: { isArchived: false, status: 'review' } });
    const pendingApproval = await Task.count({ where: { isArchived: false, status: 'pending_approval' } });
    const done            = await Task.count({ where: { isArchived: false, status: 'done' } });
    const cancelled       = await Task.count({ where: { isArchived: false, status: 'cancelled' } });

    res.status(200).json({
      success: true,
      data: {
        stats: { total, todo, inProgress, review, pendingApproval, done, cancelled }
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats tâches:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * 📋 Toutes les tâches (admin)
 * GET /api/tasks
 */
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, projectId, assignedTo, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { isArchived: false };
    if (status)     where.status     = status;
    if (priority)   where.priority   = priority;
    if (projectId)  where.projectId  = projectId;
    if (assignedTo) where.assignedTo = assignedTo;

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Project, as: 'project',  attributes: ['id', 'title', 'color'] },
        { model: User,    as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'] },
        { model: User,    as: 'creator',  attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération tâches:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Exporter la fonction utilitaire pour pouvoir l'appeler depuis d'autres controllers
exports.recalculateProjectProgress = recalculateProjectProgress;