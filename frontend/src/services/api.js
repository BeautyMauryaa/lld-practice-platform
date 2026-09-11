// All backend calls live in this one file. Pages call these functions
// rather than writing fetch() directly, so the API base URL and error
// handling live in exactly one place.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

// ---- Problems ----

export function getProblems() {
  return request('/problems');
}

export function getProblemById(id) {
  return request(`/problems/${id}`);
}

// ---- Learners ----
// There's no dedicated "who am I" screen yet in the roadmap, so the
// frontend needs the smallest possible way to get a learnerId to create
// attempts with. See getStoredLearnerId/registerLearner in
// services/learner.js for how this is used — kept separate from this
// file since it's identity bootstrapping, not a plain API wrapper.

export function createLearner(name) {
  return request('/learners', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ---- Attempts ----

export function createAttempt(learnerId, problemId) {
  return request('/attempts', {
    method: 'POST',
    body: JSON.stringify({ learnerId, problemId }),
  });
}

export function saveAttemptDraft(attemptId, submission) {
  return request(`/attempts/${attemptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ submission }),
  });
}

export function getAttemptById(attemptId) {
  return request(`/attempts/${attemptId}`);
}

// GET /api/attempts?learnerId=xxx — a learner's attempt history. Each
// entry is intentionally thin (id, problemId, status, dates only — no
// submission/feedback); pages that need those fetch the full attempt
// via getAttemptById for the specific attempts that need it.
export function getAttempts(learnerId) {
  return request(`/attempts?learnerId=${encodeURIComponent(learnerId)}`);
}

// Runs the submit -> evaluate pipeline server-side and returns the
// updated attempt (status "evaluated", with feedback populated) once
// it's done. There's no polling step — the backend evaluates
// synchronously within this request.
export function submitAttempt(attemptId) {
  return request(`/attempts/${attemptId}/submit`, {
    method: 'POST',
  });
}

// Permanently deletes an attempt. Resolves with null (204 No Content)
// on success.
export function deleteAttempt(attemptId) {
  return request(`/attempts/${attemptId}`, {
    method: 'DELETE',
  });
}