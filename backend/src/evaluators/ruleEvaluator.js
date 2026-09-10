// RuleEvaluator: a deterministic, explainable analysis component.
//
// Design note: this is intentionally a single module exposing one
// `evaluate(submission, problem)` function rather than a class hierarchy.
// A full Evaluator interface/class hierarchy (RuleEvaluator, LLMEvaluator,
// CompositeEvaluator) will be introduced in later steps when there's an
// actual second implementation to share a contract with — building the
// abstraction now, with only one implementer, would be premature.
//
// Contract: evaluate(submission, problem) -> { structural: Finding[], heuristic: Finding[] }
// Finding: { message: String, severity: 'info' | 'warning' }
//
// Pure function: no DB writes, no network calls, no Express dependency.
// Same input always produces the same output.

const MAX_REASONABLE_RESPONSIBILITIES = 5;

// Small stopword list used only to strip filler words out of
// expectedConcepts text before treating the remaining words as
// "keywords worth checking for" in the submission. Deliberately minimal —
// this is a heuristic, not an NLP pipeline.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'with', 'some', 'form',
  'may', 'be', 'relevant', 'and', 'or', 'that', 'this', 'is', 'are', 'as',
  'by', 'into', 'not', 'you', 'your', 'which', 'clearly', 'approach', 'or',
  'across', 'between', 'or', 'used',
]);

function extractKeywords(text) {
  return (text.toLowerCase().match(/[a-z]+/g) || [])
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

function buildSubmissionText(submission) {
  const classes = submission.classes || [];
  const parts = [];

  for (const cls of classes) {
    if (cls.name) parts.push(cls.name);
    if (Array.isArray(cls.responsibilities)) parts.push(...cls.responsibilities);
    if (Array.isArray(cls.relationships)) parts.push(...cls.relationships);
  }

  if (Array.isArray(submission.patternsUsed)) parts.push(...submission.patternsUsed);
  if (submission.codeStub) parts.push(submission.codeStub);

  return parts.join(' ').toLowerCase();
}

// --- Structural checks (high confidence, objective, based only on the
// shape/content of the submission itself) ---

function runStructuralChecks(submission) {
  const findings = [];
  const classes = Array.isArray(submission.classes) ? submission.classes : [];
  const seenNames = new Map(); // lowercase name -> count

  for (const cls of classes) {
    const name = typeof cls.name === 'string' ? cls.name.trim() : '';

    if (!name) {
      findings.push({
        message: 'A class is missing a name. Every class should have a clear, identifiable name.',
        severity: 'warning',
      });
      continue;
    }

    const key = name.toLowerCase();
    seenNames.set(key, (seenNames.get(key) || 0) + 1);

    const responsibilities = Array.isArray(cls.responsibilities) ? cls.responsibilities : [];

    if (responsibilities.length === 0) {
      findings.push({
        message: `Class "${name}" has no listed responsibilities. Consider clarifying what it is responsible for.`,
        severity: 'info',
      });
    } else if (responsibilities.length > MAX_REASONABLE_RESPONSIBILITIES) {
      findings.push({
        message: `Class "${name}" has many responsibilities (${responsibilities.length}). Consider whether some responsibilities could be separated into another class.`,
        severity: 'warning',
      });
    }
  }

  for (const [name, count] of seenNames.entries()) {
    if (count > 1) {
      findings.push({
        message: `The class name "${name}" is used ${count} times. Consider renaming to avoid ambiguity between classes.`,
        severity: 'warning',
      });
    }
  }

  // Relationship references a class name that isn't declared anywhere in
  // this submission. Only flagged when a capitalized word in a relationship
  // string looks like it's meant to be a class name (this can't catch
  // everything reliably from free text, so it's a light, conservative check).
  const declaredNames = new Set(
    classes
      .map((c) => (typeof c.name === 'string' ? c.name.trim().toLowerCase() : ''))
      .filter(Boolean)
  );

  for (const cls of classes) {
    const relationships = Array.isArray(cls.relationships) ? cls.relationships : [];
    for (const rel of relationships) {
      if (typeof rel !== 'string') continue;
      const trimmedRel = rel.trim();
      const wordMatches = [...trimmedRel.matchAll(/\b[A-Z][a-zA-Z]*\b/g)];

      for (const match of wordMatches) {
        const word = match[0];
        const isFirstWordOfSentence = match.index === 0;
        // A compound, Pascal-case shape (e.g. "ParkingSpot") — two or more
        // capitalized segments run together — is a much stronger signal
        // of an intentional class name than mere capitalization, since
        // ordinary English words/verbs are essentially never written that
        // way. Plain capitalization alone is ambiguous at the start of a
        // sentence (every sentence starts capitalized regardless of
        // whether that word is a class name), so a single-segment
        // capitalized word there ("Contains", "Assigned", "Parked") is
        // treated as ordinary sentence-initial capitalization, not a
        // class reference. The same word later in the sentence, or a
        // compound name anywhere, is still checked normally.
        const isCompoundClassLike = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/.test(word);

        if (isFirstWordOfSentence && !isCompoundClassLike) {
          continue;
        }

        const wordKey = word.toLowerCase();
        if (wordKey === (cls.name || '').toLowerCase()) continue; // referencing itself
        if (!declaredNames.has(wordKey)) {
          findings.push({
            message: `The relationship "${rel}" on class "${cls.name}" mentions "${word}", which does not match any class defined in this submission. Verify it's intentional (e.g. a built-in type) or add the missing class.`,
            severity: 'info',
          });
        }
      }
    }
  }

  return findings;
}

// --- Heuristic checks (medium confidence, based on the problem's
// expectedConcepts — treated as suggestions, never as required answers) ---

function runHeuristicChecks(submission, problem) {
  const findings = [];
  const expectedConcepts = Array.isArray(problem?.expectedConcepts) ? problem.expectedConcepts : [];
  const submissionText = buildSubmissionText(submission);

  for (const concept of expectedConcepts) {
    if (typeof concept !== 'string' || !concept.trim()) continue;

    const keywords = extractKeywords(concept);
    if (keywords.length === 0) continue; // nothing meaningful to check against

    const isAddressed = keywords.some((keyword) => submissionText.includes(keyword));

    if (!isAddressed) {
      findings.push({
        message: `The problem suggests this may be relevant: "${concept}". Your submission doesn't clearly address this — you may want to consider whether and how it applies to your design.`,
        severity: 'info',
      });
    }
  }

  return findings;
}


// --- Requirement coverage (lightweight signal, not proof) ---
// Checks whether each requirement is mentioned by at least one submitted
// class through its name, responsibilities, or relationships.
//
// This is intentionally a heuristic signal. A keyword match does not prove
// that the requirement is actually satisfied.

function getRequirementCoverage(submission, problem) {
  const requirements = Array.isArray(problem?.requirements)
    ? problem.requirements
    : [];

  const classes = Array.isArray(submission?.classes)
    ? submission.classes
    : [];

  return requirements.map((requirement) => {
    const requirementKeywords = extractKeywords(requirement);
    const coveredBy = [];

    for (const cls of classes) {
      const classText = [
        cls.name || '',
        ...(Array.isArray(cls.responsibilities) ? cls.responsibilities : []),
        ...(Array.isArray(cls.relationships) ? cls.relationships : []),
      ]
        .join(' ')
        .toLowerCase();

      const isMentioned = requirementKeywords.some((keyword) =>
        classText.includes(keyword)
      );

      if (isMentioned && cls.name?.trim()) {
        coveredBy.push(cls.name.trim());
      }
    }

    return {
      requirement,
      covered: coveredBy.length > 0,
      coveredBy: [...new Set(coveredBy)],
    };
  });
}


// evaluate(submission, problem, context) — context is accepted for
// conformance with the shared Evaluator contract (see Evaluator.js) but
// unused here; RuleEvaluator's checks only ever need submission + problem.
function evaluate(submission, problem, context = {}) {
  const safeSubmission = submission || { classes: [], patternsUsed: [], codeStub: '' };

  return {
    structural: runStructuralChecks(safeSubmission),
    heuristic: runHeuristicChecks(safeSubmission, problem),
  };
}

module.exports = {
  evaluate,
  getRequirementCoverage,
};