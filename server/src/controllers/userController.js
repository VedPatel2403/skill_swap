const { Op } = require('sequelize');
const { sequelize, User, Skill, Rating, Swap, Notification, Broadcast, AdminLog } = require('../models');

// Helper to compute average rating
const computeRatingInfo = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return { averageRating: 0, ratingCount: 0 };
  }
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return {
    averageRating: parseFloat((sum / ratings.length).toFixed(1)),
    ratingCount: ratings.length
  };
};

// Helper to deduplicate skills list by type and normalized title
const deduplicateSkillsList = (skills) => {
  if (!skills || !Array.isArray(skills)) return [];
  const seen = new Set();
  return skills.filter(s => {
    const key = `${s.type}::${(s.title || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

exports.getPublicUsers = async (req, res) => {
  try {
    const { search, availability, category } = req.query;

    const whereClause = {
      isPublic: true,
      isBanned: false
    };

    if (availability) {
      whereClause.availability = { [Op.like]: `%${availability}%` };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Skill,
          as: 'skills',
          where: { status: 'active' },
          required: false
        },
        {
          model: Rating,
          as: 'receivedRatings',
          attributes: ['score']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    let filteredUsers = users.map(user => {
      const u = user.toJSON();
      const ratingInfo = computeRatingInfo(u.receivedRatings);
      const uniqueSkills = deduplicateSkillsList(u.skills || []);
      return {
        ...u,
        skills: uniqueSkills,
        averageRating: ratingInfo.averageRating,
        ratingCount: ratingInfo.ratingCount,
        skillsOffered: uniqueSkills.filter(s => s.type === 'offered'),
        skillsWanted: uniqueSkills.filter(s => s.type === 'wanted')
      };
    });

    // If search term is provided, filter across user name, location, or skill titles
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredUsers = filteredUsers.filter(u => {
        const matchesName = u.name && u.name.toLowerCase().includes(q);
        const matchesLocation = u.location && u.location.toLowerCase().includes(q);
        const matchesSkills = (u.skills || []).some(s =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
        return matchesName || matchesLocation || matchesSkills;
      });
    }

    // Filter by skill category if specified
    if (category && category !== 'All') {
      filteredUsers = filteredUsers.filter(u =>
        (u.skills || []).some(s => s.category.toLowerCase() === category.toLowerCase())
      );
    }

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching public users:', error);
    res.status(500).json({ error: 'Failed to fetch user profiles.' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user.id : null;
    const isAdmin = req.user ? req.user.role === 'admin' : false;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Skill,
          as: 'skills',
          where: { status: 'active' },
          required: false
        },
        {
          model: Rating,
          as: 'receivedRatings',
          include: [
            {
              model: User,
              as: 'rater',
              attributes: ['id', 'name', 'avatar']
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check privacy: If private and not owner and not admin, restrict view
    const isOwner = currentUserId === user.id;
    if (!user.isPublic && !isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'This profile is private.',
        isPrivate: true,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          isPublic: false
        }
      });
    }

    const u = user.toJSON();
    const ratingInfo = computeRatingInfo(u.receivedRatings);

    // Count completed swaps
    const completedSwapsCount = await Swap.count({
      where: {
        [Op.or]: [{ requesterId: user.id }, { recipientId: user.id }],
        status: 'completed'
      }
    });

    const uniqueSkills = deduplicateSkillsList(u.skills || []);

    res.json({
      ...u,
      skills: uniqueSkills,
      averageRating: ratingInfo.averageRating,
      ratingCount: ratingInfo.ratingCount,
      completedSwapsCount,
      skillsOffered: uniqueSkills.filter(s => s.type === 'offered'),
      skillsWanted: uniqueSkills.filter(s => s.type === 'wanted'),
      reviews: u.receivedRatings || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, location, avatar, bio, availability, isPublic } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name !== undefined) user.name = name;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (availability !== undefined) user.availability = availability;
    if (isPublic !== undefined) user.isPublic = Boolean(isPublic);

    await user.save();

    // Record profile update activity in user's account
    try {
      await Notification.create({
        userId,
        type: 'profile_updated',
        title: 'Profile Updated',
        message: 'You updated your profile information and availability settings.',
        link: '/profile',
        isRead: true
      });
    } catch (notifErr) {
      console.error('Error recording profile update activity:', notifErr);
    }

    res.json({
      message: 'Profile updated successfully!',
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// Permanently delete user account and cascade all associated platform data
exports.deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findByPk(id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Safeguard: Platform Administrator cannot be deleted
    if (targetUser.role === 'admin' || targetUser.email === 'patelvedb2403@gmail.com' || targetUser.email === 'admin@skillswap.com') {
      return res.status(403).json({
        error: 'The primary Platform Administrator account is protected and cannot be deleted.'
      });
    }

    // Authorization check: User can delete their own account, or Admin can delete any user
    const isOwner = req.user && req.user.id === id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (req.user && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this account.' });
    }

    // Execute cascade deletions in an atomic database transaction
    await sequelize.transaction(async (t) => {
      // 1. Delete associated Skills
      await Skill.destroy({ where: { userId: id }, transaction: t });

      // 2. Delete associated Notifications
      await Notification.destroy({ where: { userId: id }, transaction: t });

      // 3. Delete associated Ratings & Swaps
      const userSwaps = await Swap.findAll({
        where: {
          [Op.or]: [{ requesterId: id }, { recipientId: id }]
        },
        attributes: ['id'],
        transaction: t
      });
      const swapIds = userSwaps.map(s => s.id);

      if (swapIds.length > 0) {
        await Rating.destroy({
          where: {
            swapId: { [Op.in]: swapIds }
          },
          transaction: t
        });
      }

      await Rating.destroy({
        where: {
          [Op.or]: [{ raterId: id }, { targetUserId: id }]
        },
        transaction: t
      });

      await Swap.destroy({
        where: {
          [Op.or]: [{ requesterId: id }, { recipientId: id }]
        },
        transaction: t
      });

      // 4. Delete platform broadcasts created by user if any
      await Broadcast.destroy({ where: { createdById: id }, transaction: t });

      // 5. Delete admin logs referencing this user if any
      await AdminLog.destroy({
        where: {
          [Op.or]: [
            { adminId: id },
            { targetId: id, targetType: 'user' }
          ]
        },
        transaction: t
      });

      // 6. Delete user record
      await targetUser.destroy({ transaction: t });
    });

    res.json({
      message: `Account "${targetUser.name}" and all associated data have been permanently deleted.`
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to permanently delete account.' });
  }
};

