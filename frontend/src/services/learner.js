// Minimal learner identity bootstrap.
//
// The roadmap doesn't have a dedicated sign-in/identity step yet, but
// POST /api/attempts requires a real learnerId. This is the smallest
// thing that works without adding auth or global state: reuse a
// previously-created learner's id from localStorage if one exists,
// otherwise ask for a name once and create a Learner via the existing
// POST /api/learners endpoint.
//
// This is a placeholder for a real identity step later — not a design
// decision to keep long-term, just an unblock.

import { createLearner } from './api';

const STORAGE_KEY = 'lld_learner_id';

export async function getOrCreateLearnerId() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  let name = window.prompt('What should we call you? (used to track your attempts)');
  if (!name || !name.trim()) {
    name = 'Learner';
  }

  const learner = await createLearner(name.trim());
  localStorage.setItem(STORAGE_KEY, learner.id);
  return learner.id;
}