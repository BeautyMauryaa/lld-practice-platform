const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
  },
  difficulty: {
    type: String,
    required: [true, 'Problem difficulty is required'],
    trim: true,
  },
  requirements: {
    type: [String],
    default: [],
  },
  constraints: {
    type: [String],
    default: [],
  },
  expectedConcepts: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Learners will commonly filter/browse problems by difficulty.
problemSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Problem', problemSchema);