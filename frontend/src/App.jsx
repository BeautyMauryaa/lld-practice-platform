import { Routes, Route } from 'react-router-dom';
import ProblemsListPage from './pages/ProblemsListPage';
import ProblemPlaceholderPage from './pages/ProblemPlaceholderPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProblemsListPage />} />
      <Route path="/problems/:id" element={<ProblemPlaceholderPage />} />
    </Routes>
  );
}