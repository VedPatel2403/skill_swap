const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/public', userController.getPublicUsers);
router.get('/:id', optionalAuth, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.delete('/:id', optionalAuth, userController.deleteUserAccount);

module.exports = router;
