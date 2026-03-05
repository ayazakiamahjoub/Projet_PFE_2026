const { User } = require('../models');
const sequelize = require('../config/database');

const createAdmin = async () => {
  try {
    await sequelize.sync();

    const admin = await User.create({
      email: 'admin@Pioneertech.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'Pioneertech',
      role: 'admin',
      isActive: true,
      isVerified: true
    });

    console.log('✅ Admin créé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe: Admin123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createAdmin();