import { useEffect, useState } from 'react';
import ProblemCard from '../components/ProblemCard';
import { getProblems } from '../services/api';

export default function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProblems() {
      setStatus('loading');
      try {
        const data = await getProblems();
        if (!cancelled) {
          setProblems(data);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err.message || 'Something went wrong while loading problems.');
          setStatus('error');
        }
      }
    }

    loadProblems();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Practice LLD Problems</h1>
        <p className="page__subtitle">
          Pick a problem, design a solution, and get structured feedback on your approach.
        </p>
      </header>

      {status === 'loading' && (
        <p className="state state--loading" role="status">
          Loading problems…
        </p>
      )}

      {status === 'error' && (
        <div className="state state--error" role="alert">
          <p>Couldn't load problems: {errorMessage}</p>
          <p className="state__hint">
            Check that the backend is running at the expected address, then reload this page.
          </p>
        </div>
      )}

      {status === 'ready' && problems.length === 0 && (
        <p className="state state--empty">
          No problems are available yet. Check back soon.
        </p>
      )}

      {status === 'ready' && problems.length > 0 && (
        <section className="problem-grid">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </section>
      )}
    </main>
  );
}