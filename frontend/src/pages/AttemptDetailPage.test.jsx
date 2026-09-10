import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/testUtils';
import AttemptDetailPage from './AttemptDetailPage';
import { getAttemptById, getProblemById, createAttempt } from '../services/api';
import { getStoredLearnerId } from '../services/learner';

vi.mock('../services/api', () => ({
  getAttemptById: vi.fn(),
  getProblemById: vi.fn(),
  createAttempt: vi.fn(),
}));

vi.mock('../services/learner', () => ({
  getStoredLearnerId: vi.fn(),
}));

const PROBLEM = { id: 'p1', title: 'Design a Parking Lot' };

const EVALUATED_ATTEMPT = {
  id: 'a1',
  problemId: 'p1',
  status: 'evaluated',
  createdAt: '2026-01-01T10:00:00.000Z',
  evaluatedAt: '2026-01-01T10:05:00.000Z',
  submission: {
    classes: [
      {
        name: 'ParkingLot',
        responsibilities: ['Track available spots'],
        relationships: ['Contains ParkingSpot'],
      },
    ],
    patternsUsed: ['Singleton'],
    codeStub: 'class ParkingLot {}',
  },
  feedback: {
    summary: 'Nice work.',
    structural: [],
    heuristic: [],
    aiInsights: [],
    llmAvailable: true,
  },
};

function renderDetail(route = '/attempts/a1') {
  return renderWithRouter(<AttemptDetailPage />, { path: '/attempts/:id', route });
}

describe('AttemptDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredLearnerId.mockReturnValue('learner-1');
  });

  test('loads attempt details and displays the problem title', async () => {
    getAttemptById.mockResolvedValue(EVALUATED_ATTEMPT);
    getProblemById.mockResolvedValue(PROBLEM);

    renderDetail();

    expect(await screen.findByText('Design a Parking Lot')).toBeInTheDocument();
    expect(getAttemptById).toHaveBeenCalledWith('a1');
  });

  test('displays submitted classes, responsibilities, relationships, and patterns', async () => {
    getAttemptById.mockResolvedValue(EVALUATED_ATTEMPT);
    getProblemById.mockResolvedValue(PROBLEM);

    renderDetail();

    expect(await screen.findByText('ParkingLot')).toBeInTheDocument();
    expect(screen.getByText('Track available spots')).toBeInTheDocument();
    expect(screen.getByText('Contains ParkingSpot')).toBeInTheDocument();
    expect(screen.getByText('Singleton')).toBeInTheDocument();
  });

  test('shows the submission is read-only', async () => {
    getAttemptById.mockResolvedValue(EVALUATED_ATTEMPT);
    getProblemById.mockResolvedValue(PROBLEM);

    renderDetail();

    await screen.findByText('ParkingLot');
    expect(screen.getByText(/read-only view of a past attempt/i)).toBeInTheDocument();
    // Class name is rendered as static text, not an editable input.
    expect(screen.queryByRole('textbox', { name: /class name/i })).not.toBeInTheDocument();
  });

  test('displays feedback for evaluated attempts', async () => {
    getAttemptById.mockResolvedValue(EVALUATED_ATTEMPT);
    getProblemById.mockResolvedValue(PROBLEM);

    renderDetail();

    expect(await screen.findByText('Nice work.')).toBeInTheDocument();
  });

  test('shows the AI-unavailable message when llmAvailable is false', async () => {
    getAttemptById.mockResolvedValue({
      ...EVALUATED_ATTEMPT,
      feedback: { ...EVALUATED_ATTEMPT.feedback, llmAvailable: false },
    });
    getProblemById.mockResolvedValue(PROBLEM);

    renderDetail();

    expect(await screen.findByText(/ai feedback is currently unavailable/i)).toBeInTheDocument();
  });

  test('Try Again creates a new attempt for the same learner and problem, then navigates to practice', async () => {
    getAttemptById.mockResolvedValue(EVALUATED_ATTEMPT);
    getProblemById.mockResolvedValue(PROBLEM);
    createAttempt.mockResolvedValue({ id: 'a2', problemId: 'p1', status: 'draft' });

    // Register both routes so we can actually observe navigation, not
    // just infer it — a stand-in "Practice Page" element renders once
    // handleTryAgain navigates to /problems/:id.
    render(
      <MemoryRouter initialEntries={['/attempts/a1']}>
        <Routes>
          <Route path="/attempts/:id" element={<AttemptDetailPage />} />
          <Route
            path="/problems/:id"
            element={<div>Practice page for /problems/p1</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    const tryAgainButton = await screen.findByRole('button', { name: /try again/i });
    await userEvent.click(tryAgainButton);

    // Regression check: Try Again must create a brand-new attempt for
    // the SAME learner + problem — never mutate or resubmit the old one.
    await waitFor(() => {
      expect(createAttempt).toHaveBeenCalledWith('learner-1', 'p1');
    });

    // ...and then navigate to that problem's practice route, where the
    // fresh attempt gets picked up.
    expect(await screen.findByText(/practice page for \/problems\/p1/i)).toBeInTheDocument();
  });
});