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
  const cardClass = key ? `problem-card problem-card--${key}` : 'problem-card';
  const badgeClass = key ? `difficulty difficulty--${key}` : 'difficulty';

  return (
    <article className={cardClass}>
      <div className="problem-card__header">
        <h3 className="problem-card__title">{title}</h3>
        <span className={badgeClass}>{difficultyLabel(difficulty)}</span>
      </div>

      {context && <p className="problem-card__context">{context}</p>}

      <button
        type="button"
        className="problem-card__action"
        onClick={handleStartPractice}
      >
        Start Practice
      </button>
    </article>
  );
}