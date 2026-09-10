import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { renderWithRouter } from '../test/testUtils';
import LearningHubPage from './LearningHubPage';

describe('LearningHubPage', () => {
  test('renders the major sections', () => {
    renderWithRouter(<LearningHubPage />);

    expect(screen.getByRole('heading', { name: 'Learn LLD' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is LLD?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why does LLD matter?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'LLD vs HLD' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'How to approach an LLD problem' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Core concepts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SOLID principles' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Design patterns' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What makes a good LLD?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How to use this platform' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ready to practice?' })).toBeInTheDocument();
  });

  test('"Start Practicing" navigates back to the problems list route', async () => {
    // Register both routes so we can actually observe navigation, rather
    // than just inferring it from a mocked useNavigate call.
    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn" element={<LearningHubPage />} />
          <Route path="/" element={<div>Problems list page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: /start practicing/i }));

    expect(await screen.findByText('Problems list page')).toBeInTheDocument();
  });
});
