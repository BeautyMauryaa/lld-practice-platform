const mongoose = require('mongoose');

const learnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Learner name is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Learner', learnerSchema);