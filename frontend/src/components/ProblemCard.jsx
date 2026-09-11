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

  const context = Array.isArray(requirements) && requirements.length > 0
    ? requirements[0]
    : 'Design core functional modules, class relationships, and handle robust edge cases.';

  function handleStartPractice() {
    navigate(`/problems/${id}`, { state: { title } });
  }

  const key = difficultyKey(difficulty);
  const cardClass = key ? `cyber-card difficulty-${key}` : 'cyber-card';

  return (
    <article className={cardClass}>
      <div className="cyber-card__glow-bar" />
      <div className="cyber-card__content">
        <div className="cyber-card__top">
          <div className="cyber-card-meta-group">
            <span className="cyber-id">ID #{id}</span>
            <span className={`cyber-badge ${key || 'unrated'}`}>
              {difficultyLabel(difficulty)}
            </span>
          </div>
          <h3 className="cyber-card__title">{title}</h3>
        </div>

        <p className="cyber-card__excerpt">{context}</p>

        <div className="cyber-card__footer">
          <div className="cyber-tags">
            <span className="c-tag">OOP Patterns</span>
            <span className="c-tag">Extensibility</span>
          </div>
          <button
            type="button"
            className="cyber-btn-launch"
            onClick={handleStartPractice}
          >
            <span>Launch Design Studio</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}