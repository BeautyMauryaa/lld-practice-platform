const mongoose = require('mongoose');
const Problem = require('../models/Problem');

// GET /api/problems — lightweight list for the problem picker screen.
async function listProblems(req, res) {
  try {
    const problems = await Problem.find({}, 'title difficulty requirements').lean();

    const result = problems.map((p) => ({
      id: p._id,
      title: p.title,
      difficulty: p.difficulty,
      requirements: p.requirements,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error listing problems:', err.message);
    res.status(500).json({ error: 'Failed to fetch problems.' });
  }
}

// GET /api/problems/:id — full problem detail for the attempt screen.
async function getProblemById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid problem ID.' });
  }

  try {
    const problem = await Problem.findById(id).lean();

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    res.json({
      id: problem._id,
      title: problem.title,
      difficulty: problem.difficulty,
      requirements: problem.requirements,
      constraints: problem.constraints,
      expectedConcepts: problem.expectedConcepts,
    });
  } catch (err) {
    console.error('Error fetching problem:', err.message);
    res.status(500).json({ error: 'Failed to fetch problem.' });
  }
}

module.exports = { listProblems, getProblemById };