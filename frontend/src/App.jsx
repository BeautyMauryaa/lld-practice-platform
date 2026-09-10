import { Routes, Route } from 'react-router-dom';
import ProblemsListPage from './pages/ProblemsListPage';
import PracticePage from './pages/PracticePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProblemsListPage />} />
      <Route path="/problems/:id" element={<PracticePage />} />
    </Routes>
  );
}