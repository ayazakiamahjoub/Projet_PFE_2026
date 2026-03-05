const { User } = require('../models');
const sequelize = require('../config/database');

const createUser = async () => {
  try {
    await sequelize.sync();

    // Créer un utilisateur normal (role = 'member')
    const user = await User.create({
      email: 'user@smartpm.com',
      password: 'User123!',
      firstName: 'User',
      lastName: 'Normal',
      role: 'member',  // ← ROLE MEMBER (pas admin)
      isActive: true,
      isVerified: true
    });

    console.log('✅ Utilisateur normal créé avec succès !');
    console.log('📧 Email:', user.email);
    console.log('🔑 Mot de passe: User123!');
    console.log('👤 Rôle:', user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createUser();