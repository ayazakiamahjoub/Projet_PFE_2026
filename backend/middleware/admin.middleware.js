/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
exports.isAdmin = (req, res, next) => {
  // L'utilisateur doit déjà être authentifié (via authenticate middleware)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier le rôle
  if (req.user.role !== 'admin') {
    console.log('⚠️ Accès refusé - Non admin:', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Cette action nécessite les droits administrateur.'
    });
  }

  console.log('✅ Accès admin autorisé:', {
    userId: req.user.id,
    email: req.user.email
  });

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est admin ou manager
 */
exports.isAdminOrManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Cette action nécessite les droits administrateur ou manager.'
    });
  }

  next();
};