import { screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderWithRouter } from '../test/testUtils';
import ProblemsListPage from './ProblemsListPage';
import { getProblems } from '../services/api';

vi.mock('../services/api', () => ({
  getProblems: vi.fn(),
}));

const PROBLEMS = [
  {
    id: 'p1',
    title: 'Design a Parking Lot',
    difficulty: 'medium',
    requirements: ['Support multiple vehicle types', 'Track available spots'],
  },
  {
    id: 'p2',
    title: 'Design an Elevator System',
    difficulty: 'hard',
    requirements: ['Handle multiple elevators'],
  },
];

describe('ProblemsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches and renders problems with title, difficulty, and excerpt', async () => {
    getProblems.mockResolvedValue(PROBLEMS);

    renderWithRouter(<ProblemsListPage />);

    expect(await screen.findByText('Design a Parking Lot')).toBeInTheDocument();
    expect(screen.getByText('Design an Elevator System')).toBeInTheDocument();

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();

    expect(screen.getByText('Support multiple vehicle types')).toBeInTheDocument();
    expect(screen.getByText('Handle multiple elevators')).toBeInTheDocument();

    expect(getProblems).toHaveBeenCalledTimes(1);
  });

  test('renders a "Start Practice" action for each problem', async () => {
    getProblems.mockResolvedValue(PROBLEMS);

    renderWithRouter(<ProblemsListPage />);

    const startButtons = await screen.findAllByRole('button', { name: /start practice/i });
    expect(startButtons).toHaveLength(PROBLEMS.length);
    startButtons.forEach((button) => expect(button).toBeEnabled());
  });

  test('shows an error state when the API call fails', async () => {
    getProblems.mockRejectedValue(new Error('Network down'));

    renderWithRouter(<ProblemsListPage />);

    expect(await screen.findByText(/couldn't load problems/i)).toBeInTheDocument();
    expect(screen.getByText(/network down/i)).toBeInTheDocument();
  });

  test('shows an empty state when there are no problems', async () => {
    getProblems.mockResolvedValue([]);

    renderWithRouter(<ProblemsListPage />);

    await waitFor(() => {
      expect(screen.getByText(/no problems are available yet/i)).toBeInTheDocument();
    });
  });

  test('renders a Learning Hub entry point linking to /learn', () => {
    getProblems.mockResolvedValue([]);

    renderWithRouter(<ProblemsListPage />);

    const learnLink = screen.getByRole('link', { name: /learn lld basics/i });
    expect(learnLink).toHaveAttribute('href', '/learn');
  });
});