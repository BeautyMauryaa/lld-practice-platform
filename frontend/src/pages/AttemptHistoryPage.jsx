import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAttempts, getAttemptById, getProblems } from '../services/api';
import { getStoredLearnerId } from '../services/learner';

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  evaluating: 'Evaluating',
  evaluated: 'Evaluated',
  failed: 'Evaluation failed',
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

// The list endpoint (GET /api/attempts?learnerId=) intentionally returns
// only id/problemId/status/dates — no problem title, no feedback. This
// page joins that against GET /api/problems (for titles) and, for
// evaluated attempts only, a per-attempt GET /api/attempts/:id (for a
// short feedback summary), rather than asking the backend to change
// shape. Attempt counts for one learner are small enough for this to be
// a non-issue at this app's scale.
async function enrichAttempts(attemptList, problems) {
  const problemsById = new Map(problems.map((p) => [p.id, p]));

  return Promise.all(
    attemptList.map(async (attempt) => {
      let summary = null;
      if (attempt.status === 'evaluated') {
        try {
          const full = await getAttemptById(attempt.id);
          summary = full.feedback?.summary || null;
        } catch {
          // Non-fatal — the row still renders, just without a summary.
          summary = null;
        }
      }
      return { ...attempt, problem: problemsById.get(attempt.problemId), summary };
    })
  );
}

function AttemptHistoryPage() {
  const [learnerId] = useState(() => getStoredLearnerId());
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learnerId) return;

    let cancelled = false;
    setStatus('loading');

    Promise.all([getAttempts(learnerId), getProblems()])
      .then(([attemptList, problems]) => enrichAttempts(attemptList, problems))
      .then((enriched) => {
        if (cancelled) return;
        // Most recent first.
        enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAttempts(enriched);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [learnerId]);

  if (!learnerId) {
    return (
      <main className="page">
        <header className="page__header">
          <h1>Attempt History</h1>
        </header>
        <p className="state-message">
          You haven't started any problems yet.{' '}
          <Link to="/">Pick a problem</Link> to create your first attempt.
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>Attempt History</h1>
        <p className="page__subtitle">Review past attempts, or open one to try that problem again.</p>
      </header>

      {status === 'loading' && <p className="state-message">Loading your attempts…</p>}

      {status === 'error' && (
        <p className="state-message state-message--error">
          Couldn't load your attempt history: {error}. Check that the backend is running and try
          refreshing.
        </p>
      )}

      {status === 'ready' && attempts.length === 0 && (
        <p className="state-message">
          No attempts yet. <Link to="/">Start a problem</Link> to create your first one.
        </p>
      )}

      {status === 'ready' && attempts.length > 0 && (
        <ul className="attempt-list">
          {attempts.map((attempt) => (
            <li key={attempt.id}>
              <Link to={`/attempts/${attempt.id}`} className="attempt-card">
                <div className="attempt-card__heading">
                  <h3 className="attempt-card__title">
                    {attempt.problem?.title || 'Unknown problem'}
                  </h3>
                  <span className={`attempt-status attempt-status--${attempt.status}`}>
                    {statusLabel(attempt.status)}
                  </span>
                </div>
                <p className="attempt-card__dates">
                  Started {formatDate(attempt.createdAt)}
                  {attempt.evaluatedAt && <> · Evaluated {formatDate(attempt.evaluatedAt)}</>}
                </p>
                {attempt.summary && <p className="attempt-card__summary">{attempt.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default AttemptHistoryPage;