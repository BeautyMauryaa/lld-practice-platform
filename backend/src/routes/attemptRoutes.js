const express = require('express');
const router = express.Router();
const {
  createAttempt,
  saveDraft,
  getAttempt,
  listAttemptsByLearner,
} = require('../controllers/attemptController');

router.post('/', createAttempt);
router.get('/', listAttemptsByLearner);
router.get('/:id', getAttempt);
router.patch('/:id', saveDraft);

module.exports = router;