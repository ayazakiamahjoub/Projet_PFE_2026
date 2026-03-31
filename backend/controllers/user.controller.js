const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * 📋 Obtenir tous les utilisateurs (avec filtres et recherche)
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, isActive, page = 1, limit = 10 } = req.query;

    // Construire les conditions de filtre
    const where = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    console.log('✅ Liste utilisateurs récupérée:', {
      total: count,
      page,
      limit,
      filters: { role, search, isActive }
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 👤 Obtenir un utilisateur par ID
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('✅ Utilisateur récupéré:', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ➕ Créer un nouvel utilisateur
 * POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom et nom sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Validation du rôle
    const validRoles = ['admin', 'manager', 'member'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
      role: role || 'member',
      isActive: true,
      isVerified: true // Admin crée des comptes déjà vérifiés
    });

    console.log(' Utilisateur créé par admin:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdBy: req.user.email
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ✏️ Modifier un utilisateur
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher l'admin de se désactiver lui-même
    if (user.id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    // Empêcher l'admin de changer son propre rôle
    if (user.id === req.user.id && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    // Vérifier l'unicité de l'email si modifié
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone || null;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    console.log('✅ Utilisateur modifié par admin:', {
      userId: user.id,
      email: user.email,
      modifiedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🗑️ Supprimer un utilisateur
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher l'admin de se supprimer lui-même
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer l'avatar s'il existe
    if (user.avatarUrl) {
      const fs = require('fs').promises;
      const path = require('path');
      const avatarPath = path.join(__dirname, '../public', user.avatarUrl);
      try {
        await fs.unlink(avatarPath);
        console.log('✅ Avatar supprimé');
      } catch (error) {
        console.log('⚠️ Avatar introuvable');
      }
    }

    await user.destroy();

    console.log('✅ Utilisateur supprimé par admin:', {
      userId: user.id,
      email: user.email,
      deletedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 🔄 Activer/Désactiver un utilisateur
 * PATCH /api/users/:id/toggle-active
 */
exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher l'admin de se désactiver lui-même
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    console.log('✅ Statut utilisateur modifié:', {
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
      modifiedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur toggle active:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 📊 Obtenir les statistiques des utilisateurs
 * GET /api/users/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });
    
    const adminCount = await User.count({ where: { role: 'admin' } });
    const managerCount = await User.count({ where: { role: 'manager' } });
    const memberCount = await User.count({ where: { role: 'member' } });

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: {
        admin: adminCount,
        manager: managerCount,
        member: memberCount
      }
    };

    console.log('✅ Stats utilisateurs récupérées');

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('❌ Erreur stats utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 👥 Obtenir les membres assignables à une tâche
 * GET /api/users/members
 * Accessible par manager ET admin
 */
exports.getAssignableMembers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true, role: 'member' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'avatarUrl'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    console.log('✅ Membres assignables récupérés:', users.length);

    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('❌ Erreur récupération membres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};