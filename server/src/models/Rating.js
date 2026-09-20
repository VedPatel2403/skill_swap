const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  swapId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  raterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['swapId'] },
    { fields: ['targetUserId'] },
    { fields: ['raterId'] }
  ]
});

module.exports = Rating;
