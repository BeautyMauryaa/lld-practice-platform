import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAttemptById, getProblemById, createAttempt } from '../services/api';
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

  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [attempt, setAttempt] = useState(null);
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState(null);

  const [tryAgainStatus, setTryAgainStatus] = useState('idle'); // 'idle' | 'creating' | 'error'
  const [tryAgainError, setTryAgainError] = useState(null);

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
          // Non-fatal — the attempt itself still renders without a title.
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

  // Creates a brand-new draft attempt for the same problem and navigates
  // to PracticePage for it. This attempt (and its feedback) is left
  // exactly as-is — nothing here ever writes back to it.
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

  if (status === 'loading') {
    return (
      <main className="page">
        <p className="state-message">Loading attempt…</p>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="page">
        <p className="state-message state-message--error">Couldn't load this attempt: {error}.</p>
      </main>
    );
  }

  const submission = attempt.submission || { classes: [], patternsUsed: [], codeStub: '' };
  const isEvaluated = attempt.status === 'evaluated';

  return (
    <main className="page practice-page">
      <p className="hint-text">
        <Link to="/history">← Back to Attempt History</Link>
      </p>

      <section className="problem-details">
        <div className="attempt-card__heading">
          <h1>{problem?.title || 'Unknown problem'}</h1>
          <span className={`attempt-status attempt-status--${attempt.status}`}>
            {statusLabel(attempt.status)}
          </span>
        </div>
        <p className="attempt-card__dates">
          Started {formatDate(attempt.createdAt)}
          {attempt.evaluatedAt && <> · Evaluated {formatDate(attempt.evaluatedAt)}</>}
        </p>
      </section>

      <section className="design-form">
        <h2>Submitted Design</h2>
        <p className="hint-text">This is a read-only view of a past attempt.</p>

        {submission.classes.length === 0 ? (
          <p className="state-message">No design was submitted for this attempt.</p>
        ) : (
          <div className="classes-section">
            {submission.classes.map((classData, i) => (
              <div className="class-editor" key={i}>
                <h3 className="class-editor__name class-editor__name--readonly">{classData.name}</h3>

                <div className="class-editor__field">
                  <label>Responsibilities</label>
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
                  <label>Relationships</label>
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

        <div className="patterns-section">
          <h3>Patterns Used</h3>
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
          <div className="code-stub-section">
            <h3>Code Stub</h3>
            <pre className="code-stub-input">{submission.codeStub}</pre>
          </div>
        )}
      </section>

      {isEvaluated ? (
        <>
          <FeedbackReport feedback={attempt.feedback} />

          <div className="post-evaluation-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleTryAgain}
              disabled={tryAgainStatus === 'creating'}
            >
              {tryAgainStatus === 'creating' ? 'Starting new attempt…' : 'Try Again'}
            </button>
          </div>
          {tryAgainError && (
            <p className="state-message state-message--error">
              Couldn't start a new attempt: {tryAgainError}
            </p>
          )}
        </>
      ) : (
        <p className="state-message">
          {attempt.status === 'failed'
            ? 'Evaluation failed for this attempt.'
            : "This attempt hasn't been evaluated yet."}
        </p>
      )}
    </main>
  );
}

export default AttemptDetailPage;