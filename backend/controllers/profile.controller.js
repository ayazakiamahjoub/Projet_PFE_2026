const { User } = require('../models');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

/**
 * 👤 Obtenir le profil complet
 * GET /api/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Profil récupéré:', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ✏️ Modifier le profil (informations personnelles)
 * PUT /api/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Validation prénom
    if (firstName && firstName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le prénom doit contenir au moins 2 caractères'
      });
    }

    // Validation nom
    if (lastName && lastName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le nom doit contenir au moins 2 caractères'
      });
    }

    // Validation téléphone (optionnel)
    if (phone && phone.trim() !== '') {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone invalide'
        });
      }
      if (phone.length < 8 || phone.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Le numéro de téléphone doit contenir entre 8 et 20 caractères'
        });
      }
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim() || null;
    if (email) user.email = email.trim();

    await user.save();

    console.log('✅ Profil mis à jour:', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🔒 Changer le mot de passe
 * PUT /api/profile/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validation des champs requis
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Validation longueur du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (newPassword.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe est trop long'
      });
    }

    // Validation correspondance des mots de passe
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe (sera hashé automatiquement par le hook)
    user.password = newPassword;
    await user.save();

    console.log('✅ Mot de passe changé:', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📸 Upload photo de profil
 * POST /api/profile/avatar
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      // Si l'utilisateur n'existe pas, supprimer le fichier uploadé
      const uploadedFilePath = path.join(__dirname, '../public/uploads/avatars', req.file.filename);
      try {
        await fs.unlink(uploadedFilePath);
      } catch (err) {
        console.error('Erreur suppression fichier uploadé:', err);
      }

      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'ancien avatar s'il existe
    if (user.avatarUrl) {
      const oldAvatarPath = path.join(__dirname, '../public', user.avatarUrl);
      try {
        await fs.unlink(oldAvatarPath);
        console.log('✅ Ancien avatar supprimé:', oldAvatarPath);
      } catch (error) {
        console.log('⚠️ Ancien avatar introuvable ou déjà supprimé');
      }
    }

    // Construire l'URL de l'avatar (accessible via Express static)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Mettre à jour l'utilisateur
    user.avatarUrl = avatarUrl;
    await user.save();

    console.log('✅ Avatar uploadé avec succès:', {
      userId: user.id,
      email: user.email,
      avatarUrl: avatarUrl,
      fileName: req.file.filename,
      fileSize: req.file.size
    });

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: { 
        user,
        avatarUrl: avatarUrl
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);

    // En cas d'erreur, supprimer le fichier uploadé
    if (req.file) {
      const uploadedFilePath = path.join(__dirname, '../public/uploads/avatars', req.file.filename);
      try {
        await fs.unlink(uploadedFilePath);
        console.log('🗑️ Fichier uploadé supprimé après erreur');
      } catch (err) {
        console.error('Erreur suppression fichier après erreur:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'upload',
      error: error.message
    });
  }
};

/**
 * 🗑️ Supprimer la photo de profil
 * DELETE /api/profile/avatar
 */
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo de profil à supprimer'
      });
    }

    // Supprimer le fichier du serveur
    const avatarPath = path.join(__dirname, '../public', user.avatarUrl);
    try {
      await fs.unlink(avatarPath);
      console.log('✅ Fichier avatar supprimé:', avatarPath);
    } catch (error) {
      console.log('⚠️ Fichier avatar introuvable sur le serveur');
    }

    // Mettre à jour l'utilisateur (retirer l'URL)
    user.avatarUrl = null;
    await user.save();

    console.log('✅ Avatar supprimé pour l\'utilisateur:', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Photo de profil supprimée avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur suppression avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📊 Obtenir les statistiques du profil (bonus)
 * GET /api/profile/stats
 */
exports.getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Pour l'instant, retourner des stats fictives
    // Plus tard, on calculera les vraies stats depuis les projets et tâches
    const stats = {
      projectsCount: 0,
      tasksCount: 0,
      completedTasksCount: 0,
      completionRate: 0,
      lastLoginAt: user.lastLoginAt,
      accountCreatedAt: user.createdAt
    };

    console.log('✅ Stats profil récupérées:', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// ✅ PLUS DE MODULE.EXPORTS À LA FIN !
// Les fonctions sont déjà exportées via exports.nomFonction