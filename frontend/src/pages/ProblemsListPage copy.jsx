import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProblems } from '../services/api';
import ProblemCard from '../components/ProblemCard';

function ProblemsListPage() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProblems()
      .then((data) => {
        setProblems(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const handleStart = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1>LLD Practice</h1>
        <p className="page__subtitle">
          Pick a problem, design it your way, and get feedback on your approach.
        </p>
      </header>

      <Link to="/learn" className="learn-callout">
        <p className="learn-callout__title">🧠 New to LLD? Start here.</p>
        <p className="learn-callout__text">
          Understand what LLD is, how to approach a design problem, and what to look for in a
          good design before you start practicing.
        </p>
        <span className="learn-callout__cta">Learn LLD basics →</span>
      </Link>

      {status === 'loading' && <p className="state-message">Loading problems…</p>}

      {status === 'error' && (
        <p className="state-message state-message--error">
          Couldn't load problems: {error}. Check that the backend is running and try refreshing.
        </p>
      )}

      {status === 'ready' && problems.length === 0 && (
        <p className="state-message">No problems are available yet.</p>
      )}

      {status === 'ready' && problems.length > 0 && (
        <div className="problem-list">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} onStart={handleStart} />
          ))}
        </div>
      )}
    </main>
  );
}

export default ProblemsListPage;