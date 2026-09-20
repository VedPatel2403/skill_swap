const { Op } = require('sequelize');
const { Swap, User, Skill, Rating, Notification } = require('../models');

// Helper to include full swap context
const swapIncludeOptions = [
  {
    model: User,
    as: 'requester',
    attributes: ['id', 'name', 'email', 'avatar', 'location', 'availability']
  },
  {
    model: User,
    as: 'recipient',
    attributes: ['id', 'name', 'email', 'avatar', 'location', 'availability']
  },
  {
    model: Skill,
    as: 'offeredSkill',
    attributes: ['id', 'title', 'category', 'proficiency', 'description']
  },
  {
    model: Skill,
    as: 'wantedSkill',
    attributes: ['id', 'title', 'category', 'proficiency', 'description']
  },
  {
    model: Rating,
    as: 'ratings',
    include: [
      {
        model: User,
        as: 'rater',
        attributes: ['id', 'name', 'avatar']
      }
    ]
  }
];

exports.createSwapRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { recipientId, offeredSkillId, wantedSkillId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient is required.' });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ error: 'You cannot initiate a skill swap with yourself.' });
    }

    const recipient = await User.findByPk(recipientId);
    if (!recipient || recipient.isBanned) {
      return res.status(404).json({ error: 'Recipient user not found or unavailable.' });
    }

    // Check if there is already an active or pending swap between these two users
    const existingSwap = await Swap.findOne({
      where: {
        [Op.or]: [
          { requesterId, recipientId, status: 'pending' },
          { requesterId: recipientId, recipientId: requesterId, status: 'pending' }
        ]
      }
    });

    if (existingSwap) {
      return res.status(400).json({
        error: 'You already have a pending swap request with this user. Please wait for response.'
      });
    }

    const swap = await Swap.create({
      requesterId,
      recipientId,
      offeredSkillId: offeredSkillId || null,
      wantedSkillId: wantedSkillId || null,
      status: 'pending',
      message: message || ''
    });

    const fullSwap = await Swap.findByPk(swap.id, {
      include: swapIncludeOptions
    });

    // Notify recipient of new skill swap offer
    try {
      await Notification.create({
        userId: recipientId,
        type: 'swap_request',
        title: 'New Skill Swap Proposal',
        message: `${req.user.name} sent you a skill swap offer${fullSwap?.wantedSkill ? ` for your skill "${fullSwap.wantedSkill.title}"` : ''}.`,
        link: '/swaps'
      });
    } catch (notifErr) {
      console.error('Error creating swap request notification:', notifErr);
    }

    // Record activity in requester's account
    try {
      await Notification.create({
        userId: requesterId,
        type: 'swap_sent',
        title: 'Swap Proposal Sent',
        message: `You proposed a skill swap to ${recipient.name}${fullSwap?.wantedSkill ? ` for "${fullSwap.wantedSkill.title}"` : ''}.`,
        link: '/swaps',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording swap sent activity:', notifErr);
    }

    res.status(201).json({
      message: 'Swap request submitted successfully!',
      swap: fullSwap
    });
  } catch (error) {
    console.error('Error creating swap request:', error);
    res.status(500).json({ error: 'Failed to create swap request.' });
  }
};

exports.getUserSwaps = async (req, res) => {
  try {
    const userId = req.user.id;

    const allSwaps = await Swap.findAll({
      where: {
        [Op.or]: [{ requesterId: userId }, { recipientId: userId }]
      },
      include: swapIncludeOptions,
      order: [['createdAt', 'DESC']]
    });

    // Categorize swaps into intuitive dashboard buckets
    const incomingPending = allSwaps.filter(
      s => s.recipientId === userId && s.status === 'pending'
    );
    const outgoingPending = allSwaps.filter(
      s => s.requesterId === userId && s.status === 'pending'
    );
    const active = allSwaps.filter(s => s.status === 'accepted');
    const completed = allSwaps.filter(s => s.status === 'completed');
    const past = allSwaps.filter(
      s => s.status === 'rejected' || s.status === 'cancelled'
    );

    res.json({
      all: allSwaps,
      incomingPending,
      outgoingPending,
      active,
      completed,
      past,
      counts: {
        total: allSwaps.length,
        incomingPending: incomingPending.length,
        outgoingPending: outgoingPending.length,
        active: active.length,
        completed: completed.length
      }
    });
  } catch (error) {
    console.error('Error fetching user swaps:', error);
    res.status(500).json({ error: 'Failed to fetch your swaps.' });
  }
};

exports.acceptSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await Swap.findByPk(id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    if (swap.recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can accept this swap offer.' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ error: `Cannot accept a swap with status: ${swap.status}` });
    }

    swap.status = 'accepted';
    await swap.save();

    const updatedSwap = await Swap.findByPk(id, { include: swapIncludeOptions });

    // Notify requester that their swap request was accepted
    try {
      await Notification.create({
        userId: swap.requesterId,
        type: 'swap_accepted',
        title: 'Swap Request Accepted! 🎉',
        message: `${req.user.name} accepted your skill swap offer! You can now collaborate and schedule sessions.`,
        link: '/swaps'
      });
    } catch (notifErr) {
      console.error('Error creating swap accepted notification:', notifErr);
    }

    // Record activity in accepter's account
    try {
      await Notification.create({
        userId,
        type: 'swap_accepted',
        title: 'Swap Request Accepted',
        message: `You accepted the skill swap proposal from ${updatedSwap?.requester?.name || 'requester'}.`,
        link: '/swaps',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording accepter activity:', notifErr);
    }

    res.json({
      message: 'Swap request accepted! You can now collaborate.',
      swap: updatedSwap
    });
  } catch (error) {
    console.error('Error accepting swap:', error);
    res.status(500).json({ error: 'Failed to accept swap request.' });
  }
};

exports.rejectSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const swap = await Swap.findByPk(id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    if (swap.recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can reject this swap offer.' });
    }

    if (swap.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject a swap with status: ${swap.status}` });
    }

    swap.status = 'rejected';
    swap.rejectionReason = reason || 'Declined by recipient';
    await swap.save();

    const updatedSwap = await Swap.findByPk(id, { include: swapIncludeOptions });

    // Notify requester that their swap request was declined
    try {
      await Notification.create({
        userId: swap.requesterId,
        type: 'swap_rejected',
        title: 'Swap Request Declined',
        message: `${req.user.name} was unable to accept your swap request at this time.`,
        link: '/swaps'
      });
    } catch (notifErr) {
      console.error('Error creating swap rejected notification:', notifErr);
    }

    res.json({
      message: 'Swap request rejected.',
      swap: updatedSwap
    });
  } catch (error) {
    console.error('Error rejecting swap:', error);
    res.status(500).json({ error: 'Failed to reject swap request.' });
  }
};

exports.deleteSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const swap = await Swap.findByPk(id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    // Must be requester or admin
    if (swap.requesterId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own swap requests.' });
    }

    // Constraint: Allow a user to delete their own swap request IF it has not been accepted yet.
    if (swap.status === 'accepted' || swap.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete a swap that has already been accepted or completed.'
      });
    }

    await swap.destroy();

    res.json({
      message: 'Swap request deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting swap request:', error);
    res.status(500).json({ error: 'Failed to delete swap request.' });
  }
};

exports.completeSwap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await Swap.findByPk(id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap not found.' });
    }

    if (swap.requesterId !== userId && swap.recipientId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a participant in this swap.' });
    }

    if (swap.status !== 'accepted') {
      return res.status(400).json({
        error: 'Only accepted swaps in progress can be marked as completed.'
      });
    }

    swap.status = 'completed';
    swap.completedAt = new Date();
    await swap.save();

    const updatedSwap = await Swap.findByPk(id, { include: swapIncludeOptions });

    // Notify the other participant that the swap was completed
    try {
      const partnerId = swap.requesterId === userId ? swap.recipientId : swap.requesterId;
      await Notification.create({
        userId: partnerId,
        type: 'swap_completed',
        title: 'Swap Completed! 🌟',
        message: `${req.user.name} marked your skill swap as completed! Please leave your rating and review.`,
        link: '/swaps'
      });
    } catch (notifErr) {
      console.error('Error creating swap completed notification:', notifErr);
    }

    // Record activity in completer's account
    try {
      const partnerObj = swap.requesterId === userId ? updatedSwap?.recipient : updatedSwap?.requester;
      await Notification.create({
        userId,
        type: 'swap_completed',
        title: 'Swap Marked as Completed 🌟',
        message: `You marked your skill swap with ${partnerObj?.name || 'partner'} as completed. Feedback & ratings are unlocked.`,
        link: '/swaps',
        isRead: false
      });
    } catch (notifErr) {
      console.error('Error recording completer activity:', notifErr);
    }

    res.json({
      message: 'Swap marked as completed! You can now leave feedback and ratings.',
      swap: updatedSwap
    });
  } catch (error) {
    console.error('Error completing swap:', error);
    res.status(500).json({ error: 'Failed to mark swap as completed.' });
  }
};
