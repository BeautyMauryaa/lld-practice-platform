import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProblems } from '../services/api';
import ProblemCard from '../components/ProblemCard';

function ProblemsListPage() {
  const [status, setStatus] = useState('loading');
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('theme-problems');
    return () => {
      document.body.classList.remove('theme-problems');
    };
  }, []);

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

  const filteredProblems = problems.filter((p) => {
    if (filter === 'all') return true;
    return p.difficulty?.toLowerCase() === filter;
  });

  return (
    <main className="page cyber-page">
      <div className="cyber-hero-glow"></div>
      
      <header className="page__header-cyber">
        <div className="hero-top-row">
          <span className="hero-tag">⚡ SYSTEM ARCHITECTURE CORE</span>
          <div className="hero-stats-badge">
            <span>{problems.length} Problems Available</span>
          </div>
        </div>
        <h1>Low-Level Design Arena</h1>
        <p className="page__subtitle">
          Select a production-grade component, engineer bulletproof class hierarchies, and run real-time structural evaluations.
        </p>

        {/* Filter Toolbar to fix empty space */}
        <div className="cyber-filter-bar">
          <button 
            className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Challenges ({problems.length})
          </button>
          <button 
            className={`filter-chip easy ${filter === 'easy' ? 'active' : ''}`}
            onClick={() => setFilter('easy')}
          >
            🟢 Easy
          </button>
          <button 
            className={`filter-chip medium ${filter === 'medium' ? 'active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            🟡 Medium
          </button>
          <button 
            className={`filter-chip hard ${filter === 'hard' ? 'active' : ''}`}
            onClick={() => setFilter('hard')}
          >
            🔴 Hard
          </button>
        </div>
      </header>

      {status === 'loading' && (
        <div className="state-loading-container">
          <div className="cyber-spinner"></div>
          <p className="state-message">Initializing Architecture Matrix…</p>
        </div>
      )}

      {status === 'error' && (
        <p className="state-message state-message--error">
          Couldn't load problems: {error}. Check that backend is running.
        </p>
      )}

      {status === 'ready' && filteredProblems.length === 0 && (
        <div className="empty-state-box">
          <p>No problems found matching this filter tier.</p>
        </div>
      )}

      {status === 'ready' && filteredProblems.length > 0 && (
        <div className="problem-list">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} onStart={handleStart} />
          ))}
        </div>
      )}
    </main>
  );
}

export default ProblemsListPage;