import { Routes, Route, NavLink } from 'react-router-dom';
import ProblemsListPage from './pages/ProblemsListPage';
import PracticePage from './pages/PracticePage';
import AttemptHistoryPage from './pages/AttemptHistoryPage';
import AttemptDetailPage from './pages/AttemptDetailPage';
import LearningHubPage from './pages/LearningHubPage';

function navLinkClass({ isActive }) {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link';
}

export default function App() {
  return (
    <>
      <nav className="app-nav">
        <NavLink to="/" end className={navLinkClass}>
          Problems
        </NavLink>
        <NavLink to="/learn" className={navLinkClass}>
          Learn LLD
        </NavLink>
        <NavLink to="/history" className={navLinkClass}>
          Attempt History
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<ProblemsListPage />} />
        <Route path="/learn" element={<LearningHubPage />} />
        <Route path="/problems/:id" element={<PracticePage />} />
        <Route path="/history" element={<AttemptHistoryPage />} />
        <Route path="/attempts/:id" element={<AttemptDetailPage />} />
      </Routes>
    </>
  );
}