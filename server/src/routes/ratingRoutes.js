const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ratingController.submitRating);
router.get('/user/:userId', ratingController.getUserRatings);

module.exports = router;
