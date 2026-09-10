import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProblemById, createAttempt, saveAttemptDraft } from '../services/api';
import { getOrCreateLearnerId } from '../services/learner';
import ClassEditor from '../components/ClassEditor';
import ListFieldEditor from '../components/ListFieldEditor';

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

  const [attemptId, setAttemptId] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState('creating'); // 'creating' | 'ready' | 'error'
  const [attemptError, setAttemptError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null);

  // Guards against creating a duplicate attempt when this effect fires
  // twice for the same problemId (React StrictMode double-invokes effects
  // in development). A ref survives re-renders without needing any global
  // state — it just remembers "we already started this for this id".
  const creationStartedForId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // True only while THIS invocation's own attempt-creation call is
    // in flight. Lets the cleanup below tell "cancelled before
    // finishing" (StrictMode's dev-only double-invoke) apart from a
    // real unmount after creation already finished.
    let creationInFlight = false;

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

    if (creationStartedForId.current !== problemId) {
      creationStartedForId.current = problemId;
      creationInFlight = true;
      setAttemptStatus('creating');

      getOrCreateLearnerId()
        .then((learnerId) => createAttempt(learnerId, problemId))
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
        creationStartedForId.current = null;
      }
    };
  }, [problemId]);

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

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleSaveDraft}
          disabled={!canEdit || saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
        </button>
      </section>
    </main>
  );
}

export default PracticePage;