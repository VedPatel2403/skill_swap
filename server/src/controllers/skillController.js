const { Op } = require('sequelize');
const { Skill, User, Rating, Notification } = require('../models');

exports.getAllSkills = async (req, res) => {
  try {
    const { search, category, type, proficiency } = req.query;

    const skillWhere = { status: 'active' };

    if (type && ['offered', 'wanted'].includes(type)) {
      skillWhere.type = type;
    }

    if (category && category !== 'All') {
      skillWhere.category = category;
    }

    if (proficiency && proficiency !== 'All') {
      skillWhere.proficiency = proficiency;
    }

    if (search && search.trim()) {
      const q = search.trim();
      skillWhere[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } }
      ];
    }

    const skills = await Skill.findAll({
      where: skillWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: {
            isBanned: false,
            [Op.or]: [{ isPublic: true }, { isPublic: null }]
          },
          attributes: ['id', 'name', 'location', 'avatar', 'availability', 'isPublic'],
          include: [
            {
              model: Rating,
              as: 'receivedRatings',
              attributes: ['score']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedSkills = skills.map(skill => {
      const s = skill.toJSON();
      let avgRating = 0;
      let reviewCount = 0;
      if (s.user && s.user.receivedRatings && s.user.receivedRatings.length > 0) {
        const sum = s.user.receivedRatings.reduce((acc, r) => acc + r.score, 0);
        avgRating = parseFloat((sum / s.user.receivedRatings.length).toFixed(1));
        reviewCount = s.user.receivedRatings.length;
      }

      if (s.user) {
        s.user.averageRating = avgRating;
        s.user.ratingCount = reviewCount;
      }
      return s;
    });

    res.json(formattedSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, category, type, proficiency } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({ error: 'Title, description, and type (offered/wanted) are required.' });
    }

    if (!['offered', 'wanted'].includes(type)) {
      return res.status(400).json({ error: 'Skill type must be either "offered" or "wanted".' });
    }

    const trimmedTitle = title.trim();

    // Prevent duplicate skill for the same user and type
    const existingSkills = await Skill.findAll({
      where: {
        userId,
        type,
        status: 'active'
      }
    });

    const isDuplicate = existingSkills.some(
      s => s.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
    );

    if (isDuplicate) {
      return res.status(400).json({
        error: `You already have "${trimmedTitle}" in your skills ${type} list.`
      });
    }

    const skill = await Skill.create({
      userId,
      title: trimmedTitle,
      description: description.trim(),
      category: category || 'Technology',
      type,
      proficiency: proficiency || 'Intermediate',
      status: 'active'
    });

    // Record skill creation activity in user's account
    try {
      await Notification.create({
        userId,
        type: 'skill_created',
        title: `Skill Added: ${trimmedTitle}`,
        message: `You added "${trimmedTitle}" (${category || 'General'} • ${proficiency || 'Intermediate'}) to your ${type === 'offered' ? 'Skills Offered' : 'Skills Wanted'} list.`,
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording skill creation activity:', notifErr);
    }

    res.status(201).json({
      message: 'Skill added successfully!',
      skill
    });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill.' });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    if (skill.userId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to update this skill.' });
    }

    const { title, description, category, type, proficiency, status } = req.body;

    // Check duplicate if title or type changes
    if (title || type) {
      const targetType = type && ['offered', 'wanted'].includes(type) ? type : skill.type;
      const targetTitle = (title ? title.trim() : skill.title).toLowerCase();
      const existingSkills = await Skill.findAll({
        where: {
          userId: skill.userId,
          type: targetType,
          status: 'active',
          id: { [Op.ne]: id }
        }
      });
      const isDuplicate = existingSkills.some(
        s => s.title.trim().toLowerCase() === targetTitle
      );
      if (isDuplicate) {
        return res.status(400).json({
          error: `You already have "${title ? title.trim() : skill.title}" in your skills ${targetType} list.`
        });
      }
    }

    if (title) skill.title = title.trim();
    if (description) skill.description = description.trim();
    if (category) skill.category = category;
    if (type && ['offered', 'wanted'].includes(type)) skill.type = type;
    if (proficiency) skill.proficiency = proficiency;
    if (isAdmin && status) skill.status = status;

    await skill.save();

    // Record skill update activity in user's account
    try {
      await Notification.create({
        userId: skill.userId,
        type: 'skill_updated',
        title: `Skill Updated: ${skill.title}`,
        message: `You updated details for your skill "${skill.title}".`,
        link: '/profile',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording skill update activity:', notifErr);
    }

    res.json({
      message: 'Skill updated successfully!',
      skill
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill.' });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    if (skill.userId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this skill.' });
    }

    const skillTitle = skill.title;
    const skillOwnerId = skill.userId;
    await skill.destroy();

    // Record skill deletion activity in user's account
    try {
      await Notification.create({
        userId: skillOwnerId,
        type: 'skill_deleted',
        title: `Skill Removed: ${skillTitle}`,
        message: `You removed "${skillTitle}" from your profile inventory.`,
        link: '/profile',
        isRead: true
      });
    } catch (notifErr) {
      console.error('Error recording skill deletion activity:', notifErr);
    }

    res.json({ message: 'Skill deleted successfully.' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill.' });
  }
};
