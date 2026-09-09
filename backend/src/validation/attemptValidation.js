const mongoose = require('mongoose');

function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

// Validates the shape of a submission payload. Returns an error message
// string if invalid, or null if valid. Kept deliberately permissive on
// content (empty arrays/strings are fine) — this only checks structure,
// not design quality (that's the evaluator's job, not validation's).
function validateSubmissionShape(submission) {
  if (typeof submission !== 'object' || submission === null || Array.isArray(submission)) {
    return 'submission must be an object.';
  }

  const { classes, patternsUsed, codeStub } = submission;

  if (classes !== undefined) {
    if (!Array.isArray(classes)) {
      return 'submission.classes must be an array.';
    }
    for (const cls of classes) {
      if (typeof cls !== 'object' || cls === null || Array.isArray(cls)) {
        return 'Each item in submission.classes must be an object.';
      }
      if (typeof cls.name !== 'string' || cls.name.trim() === '') {
        return 'Each class must have a non-empty string "name".';
      }
      if (cls.responsibilities !== undefined) {
        if (!Array.isArray(cls.responsibilities) || !cls.responsibilities.every((r) => typeof r === 'string')) {
          return 'class.responsibilities must be an array of strings.';
        }
      }
      if (cls.relationships !== undefined) {
        if (!Array.isArray(cls.relationships) || !cls.relationships.every((r) => typeof r === 'string')) {
          return 'class.relationships must be an array of strings.';
        }
      }
    }
  }

  if (patternsUsed !== undefined) {
    if (!Array.isArray(patternsUsed) || !patternsUsed.every((p) => typeof p === 'string')) {
      return 'submission.patternsUsed must be an array of strings.';
    }
  }

  if (codeStub !== undefined && typeof codeStub !== 'string') {
    return 'submission.codeStub must be a string.';
  }

  return null;
}

module.exports = { isValidObjectId, validateSubmissionShape };