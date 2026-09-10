import { useNavigate } from 'react-router-dom';

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

function difficultyLabel(difficulty) {
  if (!difficulty) return 'Unrated';
  return DIFFICULTY_LABELS[difficulty.toLowerCase()] || difficulty;
}

function difficultyKey(difficulty) {
  const key = (difficulty || '').toLowerCase();
  return DIFFICULTY_LABELS[key] ? key : null;
}

export default function ProblemCard({ problem }) {
  const navigate = useNavigate();
  const { id, title, difficulty, requirements } = problem;

  // A short, single-line context excerpt rather than the full
  // requirements list — the full list belongs on the detail/attempt
  // screen (Step 8B), not the picker card.
  const context = Array.isArray(requirements) && requirements.length > 0
    ? requirements[0]
    : null;

  function handleStartPractice() {
    navigate(`/problems/${id}`, { state: { title } });
  }

  const key = difficultyKey(difficulty);
  const cardClass = key ? `problem-card difficulty-${key}` : 'problem-card';

  return (
    <article className={cardClass}>
      <div className="problem-card__spine" />
      <div className="problem-card__body">
        <div className="problem-card__heading">
          <h3 className="problem-card__title">{title}</h3>
          <span className="problem-card__difficulty">{difficultyLabel(difficulty)}</span>
        </div>

        {context && <p className="problem-card__excerpt">{context}</p>}

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleStartPractice}
        >
          Start Practice
        </button>
      </div>
    </article>
  );
}