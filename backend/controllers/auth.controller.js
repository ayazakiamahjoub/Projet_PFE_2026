const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpire } = require('../config/auth');

/**
 * 📝 Inscription (Register) - SANS connexion automatique
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validation basique
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom et nom sont requis'
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    // Validation mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation téléphone (optionnel)
    if (phone) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone invalide'
        });
      }
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Définir le rôle
    let userRole = 'member';
    if (role && ['manager', 'member'].includes(role)) {
      userRole = role;
    }

    // Créer l'utilisateur VÉRIFIÉ ET ACTIF (mais pas connecté)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
      role: userRole,
      isActive: true,        // ✅ Actif
      isVerified: true,      // ✅ Vérifié
      verificationToken: null,
      verificationTokenExpires: null
    });

    console.log('✅ Nouvel utilisateur créé:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // ⬇️ PAS DE TOKEN JWT - L'utilisateur doit se connecter manuellement
    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
      data: {
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
};

/**
 * 🔐 Connexion (Login)
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * 👤 Obtenir le profil de l'utilisateur connecté
 * GET /api/auth/profile
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
 * 🚪 Déconnexion
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * ✓ Vérifier si le token est valide
 * GET /api/auth/verify
 */
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};