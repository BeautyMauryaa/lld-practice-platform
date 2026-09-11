// frontend/src/pages/AttemptDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAttemptById, getProblemById, createAttempt, deleteAttempt } from '../services/api';
import { getStoredLearnerId } from '../services/learner';
import FeedbackReport from '../components/FeedbackReport';

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

function AttemptDetailPage() {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();
  const learnerId = getStoredLearnerId();

  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(null);
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState(null);

  const [tryAgainStatus, setTryAgainStatus] = useState('idle');
  const [tryAgainError, setTryAgainError] = useState(null);

  const [deleteStatus, setDeleteStatus] = useState('idle');
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    document.body.classList.add('theme-problems');
    return () => {
      document.body.classList.remove('theme-problems');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    getAttemptById(attemptId)
      .then(async (fetchedAttempt) => {
        if (cancelled) return;
        setAttempt(fetchedAttempt);
        try {
          const fetchedProblem = await getProblemById(fetchedAttempt.problemId);
          if (cancelled) return;
          setProblem(fetchedProblem);
        } catch {
          if (cancelled) return;
          setProblem(null);
        }
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
  }, [attemptId]);

  const handleTryAgain = async () => {
    if (!attempt || tryAgainStatus === 'creating') return;
    if (!learnerId) {
      setTryAgainError('No learner is set up on this device yet.');
      setTryAgainStatus('error');
      return;
    }

    setTryAgainStatus('creating');
    setTryAgainError(null);

    try {
      await createAttempt(learnerId, attempt.problemId);
      navigate(`/problems/${attempt.problemId}`);
    } catch (err) {
      setTryAgainError(err.message);
      setTryAgainStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!attempt || deleteStatus === 'deleting') return;

    const confirmed = window.confirm('Delete this attempt? This cannot be undone.');
    if (!confirmed) return;

    setDeleteStatus('deleting');
    setDeleteError(null);

    try {
      await deleteAttempt(attemptId);
      navigate('/history');
    } catch (err) {
      setDeleteError(err.message);
      setDeleteStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <main className="page cyber-page practice-page-refined">
        <div className="practice-header-container">
          <Link to="/history" className="back-nav-link">
            ← Back to Attempt History
          </Link>
        </div>
        <p className="state-message">Loading attempt…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="page cyber-page practice-page-refined">
        <div className="practice-header-container">
          <Link to="/history" className="back-nav-link">
            ← Back to Attempt History
          </Link>
        </div>
        <p className="state-message state-message--error">Couldn't load this attempt: {error}.</p>
      </main>
    );
  }

  const submission = attempt.submission || { classes: [], patternsUsed: [], codeStub: '' };
  const isEvaluated = attempt.status === 'evaluated';

  return (
    <main className="page cyber-page practice-page-refined">
      <div className="practice-header-container">
        <div className="attempt-detail-nav-row">
          <Link to="/history" className="back-nav-link">
            ← Back to Attempt History
          </Link>
          <button
            type="button"
            className="btn btn--danger-subtle btn--small"
            onClick={handleDelete}
            disabled={deleteStatus === 'deleting'}
          >
            {deleteStatus === 'deleting' ? 'Deleting…' : 'Delete Attempt'}
          </button>
        </div>

        <div className="practice-title-row">
          <h1>{problem?.title || 'Unknown problem'}</h1>
          <span className={`attempt-status attempt-status--${attempt.status}`}>
            {statusLabel(attempt.status)}
          </span>
        </div>
        <p className="attempt-card__dates">
          Started: {formatDate(attempt.createdAt)}
          {attempt.evaluatedAt && <> · Evaluated: {formatDate(attempt.evaluatedAt)}</>}
        </p>
      </div>

      {deleteError && (
        <p className="state-message state-message--error">
          Couldn't delete this attempt: {deleteError}.
        </p>
      )}

      <section className="attempt-detail-section">
        <h2 className="attempt-detail-section-title">Submitted Design</h2>
        <p className="attempt-detail-subtitle">This is a read-only view of a past attempt.</p>

        {submission.classes.length === 0 ? (
          <p className="state-message">No design was submitted for this attempt.</p>
        ) : (
          <div className="classes-section">
            {submission.classes.map((classData, i) => (
              <div className="class-editor-readonly-card" key={i}>
                <h3 className="class-editor__name">{classData.name}</h3>

                <div className="class-editor__field">
                  <label className="field-label-uppercase">Responsibilities</label>
                  {classData.responsibilities?.length > 0 ? (
                    <ul className="feedback-list">
                      {classData.responsibilities.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="hint-text">None listed.</p>
                  )}
                </div>

                <div className="class-editor__field">
                  <label className="field-label-uppercase">Relationships</label>
                  {classData.relationships?.length > 0 ? (
                    <ul className="feedback-list">
                      {classData.relationships.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="hint-text">None listed.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="patterns-section-readonly">
          <h3 className="sub-section-title">Patterns Used</h3>
          {submission.patternsUsed?.length > 0 ? (
            <ul className="feedback-list">
              {submission.patternsUsed.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="hint-text">None listed.</p>
          )}
        </div>

        {submission.codeStub && (
          <div className="code-stub-section-readonly">
            <h3 className="sub-section-title">Code Stub</h3>
            <pre className="code-stub-input">{submission.codeStub}</pre>
          </div>
        )}
      </section>

      {isEvaluated ? (
        <div className="evaluation-report-wrapper">
          <FeedbackReport feedback={attempt.feedback} />

          <div className="post-evaluation-actions">
            <button
              type="button"
              className="cyber-btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleTryAgain}
              disabled={tryAgainStatus === 'creating'}
            >
              {tryAgainStatus === 'creating' ? 'Starting new attempt…' : 'Try Again'}
            </button>
          </div>
          {tryAgainError && (
            <p className="state-message state-message--error" style={{ marginTop: '12px' }}>
              Couldn't start a new attempt: {tryAgainError}
            </p>
          )}
        </div>
      ) : (
        <p className="state-message" style={{ textAlign: 'center' }}>
          {attempt.status === 'failed'
            ? 'Evaluation failed for this attempt.'
            : "This attempt hasn't been evaluated yet."}
        </p>
      )}
    </main>
  );
}

export default AttemptDetailPage;