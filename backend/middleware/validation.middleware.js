/**
 * Middleware de validation pour l'inscription
 */
exports.validateRegister = (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  const errors = [];

  // Validation email
  if (!email) {
    errors.push('L\'email est requis');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Format d\'email invalide');
  }

  // Validation mot de passe
  if (!password) {
    errors.push('Le mot de passe est requis');
  } else if (password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères');
  } else if (password.length > 100) {
    errors.push('Le mot de passe est trop long');
  }

  // Validation prénom
  if (!firstName) {
    errors.push('Le prénom est requis');
  } else if (firstName.length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  } else if (firstName.length > 50) {
    errors.push('Le prénom est trop long');
  }

  // Validation nom
  if (!lastName) {
    errors.push('Le nom est requis');
  } else if (lastName.length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  } else if (lastName.length > 50) {
    errors.push('Le nom est trop long');
  }

  // Validation téléphone (optionnel)
  if (phone && phone.trim() !== '') {
    if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
      errors.push('Format de téléphone invalide');
    } else if (phone.length < 8 || phone.length > 20) {
      errors.push('Le numéro de téléphone doit contenir entre 8 et 20 caractères');
    }
  }

  // Si erreurs, retourner
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    });
  }

  next();
};

/**
 * Middleware de validation pour la connexion
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('L\'email est requis');
  }

  if (!password) {
    errors.push('Le mot de passe est requis');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    });
  }

  next();
};