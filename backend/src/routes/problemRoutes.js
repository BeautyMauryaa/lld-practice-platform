const express = require('express');
const router = express.Router();
const { listProblems, getProblemById } = require('../controllers/problemController');

router.get('/', listProblems);
router.get('/:id', getProblemById);

module.exports = router;