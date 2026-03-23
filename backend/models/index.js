const sequelize = require('../config/database');
const User = require('./User.model');
const Project = require('./Project.model'); // ← AJOUTER

// Définir les associations
User.hasMany(Project, {
  foreignKey: 'managerId',
  as: 'projects'
});

Project.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager'
});

module.exports = {
  sequelize,
  User,
  Project // ← AJOUTER
};