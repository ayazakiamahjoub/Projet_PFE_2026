const sequelize = require('../config/database');
const User = require('./User.model');
const Project = require('./Project.model');
const Task = require('./Task.model');
const Meeting = require('./Meeting.model'); // ← AJOUTER CETTE LIGNE

// ===== RELATIONS USER ↔ PROJECT =====
User.hasMany(Project, {
  foreignKey: 'managerId',
  as: 'managedProjects'
});

Project.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager'
});

// ===== RELATIONS PROJECT ↔ TASK =====
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE'
});

Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// ===== RELATIONS USER ↔ TASK (assigné à) =====
User.hasMany(Task, {
  foreignKey: 'assignedTo',
  as: 'assignedTasks'
});

Task.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

// ===== RELATIONS USER ↔ TASK (créé par) =====
User.hasMany(Task, {
  foreignKey: 'createdBy',
  as: 'createdTasks'
});

Task.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// ===== RELATIONS MEETING ↔ USER (PARTICIPANTS) =====
// Table pivot : meeting_participants
Meeting.belongsToMany(User, {
  through: 'meeting_participants',
  as: 'participants',
  foreignKey: 'meeting_id',
  otherKey: 'user_id',
  timestamps: false // Pas de createdAt/updatedAt dans la table pivot
});

User.belongsToMany(Meeting, {
  through: 'meeting_participants',
  as: 'meetings',
  foreignKey: 'user_id',
  otherKey: 'meeting_id',
  timestamps: false
});

// ===== RELATIONS MEETING ↔ USER (CRÉATEUR) =====
Meeting.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Meeting, {
  foreignKey: 'createdBy',
  as: 'createdMeetings'
});

 //===== EXPORTS =====
module.exports = {
  sequelize,
  User,
  Project,
  Task,
  Meeting // ← AJOUTER CETTE LIGNE
};