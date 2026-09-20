const sequelize = require('../config/database');
const User = require('./User');
const Skill = require('./Skill');
const Swap = require('./Swap');
const Rating = require('./Rating');
const Broadcast = require('./Broadcast');
const AdminLog = require('./AdminLog');
const Notification = require('./Notification');

// User <-> Skill
User.hasMany(Skill, { foreignKey: 'userId', as: 'skills', onDelete: 'CASCADE' });
Skill.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification (Personalized account notifications)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Swap (Requester & Recipient)
User.hasMany(Swap, { foreignKey: 'requesterId', as: 'sentSwaps' });
User.hasMany(Swap, { foreignKey: 'recipientId', as: 'receivedSwaps' });
Swap.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Swap.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// Swap <-> Skills
Swap.belongsTo(Skill, { foreignKey: 'offeredSkillId', as: 'offeredSkill' });
Swap.belongsTo(Skill, { foreignKey: 'wantedSkillId', as: 'wantedSkill' });

// Swap <-> Rating
Swap.hasMany(Rating, { foreignKey: 'swapId', as: 'ratings' });
Rating.belongsTo(Swap, { foreignKey: 'swapId', as: 'swap' });

// User <-> Rating
User.hasMany(Rating, { foreignKey: 'raterId', as: 'givenRatings' });
User.hasMany(Rating, { foreignKey: 'targetUserId', as: 'receivedRatings' });
Rating.belongsTo(User, { foreignKey: 'raterId', as: 'rater' });
Rating.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

// Broadcast <-> User (Admin author)
Broadcast.belongsTo(User, { foreignKey: 'createdById', as: 'author' });

// AdminLog <-> User (Admin)
AdminLog.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

module.exports = {
  sequelize,
  User,
  Skill,
  Swap,
  Rating,
  Broadcast,
  AdminLog,
  Notification
};
