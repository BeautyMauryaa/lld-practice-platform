const express = require('express');
const router = express.Router();
const {
  createAttempt,
  saveDraft,
  getAttempt,
  listAttemptsByLearner,
  submitAttempt,
} = require('../controllers/attemptController');

router.post('/', createAttempt);
router.get('/', listAttemptsByLearner);
router.get('/:id', getAttempt);
router.patch('/:id', saveDraft);
router.post('/:id/submit', submitAttempt);

module.exports = router;