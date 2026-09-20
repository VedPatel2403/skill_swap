const { Notification } = require('../models');

// Fetch personalized notifications for the logged-in user only
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await Notification.findOne({
      where: { id, userId }
    });

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    notif.isRead = true;
    await notif.save();

    res.json({
      message: 'Notification marked as read.',
      notification: notif
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

// Mark all notifications for this user as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.json({
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
};

// Delete / Dismiss a single notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await Notification.findOne({
      where: { id, userId }
    });

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await notif.destroy();

    res.json({
      message: 'Notification dismissed successfully.'
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification.' });
  }
};

// Clear all notifications for this user
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.destroy({
      where: { userId }
    });

    res.json({
      message: 'All notifications cleared.'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
};
