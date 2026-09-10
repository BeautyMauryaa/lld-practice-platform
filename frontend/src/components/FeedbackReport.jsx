// Renders an evaluated attempt's feedback. Shared between PracticePage
// (right after a fresh evaluation) and AttemptDetailPage (viewing a past
// evaluated attempt) so the two don't drift into two different feedback
// layouts. Pass null/undefined feedback to render nothing.
function FeedbackReport({ feedback }) {
  if (!feedback) return null;

  const structural = feedback.structural || [];
  const heuristic = feedback.heuristic || [];
  const aiInsights = feedback.aiInsights || [];

  return (
    <section className="feedback-report">
      <h2>Evaluation Feedback</h2>

      {feedback.summary && <p className="feedback-summary">{feedback.summary}</p>}

      <div className="feedback-category">
        <h3>
          Structural Checks{' '}
          <span className="feedback-category__confidence">High confidence · Rule-based</span>
        </h3>
        {structural.length === 0 ? (
          <p className="hint-text">No structural issues found.</p>
        ) : (
          <ul className="feedback-list">
            {structural.map((item, i) => (
              <li key={i} className={`feedback-item feedback-item--${item.severity}`}>
                {item.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="feedback-category">
        <h3>
          Worth Considering{' '}
          <span className="feedback-category__confidence">Medium confidence · Heuristic</span>
        </h3>
        {heuristic.length === 0 ? (
          <p className="hint-text">Nothing else worth flagging here.</p>
        ) : (
          <ul className="feedback-list">
            {heuristic.map((item, i) => (
              <li key={i} className={`feedback-item feedback-item--${item.severity}`}>
                {item.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="feedback-category">
        <h3>
          AI Insights <span className="feedback-category__confidence">Contextual · Gemini</span>
        </h3>
        {!feedback.llmAvailable ? (
          <p className="state-message">
            AI feedback is currently unavailable. You still have rule-based and heuristic feedback
            from this evaluation.
          </p>
        ) : aiInsights.length === 0 ? (
          <p className="hint-text">No AI insights for this submission.</p>
        ) : (
          <ul className="feedback-list">
            {aiInsights.map((item, i) => (
              <li key={i} className="feedback-item">
                {item.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default FeedbackReport;