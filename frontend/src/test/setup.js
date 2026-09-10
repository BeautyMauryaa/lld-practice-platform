import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Every test starts with a clean localStorage — several pages/services
// (learner.js, PracticePage, AttemptHistoryPage) read/write
// 'lld_learner_id' from it, and state leaking between tests would make
// tests order-dependent.
afterEach(() => {
  window.localStorage.clear();
});