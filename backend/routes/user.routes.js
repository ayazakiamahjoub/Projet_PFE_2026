const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrManager } = require('../middleware/admin.middleware');

// Authentification requise pour toutes les routes
router.use(authenticate);

/**
 * @route   GET /api/users/members
 * @desc    Obtenir les membres assignables (accessible manager + admin)
 * @access  Private (Manager + Admin)
 */
router.get('/members', isAdminOrManager, userController.getAssignableMembers);

// Les routes suivantes nécessitent le rôle admin
router.use(isAdmin);

/**
 * @route   GET /api/users/stats
 * @desc    Obtenir les statistiques des utilisateurs
 * @access  Private (Admin only)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Obtenir tous les utilisateurs (avec filtres)
 * @access  Private (Admin only)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private (Admin only)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Créer un nouvel utilisateur
 * @access  Private (Admin only)
 */
router.post('/', userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (Admin only)
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (Admin only)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/toggle-active
 * @desc    Activer/Désactiver un utilisateur
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-active', userController.toggleUserActive);

module.exports = router;