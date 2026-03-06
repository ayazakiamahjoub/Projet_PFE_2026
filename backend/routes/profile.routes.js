const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../config/multer.config');

/**
 * @route   GET /api/profile
 * @desc    Obtenir le profil complet de l'utilisateur
 * @access  Private
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Modifier les informations du profil
 * @access  Private
 */
router.put('/', authenticate, profileController.updateProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put('/password', authenticate, profileController.changePassword);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload photo de profil
 * @access  Private
 */
router.post('/avatar', authenticate, upload.single('avatar'), profileController.uploadAvatar);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Supprimer la photo de profil
 * @access  Private
 */
router.delete('/avatar', authenticate, profileController.deleteAvatar);

module.exports = router;