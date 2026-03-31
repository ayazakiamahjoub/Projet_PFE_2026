const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le titre de la tâche est requis' },
      len: { args: [3, 255], msg: 'Le titre doit contenir entre 3 et 255 caractères' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'pending_approval', 'done', 'cancelled'),
    defaultValue: 'todo',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: { args: [0], msg: 'Les heures estimées doivent être positives' } }
  },
  actualHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: { min: { args: [0], msg: 'Les heures réelles doivent être positives' } }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: { min: 0, max: 100 }
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'projects', key: 'id' },
    onDelete: 'CASCADE'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  // NOUVEAUX CHAMPS POUR L'APPROBATION
  approvalRequest: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  },
  approvalResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true
});

module.exports = Task;