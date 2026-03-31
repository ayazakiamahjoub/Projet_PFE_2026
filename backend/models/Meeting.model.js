const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Meeting = sequelize.define('Meeting', {
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
      notEmpty: {
        msg: 'Le titre est requis'
      }
    }
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'La durée doit être au moins 1 minute'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meetLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  underscored: true
});

module.exports = Meeting;