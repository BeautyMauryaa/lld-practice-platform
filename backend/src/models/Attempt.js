const mongoose = require('mongoose');

const { Schema } = mongoose;

const ATTEMPT_STATUSES = ['draft', 'submitted', 'evaluating', 'evaluated', 'failed'];
const SEVERITY_LEVELS = ['info', 'low', 'medium', 'high', 'critical'];

// --- Submission sub-schemas ---

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    relationships: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    classes: {
      type: [classSchema],
      default: [],
    },
    patternsUsed: {
      type: [String],
      default: [],
    },
    codeStub: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// --- Feedback sub-schemas ---

const feedbackItemSchema = new Schema(
  {
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
    },
    severity: {
      type: String,
      enum: SEVERITY_LEVELS,
      default: 'info',
    },
  },
  { _id: false }
);

const requirementCoverageItemSchema = new Schema(
  {
    requirement: {
      type: String,
      required: [true, 'Requirement text is required'],
    },
    covered: {
      type: Boolean,
      default: false,
    },
    coveredBy: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const aiInsightSchema = new Schema(
  {
    message: {
      type: String,
      required: [true, 'AI insight message is required'],
    },
  },
  { _id: false }
);

const feedbackSchema = new Schema(
  {
    structural: {
      type: [feedbackItemSchema],
      default: [],
    },
    heuristic: {
      type: [feedbackItemSchema],
      default: [],
    },
    requirementCoverage: {
      type: [requirementCoverageItemSchema],
      default: [],
    },
    aiInsights: {
      type: [aiInsightSchema],
      default: [],
    },
    llmAvailable: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

// --- Main Attempt schema ---

const attemptSchema = new Schema({
  learnerId: {
    type: Schema.Types.ObjectId,
    ref: 'Learner',
    required: [true, 'learnerId is required'],
  },
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, 'problemId is required'],
  },
  submission: {
    type: submissionSchema,
    default: () => ({}),
  },
  status: {
    type: String,
    enum: ATTEMPT_STATUSES,
    default: 'draft',
  },
  feedback: {
    type: feedbackSchema,
    default: () => ({}),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
  },
  evaluatedAt: {
    type: Date,
  },
});

// Common access patterns: a learner's attempts, a problem's attempts,
// and filtering by status (e.g. finding attempts pending evaluation).
attemptSchema.index({ learnerId: 1 });
attemptSchema.index({ problemId: 1 });
attemptSchema.index({ status: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
