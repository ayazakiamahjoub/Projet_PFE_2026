const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import des routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const userRoutes = require('./routes/user.routes'); 
const projectRoutes = require('./routes/project.routes');

// Enregistrement des routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/projects', projectRoutes);
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
    return sequelize.sync({ alter: true }); // ← IMPORTANT: alter:true pour créer la table projects
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
      console.log(`   Profile:`);
      console.log(`     - GET    /api/profile`);
      console.log(`     - PUT    /api/profile`);
      console.log(`     - PUT    /api/profile/password`);
      console.log(`     - POST   /api/profile/avatar`);
      console.log(`     - DELETE /api/profile/avatar`);
      console.log(`   Users (Admin):`);
      console.log(`     - GET    /api/users`);
      console.log(`     - GET    /api/users/stats`);
      console.log(`     - GET    /api/users/:id`);
      console.log(`     - POST   /api/users`);
      console.log(`     - PUT    /api/users/:id`);
      console.log(`     - DELETE /api/users/:id`);
      console.log(`     - PATCH  /api/users/:id/toggle-active\n`);
      console.log(`   Projects (Admin + Manager):`); // ← AJOUTER
      console.log(`     - GET    /api/projects`);
      console.log(`     - GET    /api/projects/stats`);
      console.log(`     - GET    /api/projects/:id`);
      console.log(`     - POST   /api/projects`);
      console.log(`     - PUT    /api/projects/:id`);
      console.log(`     - DELETE /api/projects/:id\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion PostgreSQL:', error);
  });
