const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/admin.middleware');

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/projects/stats
 * @desc    Obtenir les statistiques des projets
 * @access  Private (Admin + Manager)
 */
router.get('/stats', isAdminOrManager, projectController.getProjectStats);

/**
 * @route   GET /api/projects
 * @desc    Obtenir tous les projets (avec filtres)
 * @access  Private (Admin + Manager)
 */
router.get('/', isAdminOrManager, projectController.getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Obtenir un projet par ID
 * @access  Private (Admin + Manager)
 */
router.get('/:id', isAdminOrManager, projectController.getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Créer un nouveau projet
 * @access  Private (Admin + Manager)
 */
router.post('/', isAdminOrManager, projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Modifier un projet
 * @access  Private (Admin + Manager)
 */
router.put('/:id', isAdminOrManager, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Supprimer (archiver) un projet
 * @access  Private (Admin + Manager)
 */
router.delete('/:id', isAdminOrManager, projectController.deleteProject);

module.exports = router;