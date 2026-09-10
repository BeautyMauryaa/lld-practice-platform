// backend/tests/requirementCoverage.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Attempt = require('../src/models/Attempt');
const Problem = require('../src/models/Problem');
const CompositeEvaluator = require('../src/evaluators/compositeEvaluator');
const RuleEvaluator = require('../src/evaluators/ruleEvaluator');
const LLMEvaluator = require('../src/evaluators/llmEvaluator');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000); // <-- Increase timeout here for this hook

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Attempt.deleteMany({});
  await Problem.deleteMany({});
  jest.restoreAllMocks();
});

describe('Requirement Coverage Suite', () => {
  it('should correctly evaluate covered and uncovered requirements', async () => {
    const problem = {
      requirements: [
        'Support compact and large handicapped vehicles',
        'Unrelated missing requirement'
      ],
      expectedClasses: ['ParkingSpot']
    };

    const submission = {
      classes: [
        {
          name: 'ParkingSpot',
          responsibilities: ['Supports compact and large handicapped spots'],
          relationships: []
        }
      ]
    };

    const evaluator = new RuleEvaluator();
    const result = evaluator.evaluate(problem, submission);

    expect(result.requirementCoverage).toHaveLength(2);
    expect(result.requirementCoverage[0].covered).toBe(true);
    expect(result.requirementCoverage[0].coveredBy).toContain('ParkingSpot');
    expect(result.requirementCoverage[1].covered).toBe(false);
    expect(result.requirementCoverage[1].coveredBy).toEqual([]);
  });

  it('should collect multiple classes covering one requirement and handle distinct mappings', async () => {
    const problem = {
      requirements: ['Support compact and large vehicles'],
      expectedClasses: []
    };

    const submission = {
      classes: [
        { name: 'ParkingSpot', responsibilities: ['Supports compact sizes'], relationships: [] },
        { name: 'ParkingLot', responsibilities: ['Supports large sizes'], relationships: [] }
      ]
    };

    const evaluator = new RuleEvaluator();
    const result = evaluator.evaluate(problem, submission);

    expect(result.requirementCoverage[0].covered).toBe(true);
    expect(result.requirementCoverage[0].coveredBy).toEqual(expect.arrayContaining(['ParkingSpot', 'ParkingLot']));
  });

  it('should handle empty or missing requirements gracefully', async () => {
    const problem = { requirements: [], expectedClasses: [] };
    const submission = { classes: [{ name: 'TestClass' }] };

    const evaluator = new RuleEvaluator();
    const result = evaluator.evaluate(problem, submission);

    expect(result.requirementCoverage).toEqual([]);
  });

  it('should run CompositeEvaluator successfully including requirement coverage', async () => {
    const problem = await Problem.create({
      title: 'Parking Lot',
      description: 'Design a parking lot',
      difficulty: 'Medium',
      expectedClasses: ['ParkingSpot'],
      requirements: ['Support compact sizes']
    });

    const submission = {
      classes: [
        { name: 'ParkingSpot', responsibilities: ['Supports compact sizes'], relationships: [] }
      ],
      patternsUsed: []
    };

    const composite = new CompositeEvaluator();
    const evaluation = await composite.evaluate(problem, submission);

    expect(evaluation.score).toBe(100);
    expect(evaluation.requirementCoverage).toHaveLength(1);
    expect(evaluation.requirementCoverage[0].covered).toBe(true);
    expect(evaluation.requirementCoverage[0].coveredBy).toContain('ParkingSpot');
  });

  it('should handle LLMEvaluator failure gracefully and preserve requirement coverage with llmAvailable set to false', async () => {
    const problem = await Problem.create({
      title: 'Parking Lot',
      description: 'Design a parking lot',
      difficulty: 'Medium',
      expectedClasses: ['ParkingSpot'],
      requirements: ['Support compact sizes']
    });

    const submission = {
      classes: [
        { name: 'ParkingSpot', responsibilities: ['Supports compact sizes'], relationships: [] }
      ]
    };

    // Force LLMEvaluator evaluate method to throw an error
    jest.spyOn(LLMEvaluator.prototype, 'evaluate').mockRejectedValue(new Error('LLM Service Unavailable'));

    const composite = new CompositeEvaluator();
    const evaluation = await composite.evaluate(problem, submission);

    expect(evaluation).toBeDefined();
    expect(evaluation.llmAvailable).toBe(false);
    expect(evaluation.requirementCoverage).toHaveLength(1);
    expect(evaluation.requirementCoverage[0].covered).toBe(true);
    expect(evaluation.requirementCoverage[0].coveredBy).toContain('ParkingSpot');
  });

  it('should prevent false positives when submission only contains generic overlapping words without specific terms', async () => {
    const problem = {
      requirements: [
        'Calculate parking fees based on vehicle type and duration'
      ],
      expectedClasses: []
    };

    const submission = {
      classes: [
        {
          name: 'ParkingManager',
          responsibilities: ['Manage vehicles in the parking system'],
          relationships: []
        }
      ]
    };

    const evaluator = new RuleEvaluator();
    const result = evaluator.evaluate(problem, submission);

    expect(result.requirementCoverage).toHaveLength(1);
    expect(result.requirementCoverage[0].covered).toBe(false);
    expect(result.requirementCoverage[0].coveredBy).toEqual([]);
  });

  it('should collect ALL relevant matching classes without stopping at the first match', async () => {
    const problem = {
      requirements: [
        'Handle entry and exit gates'
      ],
      expectedClasses: []
    };

    const submission = {
      classes: [
        { name: 'EntranceGate', responsibilities: ['Handle entry gate operations'], relationships: [] },
        { name: 'ExitGate', responsibilities: ['Handle exit gate operations'], relationships: [] },
        { name: 'UnrelatedClass', responsibilities: ['Nothing related'], relationships: [] }
      ]
    };

    const evaluator = new RuleEvaluator();
    const result = evaluator.evaluate(problem, submission);

    expect(result.requirementCoverage[0].covered).toBe(true);
    expect(result.requirementCoverage[0].coveredBy).toEqual(expect.arrayContaining(['EntranceGate', 'ExitGate']));
    expect(result.requirementCoverage[0].coveredBy).not.toContain('UnrelatedClass');
    expect(result.requirementCoverage[0].coveredBy).toHaveLength(2);
  });

  it('should successfully save, persist, and retrieve attempt including requirementCoverage in Mongoose', async () => {
    const problem = await Problem.create({
      title: 'Parking Lot',
      description: 'Design a parking lot',
      difficulty: 'Medium',
      expectedClasses: ['ParkingSpot'],
      requirements: ['Support compact sizes']
    });

    const attemptData = {
      problemId: problem._id,
      learnerName: 'Beauty',
      status: 'EVALUATED',
      submission: {
        classes: [
          { name: 'ParkingSpot', responsibilities: ['Supports compact sizes'], relationships: [] }
        ]
      },
      feedback: {
        score: 100,
        summary: 'Great design',
        structural: [],
        heuristic: [],
        aiInsights: null,
        llmAvailable: true,
        requirementCoverage: [
          {
            requirement: 'Support compact sizes',
            covered: true,
            coveredBy: ['ParkingSpot']
          }
        ]
      }
    };

    const created = await Attempt.create(attemptData);
    const fetched = await Attempt.findById(created._id);

    expect(fetched).toBeDefined();
    expect(fetched.feedback.requirementCoverage).toHaveLength(1);
    expect(fetched.feedback.requirementCoverage[0].requirement).toBe('Support compact sizes');
    expect(fetched.feedback.requirementCoverage[0].covered).toBe(true);
    expect(fetched.feedback.requirementCoverage[0].coveredBy).toContain('ParkingSpot');
  });

  it('should preserve backward compatibility when requirementCoverage is absent in old attempts', async () => {
    const problem = await Problem.create({
      title: 'Legacy Problem',
      description: 'Legacy description',
      difficulty: 'Easy',
      expectedClasses: ['ClassA']
    });

    const legacyAttempt = await Attempt.create({
      problemId: problem._id,
      learnerName: 'Beauty',
      submission: { classes: [{ name: 'ClassA' }] },
      feedback: {
        score: 100,
        summary: 'Legacy summary',
        structural: [],
        heuristic: [],
        aiInsights: null,
        llmAvailable: true
      }
    });

    const fetched = await Attempt.findById(legacyAttempt._id);
    expect(fetched.feedback.requirementCoverage).toEqual([]);
  });
});