// backend/tests/requirementCoverage.test.js

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Attempt = require("../src/models/Attempt");
const Problem = require("../src/models/Problem");
const RuleEvaluator = require("../src/evaluators/ruleEvaluator");
const {
  createCompositeEvaluator,
} = require("../src/evaluators/compositeEvaluator");
const { LLMEvaluatorError } = require("../src/evaluators/llmEvaluator");

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  await Attempt.deleteMany({});
  await Problem.deleteMany({});
  jest.restoreAllMocks();
});

describe("Requirement Coverage Suite", () => {
  it("should correctly evaluate covered and uncovered requirements", () => {
    const problem = {
      requirements: [
        "Support compact and large handicapped vehicles",
        "Unrelated missing requirement",
      ],
    };

    const submission = {
      classes: [
        {
          name: "ParkingSpot",
          responsibilities: ["Supports compact and large handicapped spots"],
          relationships: [],
        },
      ],
    };

    const result = RuleEvaluator.evaluate(submission, problem);
    const requirementCoverage = RuleEvaluator.getRequirementCoverage(
      submission,
      problem,
    );

    expect(result).toHaveProperty("structural");
    expect(result).toHaveProperty("heuristic");

    expect(requirementCoverage).toHaveLength(2);

    expect(requirementCoverage[0].covered).toBe(true);
    expect(requirementCoverage[0].coveredBy).toContain("ParkingSpot");

    expect(requirementCoverage[1].covered).toBe(false);
    expect(requirementCoverage[1].coveredBy).toEqual([]);
  });

  it("should collect multiple classes covering one requirement", () => {
    const problem = {
      requirements: ["Support compact and large vehicles"],
    };

    const submission = {
      classes: [
        {
          name: "ParkingSpot",
          responsibilities: ["Supports compact sizes"],
          relationships: [],
        },
        {
          name: "ParkingLot",
          responsibilities: ["Supports large sizes"],
          relationships: [],
        },
      ],
    };

    const requirementCoverage = RuleEvaluator.getRequirementCoverage(
      submission,
      problem,
    );

    expect(requirementCoverage[0].covered).toBe(true);
    expect(requirementCoverage[0].coveredBy).toEqual(
      expect.arrayContaining(["ParkingSpot", "ParkingLot"]),
    );
  });

  it("should handle empty or missing requirements gracefully", () => {
    const problem = {
      requirements: [],
    };

    const submission = {
      classes: [{ name: "TestClass" }],
    };

    const requirementCoverage = RuleEvaluator.getRequirementCoverage(
      submission,
      problem,
    );

    expect(requirementCoverage).toEqual([]);
  });

  it("should include requirement coverage in CompositeEvaluator result", async () => {
    const problem = {
      requirements: ["Support compact sizes"],
    };

    const submission = {
      classes: [
        {
          name: "ParkingSpot",
          responsibilities: ["Supports compact sizes"],
          relationships: [],
        },
      ],
      patternsUsed: [],
    };

    const ruleEvaluator = {
      evaluate: jest.fn().mockReturnValue({
        structural: [],
        heuristic: [],
      }),

      getRequirementCoverage: jest.fn().mockReturnValue([
        {
          requirement: "Support compact sizes",
          covered: true,
          coveredBy: ["ParkingSpot"],
        },
      ]),
    };

    const llmEvaluator = {
      evaluate: jest.fn().mockResolvedValue({
        aiInsights: [],
        summary: "Good design.",
      }),
    };

    const composite = createCompositeEvaluator({
      ruleEvaluator,
      llmEvaluator,
    });

    const evaluation = await composite.evaluate(submission, problem);

    expect(evaluation.requirementCoverage).toHaveLength(1);
    expect(evaluation.requirementCoverage[0].covered).toBe(true);
    expect(evaluation.requirementCoverage[0].coveredBy).toContain(
      "ParkingSpot",
    );
  });

  it("should preserve requirement coverage when LLM evaluation fails", async () => {
    const problem = {
      requirements: ["Support compact sizes"],
    };

    const submission = {
      classes: [
        {
          name: "ParkingSpot",
          responsibilities: ["Supports compact sizes"],
          relationships: [],
        },
      ],
    };

    const requirementCoverage = [
      {
        requirement: "Support compact sizes",
        covered: true,
        coveredBy: ["ParkingSpot"],
      },
    ];

    const ruleEvaluator = {
      evaluate: jest.fn().mockReturnValue({
        structural: [],
        heuristic: [],
      }),

      getRequirementCoverage: jest.fn().mockReturnValue(requirementCoverage),
    };

    const llmEvaluator = {
      evaluate: jest
        .fn()
        .mockRejectedValue(new LLMEvaluatorError("LLM evaluation timed out.")),
    };

    const composite = createCompositeEvaluator({
      ruleEvaluator,
      llmEvaluator,
    });

    const evaluation = await composite.evaluate(submission, problem);

    expect(evaluation).toBeDefined();
    expect(evaluation.llmAvailable).toBe(false);
    expect(evaluation.aiInsights).toEqual([]);
    expect(evaluation.requirementCoverage).toEqual(requirementCoverage);
  });

  it("should identify requirements that have no matching submission terms", () => {
    const problem = {
      requirements: [
        "Calculate parking fees based on vehicle type and duration",
      ],
    };

    const submission = {
      classes: [
        {
          name: "ParkingSpot",
          responsibilities: ["Store the parking spot number"],
          relationships: [],
        },
      ],
    };

    const requirementCoverage = RuleEvaluator.getRequirementCoverage(
      submission,
      problem,
    );

    expect(requirementCoverage).toHaveLength(1);
    expect(requirementCoverage[0].covered).toBe(false);
    expect(requirementCoverage[0].coveredBy).toEqual([]);
  });

  it("should collect ALL relevant matching classes", () => {
    const problem = {
      requirements: ["Handle entry and exit gates"],
    };

    const submission = {
      classes: [
        {
          name: "EntranceGate",
          responsibilities: ["Handle entry gate operations"],
          relationships: [],
        },
        {
          name: "ExitGate",
          responsibilities: ["Handle exit gate operations"],
          relationships: [],
        },
        {
          name: "UnrelatedClass",
          responsibilities: ["Nothing related"],
          relationships: [],
        },
      ],
    };

    const requirementCoverage = RuleEvaluator.getRequirementCoverage(
      submission,
      problem,
    );

    expect(requirementCoverage[0].covered).toBe(true);

    expect(requirementCoverage[0].coveredBy).toEqual(
      expect.arrayContaining(["EntranceGate", "ExitGate"]),
    );

    expect(requirementCoverage[0].coveredBy).not.toContain("UnrelatedClass");

    expect(requirementCoverage[0].coveredBy).toHaveLength(2);
  });

  it("should persist requirementCoverage in an Attempt", async () => {
    const problem = await Problem.create({
      title: "Parking Lot",
      description: "Design a parking lot",
      difficulty: "Medium",
      expectedClasses: ["ParkingSpot"],
      requirements: ["Support compact sizes"],
    });

    const attemptData = {
      problemId: problem._id,
      learnerId: new mongoose.Types.ObjectId(),
      status: "evaluated",

      submission: {
        classes: [
          {
            name: "ParkingSpot",
            responsibilities: ["Supports compact sizes"],
            relationships: [],
          },
        ],
      },

      feedback: {
        summary: "Good design",
        structural: [],
        heuristic: [],
        aiInsights: [],
        llmAvailable: true,

        requirementCoverage: [
          {
            requirement: "Support compact sizes",
            covered: true,
            coveredBy: ["ParkingSpot"],
          },
        ],
      },
    };

    const created = await Attempt.create(attemptData);
    const fetched = await Attempt.findById(created._id);

    expect(fetched).toBeDefined();

    expect(fetched.feedback.requirementCoverage).toHaveLength(1);

    expect(fetched.feedback.requirementCoverage[0].requirement).toBe(
      "Support compact sizes",
    );

    expect(fetched.feedback.requirementCoverage[0].covered).toBe(true);

    expect(fetched.feedback.requirementCoverage[0].coveredBy).toContain(
      "ParkingSpot",
    );
  });

  it("should preserve backward compatibility when requirementCoverage is absent", async () => {
    const problem = await Problem.create({
      title: "Legacy Problem",
      description: "Legacy description",
      difficulty: "Easy",
      expectedClasses: ["ClassA"],
    });

    const legacyAttempt = await Attempt.create({
      problemId: problem._id,
      learnerId: new mongoose.Types.ObjectId(),
      status: "evaluated",

      submission: {
        classes: [
          {
            name: "ClassA",
          },
        ],
      },

      feedback: {
        summary: "Legacy summary",
        structural: [],
        heuristic: [],
        aiInsights: [],
        llmAvailable: true,
      },
    });

    const fetched = await Attempt.findById(legacyAttempt._id);

    expect(fetched.feedback.requirementCoverage).toEqual([]);
  });
});
