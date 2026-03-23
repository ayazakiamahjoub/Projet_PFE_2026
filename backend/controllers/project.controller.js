const { Project, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 📋 Obtenir tous les projets (avec filtres)
 * GET /api/projects
 */
exports.getAllProjects = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10, managerId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Construire les conditions de filtre
    const where = {};

    // Les managers ne voient que leurs projets, les admins voient tout
    if (userRole === 'manager') {
      where.managerId = userId;
    } else if (managerId) {
      where.managerId = managerId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Ne pas afficher les projets archivés par défaut
    where.isArchived = false;

    // Pagination
    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
      }]
    });

    console.log('✅ Liste projets récupérée:', {
      total: count,
      page,
      userId,
      userRole
    });

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération projets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
/**
 * 🔍 Obtenir un projet par ID
 * GET /api/projects/:id
 */
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
      }]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier les permissions
    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à ce projet'
      });
    }

    console.log('✅ Projet récupéré:', {
      projectId: project.id,
      title: project.title,
      requestedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('❌ Erreur récupération projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ➕ Créer un nouveau projet
 * POST /api/projects
 */
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      currency,
      startDate,
      endDate,
      priority,
      color,
      tags
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation des champs requis
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Le titre, la date de début et la date de fin sont requis'
      });
    }

    // Validation des dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être après la date de début'
      });
    }

    // Créer le projet
    const project = await Project.create({
      title,
      description: description || null,
      budget: budget || null,
      currency: currency || 'TND',
      startDate,
      endDate,
      priority: priority || 'medium',
      color: color || '#FF6B35',
      tags: tags || [],
      managerId: userId,
      status: 'active',
      progress: 0
    });

    // Récupérer le projet avec le manager
    const projectWithManager = await Project.findByPk(project.id, {
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
      }]
    });

    console.log('✅ Projet créé:', {
      projectId: project.id,
      title: project.title,
      createdBy: req.user.email,
      managerId: userId
    });

    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: { project: projectWithManager }
    });
  } catch (error) {
    console.error('❌ Erreur création projet:', error);

    // Gestion des erreurs de validation Sequelize
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

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      budget,
      currency,
      startDate,
      endDate,
      status,
      priority,
      progress,
      color,
      tags
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier les permissions
    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que vos propres projets'
      });
    }

    // Validation des dates si modifiées
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'La date de fin doit être après la date de début'
        });
      }
    }

    // VALIDATION PROGRESSION
const projectStartDate = new Date(startDate || project.startDate);
const today = new Date();

// Mettre les deux dates à minuit pour comparer uniquement les jours
projectStartDate.setHours(0, 0, 0, 0);
today.setHours(0, 0, 0, 0);

// Désactiver la progression si la date de début est STRICTEMENT dans le futur
if (progress !== undefined && progress > 0 && projectStartDate > today) {
  return res.status(400).json({
    success: false,
    message: 'La progression ne peut pas être supérieure à 0% avant la date de début du projet'
  });
}

    // Mettre à jour les champs
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (budget !== undefined) project.budget = budget;
    if (currency !== undefined) project.currency = currency;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (progress !== undefined) project.progress = progress;
    if (color !== undefined) project.color = color;
    if (tags !== undefined) project.tags = tags;

    await project.save();

    // Récupérer le projet mis à jour avec le manager
    const updatedProject = await Project.findByPk(id, {
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl']
      }]
    });

    console.log('✅ Projet modifié:', {
      projectId: project.id,
      title: project.title,
      modifiedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Projet modifié avec succès',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('❌ Erreur modification projet:', error);

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
 * 🗑️ Supprimer un projet (soft delete - archivage)
 * DELETE /api/projects/:id
 */
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Vérifier les permissions
    if (userRole === 'manager' && project.managerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que vos propres projets'
      });
    }

    // Archiver au lieu de supprimer
    project.isArchived = true;
    await project.save();

    console.log('✅ Projet archivé:', {
      projectId: project.id,
      title: project.title,
      archivedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Projet archivé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📊 Obtenir les statistiques des projets
 * GET /api/projects/stats
 */
exports.getProjectStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = { isArchived: false };
    
    // Les managers ne voient que leurs stats
    if (userRole === 'manager') {
      where.managerId = userId;
    }

    const totalProjects = await Project.count({ where });
    
    const activeProjects = await Project.count({
      where: { ...where, status: 'active' }
    });

    const completedProjects = await Project.count({
      where: { ...where, status: 'completed' }
    });

    const onHoldProjects = await Project.count({
      where: { ...where, status: 'on_hold' }
    });

    // Calculer le budget total
    const budgetSum = await Project.sum('budget', { where });

    const stats = {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      onHold: onHoldProjects,
      totalBudget: budgetSum || 0
    };

    console.log('✅ Stats projets récupérées');

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('❌ Erreur stats projets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/*module.exports = {
  getAllProjects,   Probléme important a expliquée
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};*/