# LLD Practice Platform

A small practice platform for Low-Level Design problems.

The idea is to make LLD practice more useful by letting a learner submit a design and get feedback on it, instead of only solving a problem and moving on.

## What the platform does

The current flow is:

**Problems → Practice → Submit → Feedback → History → Try Again**

A learner can:

- choose an LLD problem
- create an attempt
- define classes, responsibilities and relationships
- mention patterns used
- add an optional code stub
- save the attempt as a draft
- submit it for evaluation
- review the feedback
- see previous attempts and try again

The MVP currently has three problems:

- Parking Lot
- Vending Machine
- Elevator System

## Feedback

One of the main things I focused on was making the feedback understandable.

The evaluation is split into three parts:

### Structural Checks

Rule-based checks for things that can be checked directly.

**High confidence**

### Worth Considering

Heuristic checks that point out things the learner may want to review.

**Medium confidence**

These are suggestions, not a statement that the design is wrong.

### AI Insights

Gemini is used for feedback that needs more context, such as:

- responsibilities
- coupling and cohesion
- requirement coverage
- extensibility
- trade-offs
- design patterns

**Contextual feedback**

This separation is useful because an LLD problem can have more than one good solution. The platform should help the learner think about their design rather than force one expected answer.

## How the evaluation works

```text
                    Submission
                        |
                        v
               Composite Evaluator
                 /       |       \
                v        v        v
          Structural  Heuristic    AI
             Rules      Checks   Evaluation
                 \       |       /
                  \      |      /
                   v     v     v
                   Feedback
```

The deterministic feedback is generated first and is also given to the LLM as context.

If the AI evaluation is unavailable, the rule-based and heuristic feedback is still kept. The result is marked with `llmAvailable: false`.

## Main design

The main parts of the backend are:

```text
Problem
   |
   └── Attempt
          |
          ├── Submission
          └── Feedback
```

An attempt has a simple lifecycle:

```text
draft → submitted → evaluating → evaluated
```

A `failed` status is also available when the complete evaluation pipeline cannot finish.

The evaluation layer is separated into:

- `RuleEvaluator`
- `LLMEvaluator`
- `CompositeEvaluator`

This keeps the evaluation logic separate from the attempt flow and makes it easier to add another evaluator later.

## Submission format

A submission currently looks like this:

```text
classes
  ├── name
  ├── responsibilities
  └── relationships

patternsUsed

codeStub (optional)
```

I chose this instead of only accepting free-form text because the structure gives the evaluator something concrete to work with.

At the same time, the learner is not forced to follow one particular class design.

## Requirement coverage

The platform also checks each problem requirement against the submitted design.

It looks at the classes, responsibilities and relationships and records:

- the requirement
- whether there is evidence of coverage
- which classes contributed to it

This is intentionally a heuristic check. It is there to help the learner review their design, not to act as a perfect semantic judge.

## Tech Stack

**Frontend**
- React
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**AI**
- Google Gemini
- `@google/genai`

**Testing**
- Jest
- Supertest
- MongoDB Memory Server

## Project Structure

```text
lld-practice-platform/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── evaluators/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── tests/
│
├── frontend/
│   └── src/
│
├── README.md
└── AI_USAGE.md
```

## Running locally

### Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and add the required configuration, including your MongoDB connection string and Gemini API key.

Then run:

```bash
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Testing

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test -- --run
```

Build:

```bash
npm run build
```

## Some decisions I made

### I did not use the LLM as the only evaluator

Some things are better handled by simple, predictable rules. The LLM is more useful when the feedback needs context.

### I did not treat expected concepts as required answers

LLD problems can have multiple valid designs. Expected concepts are used as useful signals, not as an answer key.

### I kept AI failure separate from evaluation failure

If Gemini is unavailable, the learner can still get the feedback produced by the other evaluation layers.

### I kept the application as a monolith

For this MVP, a simple application was enough. Adding queues, microservices or other distributed components would have increased complexity without improving the main practice flow.

## Limitations

This is an MVP, so there are some limitations:

- requirement coverage is heuristic
- AI feedback can be imperfect
- AI feedback can be unavailable
- submitted code is not compiled or executed
- authentication is not included
- the problem set is small

## Future improvements

If I continue working on the project, I would focus mainly on improving the feedback.

Some things I would explore are:

- better requirement-to-design mapping
- comparing different attempts
- diagram-based submissions
- more LLD problems
- more consistent AI feedback

## AI Usage

AI was used during the development process for exploring ideas, implementation support, debugging and reviewing design decisions.

The important AI-assisted decisions and the reasoning behind the final choices are documented in [`AI_USAGE.md`](./AI_USAGE.md).
