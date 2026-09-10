// Minimal learner identity bootstrap.
//
// The roadmap doesn't have a dedicated sign-in/identity step yet, but
// POST /api/attempts requires a real learnerId. This is the smallest
// thing that works without adding auth or global state: reuse a
// previously-created learner's id from localStorage if one exists,
// otherwise let the page collect a name through its own form and call
// registerLearner() once via the existing POST /api/learners endpoint.
//
// This is a placeholder for a real identity step later — not a design
// decision to keep long-term, just an unblock. Previously this used
// window.prompt() to collect the name; that's not supported in every
// environment (e.g. VS Code's integrated browser), so the name is now
// collected via a normal in-page form — see the learner-gate section
// in PracticePage.jsx.

import { createLearner } from './api';

const STORAGE_KEY = 'lld_learner_id';

// Synchronous, side-effect-free read of any learnerId we already have.
// Returns null if the learner hasn't registered a name yet.
export function getStoredLearnerId() {
  return localStorage.getItem(STORAGE_KEY);
}

// Creates a Learner via the existing POST /api/learners endpoint and
// persists the id so future visits skip the name form. Returns the new
// learnerId.
export async function registerLearner(name) {
  const learner = await createLearner(name);
  localStorage.setItem(STORAGE_KEY, learner.id);
  return learner.id;
}