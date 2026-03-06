const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // ← AJOUTER CETTE LIGNE
const sequelize = require('./config/database');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images de profil)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import des routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

// Enregistrement des routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Pioneer Tech - Backend en cours d\'exécution' });
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    requestedPath: req.path,
    method: req.method
  });
});

// Connexion à la base de données et démarrage du serveur
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connexion PostgreSQL réussie');
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    console.log('✅ Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`\n📍 Routes disponibles :`);
      console.log(`   Auth:`);
      console.log(`     - POST   /api/auth/register`);
      console.log(`     - POST   /api/auth/login`);
      console.log(`     - GET    /api/auth/profile`);
      console.log(`     - POST   /api/auth/logout`);
      console.log(`     - GET    /api/auth/verify`);
      console.log(`   Profile:`);
      console.log(`     - GET    /api/profile`);
      console.log(`     - PUT    /api/profile`);
      console.log(`     - PUT    /api/profile/password`);
      console.log(`     - POST   /api/profile/avatar`);
      console.log(`     - DELETE /api/profile/avatar`);
      console.log(`     - GET    /api/profile/stats\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion PostgreSQL:', error);
  });