// frontend/src/components/FeedbackReport.jsx
import React from "react";
// import './FeedbackReport.css';

export default function FeedbackReport({ feedback }) {
  if (!feedback) return null;

  const {
    // score = 0,
    summary = "",
    structural = [],
    heuristic = [],
    aiInsights = null,
    requirementCoverage = [],
  } = feedback;

  return (
    <div className="feedback-report">
      <div className="feedback-header">
        <h2>Evaluation Report</h2>
        {/* <div className="score-badge">Score: {score}%</div> */}
      </div>

      {summary && (
        <div className="feedback-summary">
          <h3>Summary</h3>
          <p>{summary}</p>
        </div>
      )}

      {requirementCoverage && requirementCoverage.length > 0 && (
        <div className="feedback-section requirement-coverage-section">
          <h3>Requirement Coverage</h3>
          <ul className="coverage-list">
            {requirementCoverage.map((item, idx) => (
              <li key={idx} className={item.covered ? "covered" : "uncovered"}>
                <span className="coverage-icon">
                  {item.covered ? "✓" : "⚠"}
                </span>
                <div className="coverage-content">
                  <span className="coverage-req">{item.requirement}</span>
                  <span className="coverage-meta">
                    {item.covered && item.coveredBy.length > 0
                      ? `Covered by / Mentioned in: ${item.coveredBy.join(", ")}`
                      : "Not explicitly modeled in submitted classes"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="feedback-section">
  <h3>Structural Checks</h3>

  {structural.length > 0 ? (
    <ul>
      {structural.map((item, idx) => (
        <li key={idx} className={item.passed ? 'passed' : 'failed'}>
          <span>{item.passed ? '✅' : '❌'}</span>
          {item.rule && <strong>{item.rule}</strong>}
          {item.rule ? ': ' : ''}
          {item.message}
        </li>
      ))}
    </ul>
  ) : (
    <p>No structural issues found.</p>
  )}
</div>

      <div className="feedback-section">
  <h3>Worth Considering</h3>

  {heuristic.length > 0 ? (
    <ul>
      {heuristic.map((item, idx) => (
        <li key={idx}>
          {item.message}
        </li>
      ))}
    </ul>
  ) : (
    <p>Nothing else worth flagging.</p>
  )}
</div>

      {feedback.llmAvailable === false ? (
        <div className="feedback-section ai-insights">
          <h3>AI Insights</h3>
          <p>
            AI feedback is currently unavailable. Rule-based feedback is still
            available.
          </p>
        </div>
      ) : (
        <div className="feedback-section ai-insights">
          <h3>AI Insights</h3>
          {Array.isArray(aiInsights) && aiInsights.length > 0 ? (
            <ul>
              {aiInsights.map((item, idx) => (
                <li key={idx}>{item.message}</li>
              ))}
            </ul>
          ) : (
            <p>No AI insights for this submission.</p>
          )}
        </div>
      )}
    </div>
  );
}
