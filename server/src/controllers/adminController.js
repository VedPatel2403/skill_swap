const { Op } = require('sequelize');
const { User, Skill, Swap, Rating, Broadcast, AdminLog, Notification } = require('../models');

// Helper to format CSV strings safely
const convertToCSV = (data, fields) => {
  if (!data || data.length === 0) {
    return fields.join(',') + '\n';
  }
  const header = fields.join(',');
  const rows = data.map(item => {
    return fields.map(field => {
      let val = item[field];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });
  return [header, ...rows].join('\n');
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: 'user' } });
    const bannedUsers = await User.count({ where: { isBanned: true } });
    const totalSkills = await Skill.count();
    const activeSkills = await Skill.count({ where: { status: 'active' } });
    const flaggedSkills = await Skill.count({ where: { status: { [Op.ne]: 'active' } } });

    const totalSwaps = await Swap.count();
    const pendingSwaps = await Swap.count({ where: { status: 'pending' } });
    const acceptedSwaps = await Swap.count({ where: { status: 'accepted' } });
    const completedSwaps = await Swap.count({ where: { status: 'completed' } });
    const cancelledSwaps = await Swap.count({
      where: { status: { [Op.in]: ['rejected', 'cancelled'] } }
    });

    const totalRatings = await Rating.count();
    const activeBroadcasts = await Broadcast.count({ where: { isActive: true } });

    // Recent activity logs
    const recentLogs = await AdminLog.findAll({
      include: [{ model: User, as: 'admin', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      metrics: {
        totalUsers,
        bannedUsers,
        totalSkills,
        activeSkills,
        flaggedSkills,
        totalSwaps,
        pendingSwaps,
        acceptedSwaps,
        completedSwaps,
        cancelledSwaps,
        totalRatings,
        activeBroadcasts
      },
      recentLogs
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
};

// 1. User Moderation
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, isBanned } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned === 'true';

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: Skill, as: 'skills', attributes: ['id', 'title', 'type', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ error: 'Failed to fetch user list.' });
  }
};

exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, reason } = req.body;
    const adminId = req.user.id;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot suspend an administrative account.' });
    }

    const newBanStatus = isBanned !== undefined ? Boolean(isBanned) : !user.isBanned;
    user.isBanned = newBanStatus;
    await user.save();

    // Log the moderation action
    await AdminLog.create({
      adminId,
      action: newBanStatus ? 'ban_user' : 'unban_user',
      targetType: 'user',
      targetId: user.id,
      details: `User ${user.email} was ${newBanStatus ? 'suspended' : 'reinstated'}. Reason: ${reason || 'Community policy enforcement'}`
    });

    res.json({
      message: `User ${user.name} has been ${newBanStatus ? 'suspended' : 'reinstated'}.`,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    res.status(500).json({ error: 'Failed to update user suspension status.' });
  }
};

// 2. Content Moderation
exports.getAllSkills = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const skills = await Skill.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar', 'isBanned']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills for admin:', error);
    res.status(500).json({ error: 'Failed to fetch skills for moderation.' });
  }
};

exports.moderateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    if (!['active', 'flagged', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid moderation status. Must be active, flagged, or rejected.' });
    }

    const skill = await Skill.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'name'] }]
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    skill.status = status;
    skill.moderationReason = reason || 'Content reviewed by administrator';
    await skill.save();

    await AdminLog.create({
      adminId,
      action: `moderate_skill_${status}`,
      targetType: 'skill',
      targetId: skill.id,
      details: `Skill "${skill.title}" status changed to ${status}. Reason: ${reason || 'Administrator moderation'}`
    });

    res.json({
      message: `Skill has been updated to "${status}".`,
      skill
    });
  } catch (error) {
    console.error('Error moderating skill:', error);
    res.status(500).json({ error: 'Failed to moderate skill.' });
  }
};

exports.deleteSkillAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    const skillTitle = skill.title;
    await skill.destroy();

    await AdminLog.create({
      adminId,
      action: 'delete_skill',
      targetType: 'skill',
      targetId: id,
      details: `Permanently removed skill "${skillTitle}".`
    });

    res.json({ message: 'Skill deleted permanently by admin.' });
  } catch (error) {
    console.error('Error deleting skill as admin:', error);
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
};

// 3. Platform Monitoring (All Swaps)
exports.getAllSwaps = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    const swaps = await Swap.findAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'recipient', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Skill, as: 'offeredSkill', attributes: ['id', 'title', 'category'] },
        { model: Skill, as: 'wantedSkill', attributes: ['id', 'title', 'category'] },
        { model: Rating, as: 'ratings' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(swaps);
  } catch (error) {
    console.error('Error fetching all swaps for admin:', error);
    res.status(500).json({ error: 'Failed to fetch swaps monitoring data.' });
  }
};

// 4. Platform-Wide Messaging (Broadcasts)
exports.getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.findAll({
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(broadcasts);
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
};

exports.getActiveBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    res.json(broadcasts);
  } catch (error) {
    console.error('Error fetching active broadcasts:', error);
    res.status(500).json({ error: 'Failed to fetch active announcements.' });
  }
};

exports.createBroadcast = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const broadcast = await Broadcast.create({
      createdById: adminId,
      title: title.trim(),
      message: message.trim(),
      type: type || 'announcement',
      isActive: true
    });

    await AdminLog.create({
      adminId,
      action: 'create_broadcast',
      targetType: 'platform',
      targetId: broadcast.id,
      details: `Published announcement: "${title}"`
    });

    // Fan out notification to all active platform users so it lands in their personal notification inbox
    try {
      const activeUsers = await User.findAll({ where: { isBanned: false }, attributes: ['id'] });
      if (activeUsers.length > 0) {
        await Notification.bulkCreate(
          activeUsers.map(u => ({
            userId: u.id,
            type: type === 'maintenance' ? 'maintenance' : 'system',
            title: title.trim(),
            message: message.trim(),
            link: '/'
          }))
        );
      }
    } catch (notifErr) {
      console.error('Error fanning out broadcast notifications:', notifErr);
    }

    res.status(201).json({
      message: 'Platform announcement broadcasted successfully!',
      broadcast
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ error: 'Failed to send platform broadcast.' });
  }
};

exports.toggleBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found.' });
    }

    broadcast.isActive = !broadcast.isActive;
    await broadcast.save();

    res.json({
      message: `Broadcast is now ${broadcast.isActive ? 'active' : 'inactive'}.`,
      broadcast
    });
  } catch (error) {
    console.error('Error toggling broadcast:', error);
    res.status(500).json({ error: 'Failed to toggle broadcast.' });
  }
};

exports.deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const broadcast = await Broadcast.findByPk(id);

    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found.' });
    }

    await broadcast.destroy();
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

// 5. Downloadable Reports (CSV)
exports.downloadUserActivityReport = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'location', 'availability', 'isPublic', 'isBanned', 'createdAt'],
      include: [
        { model: Skill, as: 'skills', attributes: ['id'] },
        { model: Swap, as: 'sentSwaps', attributes: ['id'] },
        { model: Swap, as: 'receivedSwaps', attributes: ['id'] }
      ]
    });

    const flatData = users.map(u => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      location: u.location || 'N/A',
      availability: u.availability || 'N/A',
      isPublic: u.isPublic ? 'Yes' : 'No',
      isBanned: u.isBanned ? 'Suspended' : 'Active',
      skillsCount: (u.skills || []).length,
      swapsSentCount: (u.sentSwaps || []).length,
      swapsReceivedCount: (u.receivedSwaps || []).length,
      registeredAt: u.createdAt.toISOString()
    }));

    const fields = [
      'userId', 'name', 'email', 'role', 'location',
      'availability', 'isPublic', 'isBanned', 'skillsCount',
      'swapsSentCount', 'swapsReceivedCount', 'registeredAt'
    ];

    const csv = convertToCSV(flatData, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="user_activity_report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error generating user report:', error);
    res.status(500).json({ error: 'Failed to export user activity report.' });
  }
};

exports.downloadSwapStatisticsReport = async (req, res) => {
  try {
    const swaps = await Swap.findAll({
      include: [
        { model: User, as: 'requester', attributes: ['name', 'email'] },
        { model: User, as: 'recipient', attributes: ['name', 'email'] },
        { model: Skill, as: 'offeredSkill', attributes: ['title', 'category'] },
        { model: Skill, as: 'wantedSkill', attributes: ['title', 'category'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const flatData = swaps.map(s => ({
      swapId: s.id,
      status: s.status,
      requesterName: s.requester ? s.requester.name : 'Unknown',
      requesterEmail: s.requester ? s.requester.email : 'Unknown',
      recipientName: s.recipient ? s.recipient.name : 'Unknown',
      recipientEmail: s.recipient ? s.recipient.email : 'Unknown',
      offeredSkill: s.offeredSkill ? s.offeredSkill.title : 'N/A',
      wantedSkill: s.wantedSkill ? s.wantedSkill.title : 'N/A',
      createdAt: s.createdAt.toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : 'N/A'
    }));

    const fields = [
      'swapId', 'status', 'requesterName', 'requesterEmail',
      'recipientName', 'recipientEmail', 'offeredSkill',
      'wantedSkill', 'createdAt', 'completedAt'
    ];

    const csv = convertToCSV(flatData, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="swap_statistics_report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error generating swap report:', error);
    res.status(500).json({ error: 'Failed to export swap statistics report.' });
  }
};

exports.downloadFeedbackReport = async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      include: [
        { model: User, as: 'rater', attributes: ['name', 'email'] },
        { model: User, as: 'targetUser', attributes: ['name', 'email'] },
        { model: Swap, as: 'swap', attributes: ['id', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const flatData = ratings.map(r => ({
      ratingId: r.id,
      swapId: r.swapId,
      raterName: r.rater ? r.rater.name : 'Unknown',
      raterEmail: r.rater ? r.rater.email : 'Unknown',
      targetUserName: r.targetUser ? r.targetUser.name : 'Unknown',
      targetUserEmail: r.targetUser ? r.targetUser.email : 'Unknown',
      score: r.score,
      feedback: r.feedback,
      submittedAt: r.createdAt.toISOString()
    }));

    const fields = [
      'ratingId', 'swapId', 'raterName', 'raterEmail',
      'targetUserName', 'targetUserEmail', 'score',
      'feedback', 'submittedAt'
    ];

    const csv = convertToCSV(flatData, fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedback_ratings_report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error generating feedback report:', error);
    res.status(500).json({ error: 'Failed to export feedback logs.' });
  }
};
