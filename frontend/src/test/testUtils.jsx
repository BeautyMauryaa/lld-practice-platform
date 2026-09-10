import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Renders `element` at `route` inside a MemoryRouter, registering it
// against `path` so useParams()/useNavigate() work exactly as they do in
// the real App.jsx router. Defaults cover the common single-page case;
// pass `path`/`route` for pages that read route params (e.g. :id).
export function renderWithRouter(element, { path = '/', route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>
  );
}