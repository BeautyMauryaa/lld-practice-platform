// frontend/src/components/FeedbackReport.jsx
import React from 'react';

export default function FeedbackReport({ feedback }) {
  if (!feedback) return null;

  const {
    summary = '',
    structural = [],
    heuristic = [],
    aiInsights = null,
    requirementCoverage = [],
  } = feedback;

  return (
    <div className="feedback-report-wrapper">
      <div className="feedback-report-main-card">
        <div className="feedback-report-header">
          <h2>Evaluation Report</h2>
        </div>

        {summary && (
          <div className="feedback-summary-block">
            <h3>Summary</h3>
            <p>{summary}</p>
          </div>
        )}

        {requirementCoverage && requirementCoverage.length > 0 && (
          <div className="feedback-section requirement-coverage-section">
            <h3>Requirement Coverage</h3>
            <ul className="coverage-list">
              {requirementCoverage.map((item, idx) => (
                <li
                  key={idx}
                  className={`coverage-item ${item.covered ? 'covered' : 'uncovered'}`}
                >
                  <span className="coverage-icon">
                    {item.covered ? '✓' : '⚠'}
                  </span>
                  <div className="coverage-content">
                    <span className="coverage-req">{item.requirement}</span>
                    <span className="coverage-meta">
                      {item.covered && item.coveredBy && item.coveredBy.length > 0
                        ? `Covered by: ${item.coveredBy.join(', ')}`
                        : 'Not explicitly modeled in submitted classes'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="feedback-section feedback-section--structural">
          <div className="feedback-section__header">
            <h3>Structural Checks</h3>
            <span className="confidence-badge confidence-badge--high">High confidence</span>
          </div>

          {structural.length > 0 ? (
            <ul className="feedback-items-list">
              {structural.map((item, idx) => (
                <li
                  key={idx}
                  className={`feedback-item ${item.passed ? 'passed' : 'failed'}`}
                >
                  <span className="feedback-item-icon">{item.passed ? '✓' : '✕'}</span>
                  <div className="feedback-item-text">
                    {item.rule && <strong className="feedback-item-rule">{item.rule}</strong>}
                    {item.rule ? ': ' : ''}
                    <span className="feedback-item-msg">{item.message}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="feedback-empty-text">No structural issues found.</p>
          )}
        </div>

        <div className="feedback-section feedback-section--heuristic">
          <div className="feedback-section__header">
            <h3>Worth Considering</h3>
            <span className="confidence-badge confidence-badge--medium">Medium confidence</span>
          </div>

          {heuristic.length > 0 ? (
            <ul className="feedback-items-list">
              {heuristic.map((item, idx) => (
                <li key={idx} className="feedback-item heuristic-item">
                  <span className="feedback-item-icon">•</span>
                  <div className="feedback-item-text">
                    <span className="feedback-item-msg">{item.message}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="feedback-empty-text">Nothing else worth flagging.</p>
          )}
        </div>

        <div className="feedback-section ai-insights">
          <div className="feedback-section__header">
            <h3>AI Insights</h3>
            <span className="confidence-badge confidence-badge--ai">Contextual</span>
          </div>
          {feedback.llmAvailable === false ? (
            <p className="feedback-empty-text">
              AI feedback is currently unavailable. Rule-based feedback is still available.
            </p>
          ) : (
            <>
              <p className="ai-disclaimer">
                AI-generated observations meant to guide your thinking — not a guaranteed-correct verdict.
              </p>
              {Array.isArray(aiInsights) && aiInsights.length > 0 ? (
                <ul className="feedback-items-list">
                  {aiInsights.map((item, idx) => (
                    <li key={idx} className="feedback-item ai-item">
                      <span className="feedback-item-icon">•</span>
                      <div className="feedback-item-text">
                        <span className="feedback-item-msg">{item.message}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="feedback-empty-text">No AI insights for this submission.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}