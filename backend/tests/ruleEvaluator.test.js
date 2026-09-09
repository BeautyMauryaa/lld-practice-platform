const { evaluate } = require('../src/evaluators/ruleEvaluator');

const parkingLotProblem = {
  title: 'Design a Parking Lot',
  expectedConcepts: [
    'Some form of spot allocation strategy',
    'Polymorphism across vehicle or spot types',
  ],
};

describe('RuleEvaluator - structural checks', () => {
  test('flags a class with too many responsibilities', () => {
    const submission = {
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['a', 'b', 'c', 'd', 'e', 'f'], // 6 > max of 5
          relationships: [],
        },
      ],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural.some((f) => /many responsibilities/i.test(f.message))).toBe(true);
    const finding = result.structural.find((f) => /many responsibilities/i.test(f.message));
    expect(finding.severity).toBe('warning');
  });

  test('flags duplicate class names', () => {
    const submission = {
      classes: [
        { name: 'Spot', responsibilities: ['track occupancy'], relationships: [] },
        { name: 'Spot', responsibilities: ['track size'], relationships: [] },
      ],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural.some((f) => /used 2 times/i.test(f.message))).toBe(true);
  });

  test('flags a class with no responsibilities', () => {
    const submission = {
      classes: [{ name: 'Ticket', responsibilities: [], relationships: [] }],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural.some((f) => /no listed responsibilities/i.test(f.message))).toBe(true);
    const finding = result.structural.find((f) => /no listed responsibilities/i.test(f.message));
    expect(finding.severity).toBe('info');
  });

  test('flags a class missing a name', () => {
    const submission = {
      classes: [{ name: '', responsibilities: ['x'], relationships: [] }],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural.some((f) => /missing a name/i.test(f.message))).toBe(true);
  });

  test('a reasonable, well-formed submission produces no structural warnings', () => {
    const submission = {
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['manage spots', 'track entry and exit'],
          relationships: ['has many Spot'],
        },
        {
          name: 'Spot',
          responsibilities: ['track occupancy', 'track size'],
          relationships: ['belongs to ParkingLot'],
        },
      ],
      patternsUsed: ['Strategy'],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural).toEqual([]);
  });

  test('flags a relationship mentioning a class that is not declared', () => {
    const submission = {
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['manage spots'],
          relationships: ['has many Sensor'], // "Sensor" is never declared as a class
        },
      ],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(result.structural.some((f) => /does not match any class/i.test(f.message))).toBe(true);
  });
});

describe('RuleEvaluator - heuristic checks', () => {
  test('detects a heuristic opportunity when an expected concept is not addressed at all', () => {
    const submission = {
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['track entry and exit'],
          relationships: [],
        },
      ],
      patternsUsed: [],
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    expect(
      result.heuristic.some((f) => /spot allocation strategy/i.test(f.message))
    ).toBe(true);
  });

  test('does not falsely require a specific design pattern when the concept is addressed some other way', () => {
    const submission = {
      classes: [
        {
          name: 'ParkingLot',
          responsibilities: ['assign an available parking spot to an incoming vehicle'],
          relationships: [],
        },
      ],
      patternsUsed: [], // no "Strategy" pattern named at all
      codeStub: '',
    };

    const result = evaluate(submission, parkingLotProblem);

    // "spot" and "allocation"-adjacent wording is present ("assign", "spot"),
    // so the allocation-strategy concept should be considered addressed
    // even though no specific pattern name was used.
    const allocationFinding = result.heuristic.find((f) => /spot allocation strategy/i.test(f.message));
    expect(allocationFinding).toBeUndefined();

    // Also confirm no finding anywhere demands a specific pattern by name.
    const allMessages = [...result.structural, ...result.heuristic].map((f) => f.message);
    expect(allMessages.some((m) => /must use/i.test(m))).toBe(false);
  });

  test('heuristic findings are never phrased as proof the design is wrong', () => {
    const submission = { classes: [], patternsUsed: [], codeStub: '' };
    const result = evaluate(submission, parkingLotProblem);

    for (const finding of result.heuristic) {
      expect(finding.message).not.toMatch(/must use/i);
      expect(finding.message).not.toMatch(/is wrong/i);
      expect(finding.message).not.toMatch(/incorrect/i);
      expect(finding.severity).toBe('info');
    }
  });

  test('a problem with no expectedConcepts produces no heuristic findings', () => {
    const submission = { classes: [{ name: 'X', responsibilities: ['y'] }], patternsUsed: [], codeStub: '' };
    const result = evaluate(submission, { title: 'No concepts problem', expectedConcepts: [] });

    expect(result.heuristic).toEqual([]);
  });
});

describe('RuleEvaluator - general behavior', () => {
  test('is a pure function: same input always produces the same output', () => {
    const submission = {
      classes: [{ name: 'A', responsibilities: [], relationships: [] }],
      patternsUsed: [],
      codeStub: '',
    };

    const result1 = evaluate(submission, parkingLotProblem);
    const result2 = evaluate(submission, parkingLotProblem);

    expect(result1).toEqual(result2);
  });

  test('handles a missing/empty submission gracefully without throwing', () => {
    expect(() => evaluate(undefined, parkingLotProblem)).not.toThrow();
    expect(() => evaluate({}, parkingLotProblem)).not.toThrow();
  });
});