import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProblemById, createAttempt, saveAttemptDraft, submitAttempt } from '../services/api';
import { getStoredLearnerId, registerLearner } from '../services/learner';
import ClassEditor from '../components/ClassEditor';
import ListFieldEditor from '../components/ListFieldEditor';
import FeedbackReport from '../components/FeedbackReport';

const EMPTY_CLASS = () => ({ name: '', responsibilities: [''], relationships: [''] });
const EMPTY_FORM = () => ({ classes: [EMPTY_CLASS()], patternsUsed: [''], codeStub: '' });

// Turns the editable form shape (which keeps single empty rows around so
// the inputs don't disappear as you type) into the trimmed payload shape
// the backend expects — no empty rows sent.
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
  const [problemStatus, setProblemStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [problemError, setProblemError] = useState(null);

  // null until we have a real learnerId — either reused from localStorage
  // or created just now via the name form below.
  const [learnerId, setLearnerId] = useState(() => getStoredLearnerId());
  const [learnerNameInput, setLearnerNameInput] = useState('');
  const [learnerCreationStatus, setLearnerCreationStatus] = useState('idle'); // 'idle' | 'creating' | 'error'
  const [learnerCreationError, setLearnerCreationError] = useState(null);

  const [attemptId, setAttemptId] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState('creating'); // 'creating' | 'ready' | 'error'
  const [attemptError, setAttemptError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null);

  // Submit-for-evaluation is a separate action/status from Save Draft —
  // they hit different endpoints and have different effects on the
  // attempt's lifecycle (draft -> evaluating -> evaluated).
  const [evaluationStatus, setEvaluationStatus] = useState('idle'); // 'idle' | 'submitting' | 'evaluated' | 'error'
  const [evaluationError, setEvaluationError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  // Synchronous guard against duplicate submissions from repeated/rapid
  // clicks — state updates alone aren't guaranteed to re-render fast
  // enough to disable the button before a second click lands.
  const submitInFlight = useRef(false);

  // "Try Again" while still on this page (i.e. right after seeing
  // feedback, without navigating away and back). Separate from the
  // cross-page Try Again on AttemptHistoryPage/AttemptDetailPage, which
  // works by navigating here fresh and letting the effect below create
  // the attempt as it normally does on mount.
  const [tryAgainStatus, setTryAgainStatus] = useState('idle'); // 'idle' | 'creating' | 'error'
  const [tryAgainError, setTryAgainError] = useState(null);

  // Guards against creating a duplicate attempt when this effect fires
  // twice for the same problem+learner (React StrictMode double-invokes
  // effects in development). A ref survives re-renders without needing
  // any global state — it just remembers "we already started this".
  const creationStartedFor = useRef(null);

  // Problem details load independently of learner identity, so the
  // learner can read the problem while entering their name.
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

  // Attempt creation only starts once a learnerId exists.
  useEffect(() => {
    if (!learnerId) return;

    let cancelled = false;
    // True only while THIS invocation's own attempt-creation call is in
    // flight. Lets the cleanup below tell "cancelled before finishing"
    // (StrictMode's dev-only double-invoke) apart from a real unmount
    // after creation already finished.
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
        // This invocation started attempt creation but got cleaned up
        // before it resolved (React StrictMode's dev-only mount ->
        // cleanup -> re-mount cycle). Release the guard so the
        // surviving invocation actually retries instead of assuming
        // creation already started.
        creationStartedFor.current = null;
      }
    };
  }, [learnerId, problemId]);

  // ---- Learner name form ----

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

  // ---- Class list handlers ----

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

  // ---- Save draft ----

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

  // ---- Submit for evaluation ----
  // Reuses the same validation as Save Draft (only "at least one named
  // class" is required — responsibilities/relationships/patterns/codeStub
  // stay optional on purpose).
  //
  // Submit-for-evaluation must persist the CURRENT form state first: the
  // backend evaluates whatever is already saved on the attempt document,
  // not whatever the frontend happens to be holding in React state. So
  // this always does a save (identical to Save Draft's own payload) right
  // before calling submitAttempt — the user shouldn't have to remember to
  // click "Save Draft" separately first.

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
      // Saving failed — never call submitAttempt against stale/old
      // data. Form state is untouched either way.
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
      // The backend already sanitizes this message (see
      // attemptController's submitAttempt error handling) — it never
      // leaks provider/internal details, so it's safe to show as-is,
      // same as the other error messages on this page.
      setEvaluationError(err.message);
      setEvaluationStatus('error');
    } finally {
      submitInFlight.current = false;
    }
  };

  // ---- Try Again (same page) ----
  // Creates a brand-new draft attempt for this same problem and resets
  // the form/feedback/evaluation state so the learner can design again
  // from scratch, without leaving PracticePage. The old evaluated
  // attempt is untouched server-side — this only ever POSTs a new one.

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
      <main className="page">
        <p className="state-message">Loading problem…</p>
      </main>
    );
  }

  if (problemStatus === 'error') {
    return (
      <main className="page">
        <p className="state-message state-message--error">
          Couldn't load this problem: {problemError}.
        </p>
      </main>
    );
  }

  const canEdit = attemptStatus === 'ready';

  return (
    <main className="page practice-page">
      <section className="problem-details">
        <h1>{problem.title}</h1>
        <p className="problem-details__difficulty">
          Difficulty: <strong>{problem.difficulty}</strong>
        </p>

        <div className="problem-details__block">
          <h2>Requirements</h2>
          <ul>
            {problem.requirements?.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>

        <div className="problem-details__block">
          <h2>Constraints</h2>
          <ul>
            {problem.constraints?.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {!learnerId ? (
        <section className="learner-gate">
          <h2>Before you start</h2>
          <p className="hint-text">Enter a name so we can track your attempts.</p>
          <form className="learner-gate__form" onSubmit={handleLearnerNameSubmit}>
            <input
              type="text"
              value={learnerNameInput}
              onChange={(e) => setLearnerNameInput(e.target.value)}
              placeholder="Your name"
              disabled={learnerCreationStatus === 'creating'}
            />
            <button type="submit" className="btn btn--primary" disabled={learnerCreationStatus === 'creating'}>
              {learnerCreationStatus === 'creating' ? 'Starting…' : 'Continue'}
            </button>
          </form>
          {learnerCreationError && (
            <p className="state-message state-message--error">{learnerCreationError}</p>
          )}
        </section>
      ) : (
        <section className="design-form">
          <h2>Your Design</h2>

          {attemptStatus === 'creating' && (
            <p className="state-message">Setting up your attempt…</p>
          )}
          {attemptStatus === 'error' && (
            <p className="state-message state-message--error">
              Couldn't start this attempt: {attemptError}.
            </p>
          )}

          <fieldset disabled={!canEdit} className="design-form__fieldset">
            <div className="classes-section">
              {form.classes.map((classData, index) => (
                <ClassEditor
                  key={index}
                  classData={classData}
                  onUpdate={(updated) => updateClass(index, updated)}
                  onRemove={() => removeClass(index)}
                />
              ))}
              <button type="button" className="btn btn--secondary" onClick={addClass}>
                + Add Class
              </button>
            </div>

            <div className="patterns-section">
              <h3>Patterns Used</h3>
              <p className="hint-text">Optional — describe any patterns you chose, in your own words.</p>
              <ListFieldEditor
                items={form.patternsUsed}
                onChange={(patternsUsed) => setForm((f) => ({ ...f, patternsUsed }))}
                placeholder="e.g. Strategy Pattern for spot allocation"
                addLabel="+ Add Pattern"
                ariaLabel="Pattern used"
              />
            </div>

            <div className="code-stub-section">
              <h3>Optional Code Stub</h3>
              <textarea
                className="code-stub-input"
                rows={6}
                placeholder={'class ParkingLot {\n  // your design\n}'}
                value={form.codeStub}
                onChange={(e) => setForm((f) => ({ ...f, codeStub: e.target.value }))}
              />
            </div>
          </fieldset>

          {validationError && <p className="state-message state-message--error">{validationError}</p>}
          {saveStatus === 'error' && (
            <p className="state-message state-message--error">Couldn't save: {saveError}</p>
          )}
          {saveStatus === 'saved' && <p className="state-message state-message--success">Draft saved.</p>}
          {evaluationStatus === 'error' && (
            <p className="state-message state-message--error">Couldn't evaluate: {evaluationError}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSaveDraft}
              disabled={!canEdit || saveStatus === 'saving' || evaluationStatus === 'evaluated'}
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
            </button>

            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleSubmitForEvaluation}
              disabled={!canEdit || evaluationStatus === 'submitting' || evaluationStatus === 'evaluated'}
            >
              {evaluationStatus === 'submitting' ? 'Evaluating…' : 'Submit for Evaluation'}
            </button>
          </div>

          {feedback && (
            <>
              <FeedbackReport feedback={feedback} />

              <div className="post-evaluation-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleTryAgain}
                  disabled={tryAgainStatus === 'creating'}
                >
                  {tryAgainStatus === 'creating' ? 'Starting new attempt…' : 'Try Again'}
                </button>
                <Link to="/history" className="btn btn--secondary">
                  View Attempt History
                </Link>
              </div>
              {tryAgainError && (
                <p className="state-message state-message--error">
                  Couldn't start a new attempt: {tryAgainError}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default PracticePage;