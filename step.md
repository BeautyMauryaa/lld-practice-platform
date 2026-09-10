We have completed the backend through Step 7. Before implementing anything else, understand the remaining roadmap below.

IMPORTANT:
- Do NOT implement all remaining steps at once.
- We will implement one step at a time.
- For every step, first inspect the existing code, then make the smallest reasonable change.
- Do not over-engineer.
- Do not introduce microservices, queues, Redis, Redux, authentication, Kubernetes, etc.
- This is a 2-day LLD engineering assignment, so simplicity and clear design matter more than feature quantity.

========================
CURRENT STATUS — COMPLETED
========================

Step 1 — Project setup and understanding
DONE

Step 2 — Domain/model design
DONE

Step 3 — Problems + seed data
DONE
- Parking Lot
- Vending Machine
- Elevator System

Step 4 — Attempt APIs
DONE
- Create attempt
- Save/update draft
- Get attempt
- Get learner attempts

Step 5 — Deterministic evaluation
DONE
- RuleEvaluator
- Structural checks
- Heuristic checks
- Tests

Step 6 — Gemini LLM evaluation
DONE
- @google/genai
- Gemini structured JSON output
- LLMEvaluator
- Graceful timeout/error handling
- Real Gemini API call verified

Step 7 — Evaluation pipeline + submission
DONE

Step 7A:
- CompositeEvaluator
- RuleEvaluator runs first
- deterministic findings passed to Gemini
- graceful LLM degradation

Step 7B:
- POST /api/attempts/:id/submit
- draft → evaluating → evaluated
- failed status for genuine pipeline failure
- feedback persisted
- submittedAt/evaluatedAt persisted
- tests passing

Current backend test status:
51/51 tests passing.

Real end-to-end submit has been verified:
- status = evaluated
- llmAvailable = true
- aiInsights are returned
- structural false positives for relationship verbs were fixed


========================
REMAINING ROADMAP
========================

STEP 8 — FRONTEND MVP

Step 8A — Problems List
- React page
- GET /api/problems
- Show problem title, difficulty, requirements/context
- "Start Practice" button
- loading state
- error state
- basic routing

Step 8B — Start Attempt / Design Form
- Start an attempt for selected problem
- structured submission form
- Add/remove classes
- Add responsibilities
- Add relationships
- Add patterns used
- Optional code stub
- Save draft
- Keep the form simple and usable

Step 8C — Submit Attempt
- Submit the saved attempt
- Show evaluating/loading state
- Handle success
- Handle backend errors
- Navigate to feedback after evaluation

Step 8D — Feedback Page
Display feedback clearly in separate sections:

1. Structural Checks
   High confidence / rule-based

2. Worth Considering
   Medium confidence / heuristic

3. AI Insights
   Contextual / Gemini

Also show:
- overall summary
- whether AI feedback was available
- graceful message if AI was unavailable

Do NOT make AI feedback look like absolute truth.

Step 8E — Attempt History
- Show previous attempts
- problem name
- status
- submission/evaluation date
- open previous feedback
- "Try Again" should create a new attempt rather than modifying the old evaluated attempt


========================
STEP 9 — FRONTEND/BACKEND INTEGRATION CHECK
========================

After the main frontend is complete:

- Verify every API used by the frontend
- Verify error states
- Verify loading states
- Verify empty states
- Verify evaluated and failed scenarios
- Verify old attempts remain unchanged
- Verify Try Again creates a new attempt
- Fix only real issues found


========================
STEP 10 — TESTING
========================

Backend tests already exist and currently pass.

Add only the important frontend tests needed for the MVP, such as:
- problems render
- API error state
- form submission
- feedback sections render
- history renders

Do not chase unnecessary test coverage.

Then run the complete test suite.


========================
STEP 11 — DOCUMENTATION
========================

README.md:
- What the platform does
- Why this problem is interesting
- Architecture
- Tech stack
- How to run locally
- Environment variables
- API overview
- Evaluation approach
- Screenshots if useful
- Design decisions/trade-offs

AI_USAGE.md:
Document 3–5 meaningful AI-assisted decisions.

For each:
- What AI suggested
- Why we considered it
- Accepted / modified / rejected
- Why

Do not write generic statements like "AI helped with coding."

Research Note PDF:
- LLD practice/evaluation problem
- Why generic correctness-based evaluation is insufficient
- Multiple valid LLD solutions
- Useful feedback characteristics
- Deterministic vs AI evaluation

Design Note PDF:
- Architecture
- Domain model
- Submission abstraction
- Evaluator abstraction
- Evaluation pipeline
- Feedback confidence model
- Status lifecycle
- Extensibility
- Key trade-offs


========================
STEP 12 — FINAL PRODUCT CHECK
========================

Final learner flow must work:

Problems
   ↓
Choose Problem
   ↓
Start Practice
   ↓
Create Design
   ↓
Save Draft
   ↓
Submit
   ↓
Evaluation
   ↓
Feedback
   ↓
History
   ↓
Try Again

Final project should demonstrate:
- clear LLD/domain design
- useful product experience
- deterministic + AI evaluation
- explainable feedback
- confidence-aware feedback
- extensibility
- sensible engineering trade-offs
- tests
- documentation

Again: DO NOT implement all of this now.

For the next task, implement ONLY:

STEP 8A — Problems List Page

First inspect the current frontend/project structure and tell me what already exists. Then implement Step 8A only.