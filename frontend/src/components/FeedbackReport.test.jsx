import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import FeedbackReport from './FeedbackReport';

const FULL_FEEDBACK = {
  summary: 'Solid design with a few structural gaps.',
  structural: [{ message: 'ParkingLot has no relationship to ParkingSpot', severity: 'high' }],
  heuristic: [{ message: 'Consider a Strategy pattern for pricing', severity: 'low' }],
  aiInsights: [{ message: 'Your responsibility split reads cleanly' }],
  llmAvailable: true,
};

describe('FeedbackReport', () => {
  test('renders nothing when feedback is null/undefined', () => {
    const { container } = render(<FeedbackReport feedback={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders the summary', () => {
    render(<FeedbackReport feedback={FULL_FEEDBACK} />);
    expect(screen.getByText('Solid design with a few structural gaps.')).toBeInTheDocument();
  });

  test('renders structural findings', () => {
    render(<FeedbackReport feedback={FULL_FEEDBACK} />);
    expect(screen.getByText('ParkingLot has no relationship to ParkingSpot')).toBeInTheDocument();
    expect(screen.getByText(/structural checks/i)).toBeInTheDocument();
  });

  test('renders heuristic findings', () => {
    render(<FeedbackReport feedback={FULL_FEEDBACK} />);
    expect(screen.getByText('Consider a Strategy pattern for pricing')).toBeInTheDocument();
    expect(screen.getByText(/worth considering/i)).toBeInTheDocument();
  });

  test('renders AI findings when llmAvailable is true', () => {
    render(<FeedbackReport feedback={FULL_FEEDBACK} />);
    expect(screen.getByText('Your responsibility split reads cleanly')).toBeInTheDocument();
  });

  test('shows the AI-unavailable message when llmAvailable is false', () => {
    render(<FeedbackReport feedback={{ ...FULL_FEEDBACK, llmAvailable: false, aiInsights: [] }} />);
    expect(screen.getByText(/ai feedback is currently unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText('Your responsibility split reads cleanly')).not.toBeInTheDocument();
  });

  test('handles empty sections gracefully instead of crashing', () => {
    render(
      <FeedbackReport
        feedback={{ summary: '', structural: [], heuristic: [], aiInsights: [], llmAvailable: true }}
      />
    );
    expect(screen.getByText(/no structural issues found/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing else worth flagging/i)).toBeInTheDocument();
    expect(screen.getByText(/no ai insights for this submission/i)).toBeInTheDocument();
  });
});