const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Swap = sequelize.define('Swap', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  offeredSkillId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  wantedSkillId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['requesterId'] },
    { fields: ['recipientId'] },
    { fields: ['status'] },
    { fields: ['requesterId', 'status'] },
    { fields: ['recipientId', 'status'] }
  ]
});

module.exports = Swap;
