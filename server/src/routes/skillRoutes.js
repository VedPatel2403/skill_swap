const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const { authenticate } = require('../middleware/auth');

router.get('/', skillController.getAllSkills);
router.post('/', authenticate, skillController.createSkill);
router.put('/:id', authenticate, skillController.updateSkill);
router.delete('/:id', authenticate, skillController.deleteSkill);

module.exports = router;
