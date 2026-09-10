import { Link, useLocation, useParams } from 'react-router-dom';

export default function ProblemPlaceholderPage() {
  const { id } = useParams();
  const location = useLocation();
  const title = location.state?.title;

  return (
    <main className="page">
      <Link to="/" className="back-link">
        ← Back to problems
      </Link>

      <div className="placeholder">
        <h1>Practice page coming next</h1>
        {title && <p className="placeholder__title">{title}</p>}
        <p className="placeholder__id">Problem ID: {id}</p>
        <p className="state__hint">
          The design form for this problem will be built in the next step.
        </p>
      </div>
    </main>
  );
}