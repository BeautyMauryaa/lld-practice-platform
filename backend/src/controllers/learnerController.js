const Learner = require('../models/Learner');

// POST /api/learners
async function createLearner(req, res) {
  const { name } = req.body || {};

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name must be a non-empty string.' });
  }

  try {
    const learner = await Learner.create({ name: name.trim() });

    res.status(201).json({
      id: learner._id,
      name: learner.name,
    });
  } catch (err) {
    console.error('Error creating learner:', err.message);
    res.status(500).json({ error: 'Failed to create learner.' });
  }
}

module.exports = { createLearner };