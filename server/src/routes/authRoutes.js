const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/demo-accounts', optionalAuth, authController.getDemoAccounts);
router.post('/demo-login', optionalAuth, authController.demoLogin);
router.post('/firebase-login', authController.firebaseLogin);
router.post('/record-switch', optionalAuth, authController.recordSwitch);

module.exports = router;
