import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/testUtils';
import AttemptHistoryPage from './AttemptHistoryPage';
import { getAttempts, getAttemptById, getProblems } from '../services/api';
import { getStoredLearnerId } from '../services/learner';

vi.mock('../services/api', () => ({
  getAttempts: vi.fn(),
  getAttemptById: vi.fn(),
  getProblems: vi.fn(),
}));

vi.mock('../services/learner', () => ({
  getStoredLearnerId: vi.fn(),
}));

const PROBLEMS = [{ id: 'p1', title: 'Design a Parking Lot' }];

const DRAFT_ATTEMPT = {
  id: 'a1',
  problemId: 'p1',
  status: 'draft',
  createdAt: '2026-01-01T10:00:00.000Z',
};

const EVALUATED_ATTEMPT = {
  id: 'a2',
  problemId: 'p1',
  status: 'evaluated',
  createdAt: '2026-01-02T10:00:00.000Z',
  evaluatedAt: '2026-01-02T10:05:00.000Z',
};

describe('AttemptHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredLearnerId.mockReturnValue('learner-1');
    getProblems.mockResolvedValue(PROBLEMS);
  });

  test('fetches attempts using the stored learner ID', async () => {
    getAttempts.mockResolvedValue([DRAFT_ATTEMPT]);

    renderWithRouter(<AttemptHistoryPage />);

    await waitFor(() => expect(getAttempts).toHaveBeenCalledWith('learner-1'));
  });

  test('displays problem title, status badge, and dates', async () => {
    getAttempts.mockResolvedValue([DRAFT_ATTEMPT]);

    renderWithRouter(<AttemptHistoryPage />);

    expect(await screen.findByText('Design a Parking Lot')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText(/started/i)).toBeInTheDocument();
  });

  test('shows feedback summary for evaluated attempts', async () => {
    getAttempts.mockResolvedValue([EVALUATED_ATTEMPT]);
    getAttemptById.mockResolvedValue({
      ...EVALUATED_ATTEMPT,
      feedback: { summary: 'Great use of composition.' },
    });

    renderWithRouter(<AttemptHistoryPage />);

    expect(await screen.findByText('Great use of composition.')).toBeInTheDocument();
    expect(getAttemptById).toHaveBeenCalledWith('a2');
  });

  test('does not fetch a feedback summary for non-evaluated attempts', async () => {
    getAttempts.mockResolvedValue([DRAFT_ATTEMPT]);

    renderWithRouter(<AttemptHistoryPage />);

    await screen.findByText('Design a Parking Lot');
    expect(getAttemptById).not.toHaveBeenCalled();
  });

  test('shows an empty state when there are no attempts', async () => {
    getAttempts.mockResolvedValue([]);

    renderWithRouter(<AttemptHistoryPage />);

    expect(await screen.findByText(/no attempts yet/i)).toBeInTheDocument();
  });

  test('shows an error state when the API call fails', async () => {
    getAttempts.mockRejectedValue(new Error('Server unreachable'));

    renderWithRouter(<AttemptHistoryPage />);

    expect(await screen.findByText(/couldn't load your attempt history/i)).toBeInTheDocument();
    expect(screen.getByText(/server unreachable/i)).toBeInTheDocument();
  });

  test('clicking an attempt links to its detail page', async () => {
    getAttempts.mockResolvedValue([DRAFT_ATTEMPT]);

    renderWithRouter(<AttemptHistoryPage />);

    const link = await screen.findByRole('link', { name: /design a parking lot/i });
    expect(link).toHaveAttribute('href', '/attempts/a1');
  });
});