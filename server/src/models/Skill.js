const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Skill = sequelize.define('Skill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Technology'
  },
  type: {
    type: DataTypes.ENUM('offered', 'wanted'),
    allowNull: false
  },
  proficiency: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
    defaultValue: 'Intermediate'
  },
  status: {
    type: DataTypes.ENUM('active', 'flagged', 'rejected'),
    defaultValue: 'active'
  },
  moderationReason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'type', 'status'] },
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['type'] }
  ]
});

module.exports = Skill;
