const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth.routes');

const app = express();

// ========== MIDDLEWARES ==========

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== ROUTES ==========

// Route de test
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API PioneerTech - Version 1.0',
    timestamp: new Date().toISOString()
  });
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== DÉMARRAGE SERVEUR ==========

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Synchroniser la base de données
    await sequelize.sync({ alter: true });
    console.log('✅ Base de données synchronisée');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV}\n`);
    });

  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
};

startServer();