const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public or general authenticated routes for announcements
router.get('/broadcasts/active', adminController.getActiveBroadcasts);

// Protected Admin Routes
router.use(authenticate, requireAdmin);

// Dashboard overview
router.get('/stats', adminController.getDashboardStats);

// User Moderation
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/ban', adminController.toggleUserBan);

// Content Moderation
router.get('/skills', adminController.getAllSkills);
router.put('/skills/:id/moderate', adminController.moderateSkill);
router.delete('/skills/:id', adminController.deleteSkillAdmin);

// Swaps Monitoring
router.get('/swaps', adminController.getAllSwaps);

// Platform Announcements & Messages
router.get('/broadcasts', adminController.getBroadcasts);
router.post('/broadcasts', adminController.createBroadcast);
router.put('/broadcasts/:id/toggle', adminController.toggleBroadcast);
router.delete('/broadcasts/:id', adminController.deleteBroadcast);

// Downloadable Activity Reports (CSV)
router.get('/reports/users/csv', adminController.downloadUserActivityReport);
router.get('/reports/swaps/csv', adminController.downloadSwapStatisticsReport);
router.get('/reports/feedback/csv', adminController.downloadFeedbackReport);

module.exports = router;
