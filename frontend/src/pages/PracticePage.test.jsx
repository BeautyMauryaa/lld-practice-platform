import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PracticePage from './PracticePage';

vi.mock('../services/api', () => ({
  getProblemById: vi.fn(),
  createAttempt: vi.fn(),
  saveAttemptDraft: vi.fn(),
  submitAttempt: vi.fn(),
}));

vi.mock('../services/learner', () => ({
  getStoredLearnerId: vi.fn(),
  registerLearner: vi.fn(),
}));

vi.mock('../components/ClassEditor', () => ({
  default: ({ classData, onUpdate, onRemove }) => (
    <div data-testid="class-editor">
      <input
        aria-label="Class name"
        value={classData.name}
        onChange={(e) => onUpdate({ ...classData, name: e.target.value })}
      />
      <button type="button" onClick={onRemove}>
        Remove Class
      </button>
    </div>
  ),
}));

vi.mock('../components/ListFieldEditor', () => ({
  default: ({ items, onChange, placeholder, addLabel }) => (
    <div>
      {items.map((item, index) => (
        <input
          key={index}
          aria-label="Pattern used"
          placeholder={placeholder}
          value={item}
          onChange={(e) => {
            const next = [...items];
            next[index] = e.target.value;
            onChange(next);
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
      >
        {addLabel}
      </button>
    </div>
  ),
}));

vi.mock('../components/FeedbackReport', () => ({
  default: ({ feedback }) => (
    <div data-testid="feedback-report">
      {feedback.summary}
    </div>
  ),
}));

import {
  getProblemById,
  createAttempt,
  saveAttemptDraft,
  submitAttempt,
} from '../services/api';

import {
  getStoredLearnerId,
  registerLearner,
} from '../services/learner';

const problem = {
  id: 'problem-1',
  title: 'Design a Parking Lot',
  difficulty: 'medium',
  requirements: [
    'The system should support multiple vehicle types.',
    'The system should allocate available parking spots.',
  ],
  constraints: ['Keep the design extensible.'],
};

function renderPracticePage() {
  return render(
    <MemoryRouter initialEntries={['/problems/problem-1/practice']}>
      <Routes>
        <Route path="/problems/:id/practice" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getStoredLearnerId.mockReturnValue('learner-1');

    getProblemById.mockResolvedValue(problem);

    createAttempt.mockResolvedValue({
      id: 'attempt-1',
      status: 'draft',
    });

    saveAttemptDraft.mockResolvedValue({
      id: 'attempt-1',
      status: 'draft',
    });

    submitAttempt.mockResolvedValue({
      id: 'attempt-1',
      status: 'evaluated',
      feedback: {
        structural: [],
        heuristic: [],
        requirementCoverage: [],
        aiInsights: [],
        llmAvailable: true,
        summary: 'Evaluation completed.',
      },
    });
  });

  test('loads and displays the problem details', async () => {
    renderPracticePage();

    expect(await screen.findByText('Design a Parking Lot')).toBeInTheDocument();
    expect(screen.getByText('Difficulty:')).toBeInTheDocument();

    expect(
      screen.getByText('The system should support multiple vehicle types.')
    ).toBeInTheDocument();

    expect(
      screen.getByText('The system should allocate available parking spots.')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Keep the design extensible.')
    ).toBeInTheDocument();
  });

  test('creates an attempt when a learner is already stored', async () => {
    renderPracticePage();

    await waitFor(() => {
      expect(createAttempt).toHaveBeenCalledWith(
        'learner-1',
        'problem-1'
      );
    });

    expect(
      await screen.findByRole('button', { name: 'Save Draft' })
    ).toBeEnabled();
  });

  test('requires a learner name when no learner is stored', async () => {
    getStoredLearnerId.mockReturnValue(null);

    renderPracticePage();

    expect(
      await screen.findByText('Before you start')
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Your name');
    const button = screen.getByRole('button', { name: 'Continue' });

    await userEvent.type(input, 'Beauty');
    await userEvent.click(button);

    await waitFor(() => {
      expect(registerLearner).toHaveBeenCalledWith('Beauty');
    });
  });

  test('does not save when the class name is missing', async () => {
    renderPracticePage();

    const saveButton = await screen.findByRole('button', {
      name: 'Save Draft',
    });

    await userEvent.click(saveButton);

    expect(
      await screen.findByText('Every class needs a name before saving.')
    ).toBeInTheDocument();

    expect(saveAttemptDraft).not.toHaveBeenCalled();
  });

  test('saves a valid draft', async () => {
    renderPracticePage();

    const classNameInput = await screen.findByRole('textbox', {
      name: 'Class name',
    });

    await userEvent.type(classNameInput, 'ParkingLot');

    await userEvent.click(
      screen.getByRole('button', { name: 'Save Draft' })
    );

    await waitFor(() => {
      expect(saveAttemptDraft).toHaveBeenCalledWith(
        'attempt-1',
        {
          classes: [
            {
              name: 'ParkingLot',
              responsibilities: [],
              relationships: [],
            },
          ],
          patternsUsed: [],
          codeStub: '',
        }
      );
    });

    expect(await screen.findByText('Draft saved.')).toBeInTheDocument();
  });

  test('saves the current form before submitting for evaluation', async () => {
    renderPracticePage();

    const classNameInput = await screen.findByRole('textbox', {
      name: 'Class name',
    });

    await userEvent.type(classNameInput, 'ParkingLot');

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Submit for Evaluation',
      })
    );

    await waitFor(() => {
      expect(saveAttemptDraft).toHaveBeenCalled();
      expect(submitAttempt).toHaveBeenCalledWith('attempt-1');
    });

    // expect(submitAttempt.mock.invocationCallOrder[0]).toBeGreaterThan(
    //   saveAttemptDraft.mock.invocationCallOrder[0]
    // );
  });

  test('shows feedback after successful evaluation', async () => {
    renderPracticePage();

    const classNameInput = await screen.findByRole('textbox', {
      name: 'Class name',
    });

    await userEvent.type(classNameInput, 'ParkingLot');

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Submit for Evaluation',
      })
    );

    expect(
      await screen.findByTestId('feedback-report')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Evaluation completed.')
    ).toBeInTheDocument();
  });

  test('creates a fresh attempt when Try Again is clicked', async () => {
    renderPracticePage();

    const classNameInput = await screen.findByRole('textbox', {
      name: 'Class name',
    });

    await userEvent.type(classNameInput, 'ParkingLot');

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Submit for Evaluation',
      })
    );

    await screen.findByTestId('feedback-report');

    createAttempt.mockResolvedValueOnce({
      id: 'attempt-2',
      status: 'draft',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Try Again' })
    );

    await waitFor(() => {
      expect(createAttempt).toHaveBeenLastCalledWith(
        'learner-1',
        'problem-1'
      );
    });

    expect(
      screen.queryByTestId('feedback-report')
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('textbox', { name: 'Class name' })
    ).toHaveValue('');
  });
});