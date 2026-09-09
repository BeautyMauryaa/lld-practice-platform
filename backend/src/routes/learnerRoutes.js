const express = require('express');
const router = express.Router();
const { createLearner } = require('../controllers/learnerController');

router.post('/', createLearner);

module.exports = router;