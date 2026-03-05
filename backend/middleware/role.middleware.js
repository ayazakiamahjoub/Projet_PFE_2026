/**
 * Middleware pour vérifier le rôle admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits administrateur requis.'
    });
  }

  next();
};

/**
 * Middleware pour vérifier le rôle manager ou admin
 */
const requireManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits manager ou admin requis.'
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requireManagerOrAdmin
};