const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le titre est requis'
      },
      len: {
        args: [3, 255],
        msg: 'Le titre doit contenir entre 3 et 255 caractères'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Le budget doit être positif'
      }
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'TND',
    validate: {
      isIn: {
        args: [['TND', 'EUR', 'USD', 'GBP']],
        msg: 'Devise non supportée'
      }
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
    validate: {
      isDate: {
        msg: 'Date de début invalide'
      }
    }
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
    validate: {
      isDate: {
        msg: 'Date de fin invalide'
      },
      isAfterStartDate(value) {
        if (this.startDate && value && new Date(value) <= new Date(this.startDate)) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'on_hold', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['draft', 'active', 'on_hold', 'completed', 'cancelled']],
        msg: 'Statut invalide'
      }
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: {
        args: [['low', 'medium', 'high', 'urgent']],
        msg: 'Priorité invalide'
      }
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'La progression doit être entre 0 et 100'
      },
      max: {
        args: [100],
        msg: 'La progression doit être entre 0 et 100'
      }
    }
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'manager_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#FF6B35',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'Couleur invalide (format: #RRGGBB)'
      }
    }
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_archived'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['manager_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['start_date', 'end_date']
    }
  ]
});

// Méthodes d'instance
Project.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

// Méthode pour calculer le statut basé sur les dates
Project.prototype.getComputedStatus = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (this.status === 'completed' || this.status === 'cancelled') {
    return this.status;
  }

  if (now < start) {
    return 'upcoming';
  } else if (now > end) {
    return 'overdue';
  } else {
    return 'active';
  }
};

// Méthode pour calculer la durée en jours
Project.prototype.getDuration = function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

module.exports = Project;