// frontend/src/pages/AttemptHistoryPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAttempts, getProblems, deleteAttempt } from '../services/api';
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

function enrichAttempts(attemptList, problems) {
  const problemsById = new Map(problems.map((p) => [p.id, p]));
  return attemptList.map((attempt) => ({
    ...attempt,
    problem: problemsById.get(attempt.problemId),
  }));
}

function AttemptHistoryPage() {
  const [learnerId] = useState(() => getStoredLearnerId());
  const [status, setStatus] = useState('loading');
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    document.body.classList.add('theme-problems');
    return () => {
      document.body.classList.remove('theme-problems');
    };
  }, []);

  useEffect(() => {
    if (!learnerId) return;

    let cancelled = false;
    setStatus('loading');

    Promise.all([getAttempts(learnerId), getProblems()])
      .then(([attemptList, problems]) => {
        if (cancelled) return;
        const enriched = enrichAttempts(attemptList, problems);
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

  const handleDelete = async (attemptId, problemTitle) => {
    const confirmed = window.confirm(
      `Delete this attempt${problemTitle ? ` for "${problemTitle}"` : ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(attemptId);
    setDeleteError(null);

    try {
      await deleteAttempt(attemptId);
      setAttempts((current) => current.filter((a) => a.id !== attemptId));
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!learnerId) {
    return (
      <main className="page cyber-page practice-page-refined">
        <div className="practice-header-container">
          <Link to="/" className="back-nav-link">
            ← Back to Arena
          </Link>
          <div className="practice-title-row">
            <h1>Attempt History</h1>
          </div>
        </div>
        <p className="state-message">
          You haven't started any problems yet.{' '}
          <Link to="/">Pick a problem</Link> to create your first attempt.
        </p>
      </main>
    );
  }

  return (
    <main className="page cyber-page practice-page-refined">
      <div className="practice-header-container">
        <Link to="/" className="back-nav-link">
          ← Back to Arena
        </Link>
        <div className="practice-title-row">
          <h1>Attempt History</h1>
        </div>
        <p className="workspace-subtitle">Review your past attempts and revisit feedback.</p>
      </div>

      {status === 'loading' && <p className="state-message">Loading your attempts…</p>}

      {status === 'error' && (
        <p className="state-message state-message--error">
          Couldn't load your attempt history: {error}. Check that the backend is running and try refreshing.
        </p>
      )}

      {status === 'ready' && attempts.length === 0 && (
        <p className="state-message">
          No attempts yet. <Link to="/">Start a problem</Link> to create your first one.
        </p>
      )}

      {deleteError && (
        <p className="state-message state-message--error">
          Couldn't delete that attempt: {deleteError}.
        </p>
      )}

      {status === 'ready' && attempts.length > 0 && (
        <ul className="attempt-list">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="attempt-row">
              <div className="attempt-card">
                <div className="attempt-card__heading">
                  <h3 className="attempt-card__title">
                    {attempt.problem?.title || 'Unknown problem'}
                  </h3>
                  <span className={`attempt-status attempt-status--${attempt.status}`}>
                    {statusLabel(attempt.status)}
                  </span>
                </div>
                <p className="attempt-card__dates">
                  Started: {formatDate(attempt.createdAt)}
                  {attempt.evaluatedAt && <> · Evaluated: {formatDate(attempt.evaluatedAt)}</>}
                </p>
                {attempt.status === 'evaluated' && (
                  <div className="attempt-feedback-indicator">
                    <span className="feedback-badge">Feedback available</span>
                  </div>
                )}
              </div>
              <div className="attempt-row__actions">
                <Link to={`/attempts/${attempt.id}`} className="btn btn--secondary btn--small view-attempt-btn">
                  View Attempt
                </Link>
                <button
                  type="button"
                  className="btn btn--danger-subtle btn--small attempt-row__delete"
                  onClick={() => handleDelete(attempt.id, attempt.problem?.title)}
                  disabled={deletingId === attempt.id}
                  aria-label={`Delete attempt for ${attempt.problem?.title || 'this problem'}`}
                >
                  {deletingId === attempt.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default AttemptHistoryPage;