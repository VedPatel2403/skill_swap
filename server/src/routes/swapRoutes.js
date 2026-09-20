const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, swapController.createSwapRequest);
router.get('/my-swaps', authenticate, swapController.getUserSwaps);
router.put('/:id/accept', authenticate, swapController.acceptSwap);
router.put('/:id/reject', authenticate, swapController.rejectSwap);
router.delete('/:id', authenticate, swapController.deleteSwapRequest);
router.put('/:id/complete', authenticate, swapController.completeSwap);

module.exports = router;
