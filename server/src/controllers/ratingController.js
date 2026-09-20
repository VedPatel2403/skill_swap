const { Rating, Swap, User, Notification } = require('../models');

exports.submitRating = async (req, res) => {
  try {
    const raterId = req.user.id;
    const { swapId, score, feedback } = req.body;

    if (!swapId || !score || !feedback) {
      return res.status(400).json({ error: 'Swap ID, score (1-5), and feedback are required.' });
    }

    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 1 || numScore > 5) {
      return res.status(400).json({ error: 'Score must be an integer between 1 and 5.' });
    }

    const swap = await Swap.findByPk(swapId);
    if (!swap) {
      return res.status(404).json({ error: 'Swap agreement not found.' });
    }

    // Must be a participant
    const isRequester = swap.requesterId === raterId;
    const isRecipient = swap.recipientId === raterId;

    if (!isRequester && !isRecipient) {
      return res.status(403).json({ error: 'You can only rate swaps you participated in.' });
    }

    // Requirement: active AFTER successful swap completion!
    if (swap.status !== 'completed') {
      return res.status(400).json({
        error: 'Feedback can only be submitted after the swap has been marked as completed.'
      });
    }

    // Determine target user
    const targetUserId = isRequester ? swap.recipientId : swap.requesterId;

    // Check if already rated by this rater for this swap
    const existingRating = await Rating.findOne({
      where: {
        swapId,
        raterId
      }
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already submitted feedback for this swap.' });
    }

    const rating = await Rating.create({
      swapId,
      raterId,
      targetUserId,
      score: numScore,
      feedback: feedback.trim()
    });

    const populatedRating = await Rating.findByPk(rating.id, {
      include: [
        { model: User, as: 'rater', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'targetUser', attributes: ['id', 'name', 'avatar'] }
      ]
    });

    // Notify the user who received this review
    try {
      await Notification.create({
        userId: targetUserId,
        type: 'rating_received',
        title: 'New Rating & Review Received ⭐',
        message: `${req.user.name} gave you a ${numScore}★ rating: "${feedback.trim()}"`,
        link: `/user/${targetUserId}`
      });
    } catch (notifErr) {
      console.error('Error creating rating notification:', notifErr);
    }

    // Record activity in rater's account
    try {
      await Notification.create({
        userId: raterId,
        type: 'rating_submitted',
        title: 'Feedback & Rating Submitted ⭐',
        message: `You left a ${numScore}★ review for ${populatedRating?.targetUser?.name || 'partner'}: "${feedback.trim()}"`,
        link: `/user/${targetUserId}`,
        isRead: true
      });
    } catch (notifErr) {
      console.error('Error recording rater activity:', notifErr);
    }

    res.status(201).json({
      message: 'Feedback and rating submitted successfully!',
      rating: populatedRating
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
};

exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await Rating.findAll({
      where: { targetUserId: userId },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'name', 'avatar', 'location']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(ratings);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings.' });
  }
};
