import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProblemById, createAttempt, saveAttemptDraft, submitAttempt } from '../services/api';
import { getStoredLearnerId, registerLearner } from '../services/learner';
import ClassEditor from '../components/ClassEditor';
import ListFieldEditor from '../components/ListFieldEditor';
import FeedbackReport from '../components/FeedbackReport';

const EMPTY_CLASS = () => ({ name: '', responsibilities: [''], relationships: [''] });
const EMPTY_FORM = () => ({ classes: [EMPTY_CLASS()], patternsUsed: [''], codeStub: '' });

function buildSubmissionPayload(form) {
  return {
    classes: form.classes.map((c) => ({
      name: c.name.trim(),
      responsibilities: c.responsibilities.map((r) => r.trim()).filter(Boolean),
      relationships: c.relationships.map((r) => r.trim()).filter(Boolean),
    })),
    patternsUsed: form.patternsUsed.map((p) => p.trim()).filter(Boolean),
    codeStub: form.codeStub,
  };
}

function validateForm(form) {
  if (form.classes.length === 0) {
    return 'Add at least one class before saving.';
  }
  if (form.classes.some((c) => !c.name.trim())) {
    return 'Every class needs a name before saving.';
  }
  return null;
}

function PracticePage() {
  const { id: problemId } = useParams();

  const [problem, setProblem] = useState(null);
  const [problemStatus, setProblemStatus] = useState('loading');
  const [problemError, setProblemError] = useState(null);

  const [learnerId, setLearnerId] = useState(() => getStoredLearnerId());
  const [learnerNameInput, setLearnerNameInput] = useState('');
  const [learnerCreationStatus, setLearnerCreationStatus] = useState('idle');
  const [learnerCreationError, setLearnerCreationError] = useState(null);

  const [attemptId, setAttemptId] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState('creating');
  const [attemptError, setAttemptError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState(null);

  const [evaluationStatus, setEvaluationStatus] = useState('idle');
  const [evaluationError, setEvaluationError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const submitInFlight = useRef(false);

  const [tryAgainStatus, setTryAgainStatus] = useState('idle');
  const [tryAgainError, setTryAgainError] = useState(null);

  const creationStartedFor = useRef(null);

  useEffect(() => {
    document.body.classList.add('theme-problems');
    return () => {
      document.body.classList.remove('theme-problems');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProblemStatus('loading');
    getProblemById(problemId)
      .then((data) => {
        if (cancelled) return;
        setProblem(data);
        setProblemStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setProblemError(err.message);
        setProblemStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  useEffect(() => {
    if (!learnerId) return;

    let cancelled = false;
    let creationInFlight = false;

    const key = `${learnerId}:${problemId}`;
    if (creationStartedFor.current !== key) {
      creationStartedFor.current = key;
      creationInFlight = true;
      setAttemptStatus('creating');

      createAttempt(learnerId, problemId)
        .then((attempt) => {
          creationInFlight = false;
          if (cancelled) return;
          setAttemptId(attempt.id);
          setAttemptStatus('ready');
        })
        .catch((err) => {
          creationInFlight = false;
          if (cancelled) return;
          setAttemptError(err.message);
          setAttemptStatus('error');
        });
    }

    return () => {
      cancelled = true;
      if (creationInFlight) {
        creationStartedFor.current = null;
      }
    };
  }, [learnerId, problemId]);

  const handleLearnerNameSubmit = async (e) => {
    e.preventDefault();
    const trimmed = learnerNameInput.trim();
    if (!trimmed) {
      setLearnerCreationError('Please enter a name to continue.');
      return;
    }
    setLearnerCreationStatus('creating');
    setLearnerCreationError(null);
    try {
      const id = await registerLearner(trimmed);
      setLearnerId(id);
    } catch (err) {
      setLearnerCreationError(err.message);
      setLearnerCreationStatus('error');
    }
  };

  const addClass = () => {
    setForm((f) => ({ ...f, classes: [...f.classes, EMPTY_CLASS()] }));
  };

  const removeClass = (index) => {
    setForm((f) => ({ ...f, classes: f.classes.filter((_, i) => i !== index) }));
  };

  const updateClass = (index, updatedClass) => {
    setForm((f) => ({
      ...f,
      classes: f.classes.map((c, i) => (i === index ? updatedClass : c)),
    }));
  };

  const handleSaveDraft = async () => {
    const message = validateForm(form);
    if (message) {
      setValidationError(message);
      setSaveStatus('idle');
      return;
    }
    setValidationError(null);
    setSaveStatus('saving');
    setSaveError(null);

    try {
      const payload = buildSubmissionPayload(form);
      await saveAttemptDraft(attemptId, payload);
      setSaveStatus('saved');
    } catch (err) {
      setSaveError(err.message);
      setSaveStatus('error');
    }
  };

  const handleSubmitForEvaluation = async () => {
    if (submitInFlight.current) return;

    const message = validateForm(form);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);

    submitInFlight.current = true;
    setEvaluationStatus('submitting');
    setEvaluationError(null);

    const payload = buildSubmissionPayload(form);

    try {
      await saveAttemptDraft(attemptId, payload);
    } catch (err) {
      setEvaluationError(`Couldn't save your submission before evaluating: ${err.message}`);
      setEvaluationStatus('error');
      submitInFlight.current = false;
      return;
    }

    try {
      const evaluatedAttempt = await submitAttempt(attemptId);
      setFeedback(evaluatedAttempt.feedback);
      setEvaluationStatus('evaluated');
    } catch (err) {
      setEvaluationError(err.message);
      setEvaluationStatus('error');
    } finally {
      submitInFlight.current = false;
    }
  };

  const handleTryAgain = async () => {
    if (!learnerId || tryAgainStatus === 'creating') return;

    setTryAgainStatus('creating');
    setTryAgainError(null);

    try {
      const newAttempt = await createAttempt(learnerId, problemId);
      setAttemptId(newAttempt.id);
      setAttemptStatus('ready');
      setForm(EMPTY_FORM());
      setFeedback(null);
      setEvaluationStatus('idle');
      setEvaluationError(null);
      setValidationError(null);
      setSaveStatus('idle');
      setSaveError(null);
      setTryAgainStatus('idle');
    } catch (err) {
      setTryAgainError(err.message);
      setTryAgainStatus('error');
    }
  };

  if (problemStatus === 'loading') {
    return (
      <main className="page cyber-page">
        <div className="state-loading-container">
          <div className="cyber-spinner"></div>
          <p className="state-message">Loading problem configuration…</p>
        </div>
      </main>
    );
  }

  if (problemStatus === 'error') {
    return (
      <main className="page cyber-page">
        <p className="state-message state-message--error">
          Couldn't load this problem: {problemError}.
        </p>
      </main>
    );
  }

  const canEdit = attemptStatus === 'ready';

  return (
    <main className="page cyber-page practice-page-refined">
      <div className="practice-header-container">
        <Link to="/" className="back-nav-link">
          ← Back to Arena
        </Link>
        <div className="practice-title-row">
          <h1>{problem.title}</h1>
          <span className={`cyber-badge ${(problem.difficulty || '').toLowerCase()}`}>
            {problem.difficulty}
          </span>
        </div>
      </div>

      <div className="practice-layout-grid">
        <aside className="problem-specs-panel">
          <div className="spec-card">
            <h2>Requirements</h2>
            <ul>
              {problem.requirements?.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="spec-card">
            <h2>Constraints</h2>
            <ul>
              {problem.constraints?.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="design-workspace-panel">
          {!learnerId ? (
            <div className="cyber-card learner-gate-card">
              <h2>Before You Start</h2>
              <p className="hint-text">Enter your name to track this design attempt in the system.</p>
              <form className="learner-gate__form" onSubmit={handleLearnerNameSubmit}>
                <input
                  type="text"
                  className="cyber-text-input"
                  value={learnerNameInput}
                  onChange={(e) => setLearnerNameInput(e.target.value)}
                  placeholder="Your Name / Alias"
                  disabled={learnerCreationStatus === 'creating'}
                />
                <button type="submit" className="cyber-btn-launch" disabled={learnerCreationStatus === 'creating'}>
                  {learnerCreationStatus === 'creating' ? 'Initializing…' : 'Start Workspace'}
                </button>
              </form>
              {learnerCreationError && (
                <p className="state-message state-message--error">{learnerCreationError}</p>
              )}
            </div>
          ) : (
            <div className="workspace-inner-content">
              <div className="workspace-section-header">
                <h2>Design Workspace</h2>
                <span className="workspace-subtitle">Define classes, relationships, and design patterns</span>
              </div>

              {attemptStatus === 'creating' && (
                <div className="state-loading-container compact">
                  <div className="cyber-spinner"></div>
                  <p className="state-message">Setting up your design attempt…</p>
                </div>
              )}
              {attemptStatus === 'error' && (
                <p className="state-message state-message--error">
                  Couldn't start this attempt: {attemptError}.
                </p>
              )}

              <fieldset disabled={!canEdit} className="design-form__fieldset">
                <div className="workspace-card-block classes-block">
                  <div className="block-title-bar">
                    <h3>Classes & Responsibilities</h3>
                    <span className="block-hint">Model your OOP structure</span>
                  </div>
                  {form.classes.map((classData, index) => (
                    <ClassEditor
                      key={index}
                      classData={classData}
                      onUpdate={(updated) => updateClass(index, updated)}
                      onRemove={() => removeClass(index)}
                    />
                  ))}
                  <button type="button" className="cyber-btn-secondary" onClick={addClass}>
                    + Add Class
                  </button>
                </div>

                <div className="workspace-card-block patterns-block">
                  <div className="block-title-bar">
                    <h3>Patterns Used</h3>
                    <span className="block-hint">Optional — document architectural patterns</span>
                  </div>
                  <ListFieldEditor
                    items={form.patternsUsed}
                    onChange={(patternsUsed) => setForm((f) => ({ ...f, patternsUsed }))}
                    placeholder="e.g. Strategy Pattern for spot allocation"
                    addLabel="+ Add Pattern"
                    ariaLabel="Pattern used"
                  />
                </div>

                <div className="workspace-card-block codepub-block">
                  <div className="block-title-bar">
                    <h3>Optional Code Stub</h3>
                    <span className="block-hint">Draft skeleton implementation</span>
                  </div>
                  <textarea
                    className="cyber-code-textarea"
                    rows={8}
                    placeholder={'class ParkingLot {\n  // your design implementation\n}'}
                    value={form.codeStub}
                    onChange={(e) => setForm((f) => ({ ...f, codeStub: e.target.value }))}
                  />
                </div>
              </fieldset>

              {validationError && <p className="state-message state-message--error">{validationError}</p>}
              {saveStatus === 'error' && (
                <p className="state-message state-message--error">Couldn't save: {saveError}</p>
              )}
              {saveStatus === 'saved' && <p className="state-message state-message--success">Draft saved successfully.</p>}
              {evaluationStatus === 'error' && (
                <p className="state-message state-message--error">Couldn't evaluate: {evaluationError}</p>
              )}

              <div className="form-actions-bar">
                <button
                  type="button"
                  className="cyber-btn-secondary"
                  onClick={handleSaveDraft}
                  disabled={!canEdit || saveStatus === 'saving' || evaluationStatus === 'evaluated'}
                >
                  {saveStatus === 'saving' ? 'Saving Draft…' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  className="cyber-btn-launch"
                  onClick={handleSubmitForEvaluation}
                  disabled={!canEdit || evaluationStatus === 'submitting' || evaluationStatus === 'evaluated'}
                >
                  {evaluationStatus === 'submitting' ? 'Evaluating Design…' : 'Submit for Evaluation'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {feedback && (
        <div className="feedback-container-wrapper">
          <FeedbackReport feedback={feedback} />

          <div className="post-evaluation-actions">
            <button
              type="button"
              className="cyber-btn-secondary"
              onClick={handleTryAgain}
              disabled={tryAgainStatus === 'creating'}
            >
              {tryAgainStatus === 'creating' ? 'Starting new attempt…' : 'Try Again'}
            </button>
            <Link to="/history" className="cyber-btn-secondary link-btn">
              View Attempt History
            </Link>
          </div>
          {tryAgainError && (
            <p className="state-message state-message--error">
              Couldn't start a new attempt: {tryAgainError}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

export default PracticePage;