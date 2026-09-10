# LLD Practice Platform

## Project Plan & Initial Design Decisions

> A focused 2-day engineering prototype for practicing Low-Level Design and receiving useful, explainable feedback.

---

## 1. Problem Statement

Practicing Low-Level Design (LLD) problems is relatively easy to start, but evaluating the quality of a design is difficult.

A learner can design a Parking Lot, Elevator, or Vending Machine and still be unsure about:

* Whether responsibilities are assigned correctly
* Whether classes are unnecessarily coupled
* Whether abstractions are useful
* Whether relationships between objects make sense
* Whether the design is extensible
* Whether a design pattern is actually appropriate
* What could be improved in the next attempt

Unlike many coding problems, LLD does not always have one objectively correct solution. Multiple designs can satisfy the same requirements while making different trade-offs.

### Product opportunity

Build a small practice platform that helps a learner follow this loop:

```text
Choose Problem
      ↓
Think / Design
      ↓
Submit
      ↓
Get Feedback
      ↓
Review
      ↓
Try Again
```

The goal is not to build a complete LMS or automated interview platform. The goal is to make repeated LLD practice and self-improvement easier.

---

# 2. Product Goal

The platform should allow a learner to:

1. Choose an LLD problem.
2. Read its requirements and constraints.
3. Create a solution/design.
4. Submit the solution.
5. Receive explainable feedback.
6. Understand which feedback is objective and which is judgment-based.
7. Review previous attempts.
8. Try the problem again and improve.

---

# 3. MVP Scope

The MVP will contain a small set of LLD problems, initially:

* Parking Lot
* Vending Machine
* Elevator System

Each problem will contain:

* Title
* Difficulty
* Requirements
* Constraints
* Potentially useful LLD concepts

The platform will not attempt to cover a large problem library.

### In scope

* Problem listing
* Problem details
* Attempt creation
* Structured LLD submission
* Optional code stub
* Submission
* Rule-based evaluation
* Heuristic evaluation
* LLM-based feedback
* Feedback report
* Evaluation failure handling
* Attempt history
* Basic tests
* Documentation

### Out of scope

* Full LMS functionality
* User social features
* Leaderboards
* Complex authentication/authorization
* Arbitrary code execution
* Online code compilation
* Kubernetes
* Microservices
* Distributed queues
* Multi-region infrastructure
* Large-scale HLD optimization

A simple monolithic MERN application is sufficient for this prototype.

---

# 4. Learner Journey

## Step 1 — Choose a Problem

The learner sees available LLD problems.

Example:

```text
Parking Lot       Medium
Vending Machine   Medium
Elevator System   Hard
```

The learner selects a problem and starts an attempt.

---

## Step 2 — Understand Requirements

The problem page provides enough context for the learner to attempt the design.

Example:

### Parking Lot

Requirements may include:

* Support different vehicle types.
* Support different parking spots.
* Assign suitable parking spots.
* Generate a parking ticket.
* Calculate parking fees.
* Handle vehicle exit.

The goal is to give enough information to design against without providing the solution.

---

## Step 3 — Create the LLD Design

The learner provides a structured solution.

### Example

```text
Class Name:
ParkingLot

Responsibilities:
- Manage parking spots
- Assign parking spots
- Track parked vehicles
```

Another class:

```text
Class Name:
Vehicle

Responsibilities:
- Store vehicle information
- Represent vehicle type
```

Relationships:

```text
ParkingLot → ParkingSpot
ParkingSpot → Vehicle
```

Patterns:

```text
Strategy Pattern
```

An optional code stub can also be provided.

---

# 5. Submission Format

The MVP uses:

## Structured Submission + Optional Code Stub

A structured submission contains:

```text
classes:
  - name
  - responsibilities[]
  - relationships[]

patternsUsed[]

codeStub? 
```

### Why structured submission?

A completely free-form text submission would make deterministic evaluation difficult.

A full code submission would introduce unnecessary complexity such as:

* Code parsing
* Compilation
* Runtime execution
* Sandboxing
* Security concerns

For a 2-day prototype, structured data gives enough information for meaningful evaluation while keeping the system focused.

The optional code stub provides additional context for the LLM without requiring code execution.

---

# 6. Domain Model

The initial domain consists of:

```text
Problem
Attempt
Submission
Evaluator
FeedbackReport
Finding
```

---

## Problem

Represents an LLD practice problem.

Conceptually:

```text
Problem {
    id
    title
    difficulty
    requirements[]
    constraints[]
    expectedConcepts[]
}
```

### `expectedConcepts`

`expectedConcepts` represents concepts that may be useful for solving the problem.

For example:

```text
[
    "State Pattern",
    "Polymorphism"
]
```

These are **not mandatory answers**.

LLD problems can have multiple valid solutions, so the system must not treat `expectedConcepts` as a rigid answer key.

---

# 7. Attempt

An `Attempt` represents one learner's attempt at a particular problem.

Conceptually:

```text
Attempt {
    id
    learnerId
    problemId
    submission
    status
    feedback
    createdAt
    submittedAt
}
```

## Attempt Status

The MVP uses a simple enum:

```text
draft
submitted
evaluating
evaluated
failed
```

Expected flow:

```text
draft
  ↓
submitted
  ↓
evaluating
  ↓
evaluated
```

Failure path:

```text
evaluating
     ↓
   failed
```

Status changes will be controlled through a service-level transition function.

### Deliberate simplification

A full State Pattern will **not** be implemented for attempt status.

Creating separate classes such as:

```text
DraftState
SubmittedState
EvaluatingState
EvaluatedState
FailedState
```

would add unnecessary complexity for this MVP.

A simple enum with controlled transitions is sufficient.

This is a deliberate engineering trade-off.

---

# 8. Submission Abstraction

Submission is treated as an abstraction so that different submission formats can be supported later.

Conceptually:

```text
Submission
```

Current implementation:

```text
StructuredSubmission
```

Possible future implementations:

```text
DiagramSubmission
CodeSubmission
```

The important design principle is that adding another submission format should not require rewriting the rest of the evaluation pipeline.

---

# 9. Evaluation Architecture

Evaluation is intentionally divided into different layers because LLD does not have a single universally correct answer.

```text
                     Submission
                          ↓
                  CompositeEvaluator
                    /             \
                   /               \
                  ↓                 ↓
      Deterministic Evaluator     LLM Evaluator
             /        \                 ↓
            ↓          ↓              Claude
      Structural    Heuristic
            \          /
             \        /
              ↓      ↓
             Feedback
```

---

# 10. Structural Evaluation

Structural checks are high-confidence, rule-based observations.

Examples:

### Too many responsibilities

```text
responsibilities.length > 5
```

Possible feedback:

> This class has many listed responsibilities. Consider whether some responsibilities belong in separate classes.

### Other possible checks

* A class has an unusually large number of responsibilities.
* A class has no listed relationships.
* An explicitly required class is missing.
* Other mechanically detectable structural conditions.

These checks are designed to be transparent and easy to verify.

They should produce **observations**, not claim that the learner's entire design is incorrect.

---

# 11. Heuristic Evaluation

Some useful checks cannot be treated as fully objective.

For example, a problem may list:

```text
State Pattern
```

as a potentially useful concept.

If the learner's submission does not contain terms such as:

```text
state
mode
transition
```

the system may generate a suggestion.

Example:

> The problem may benefit from explicit state-based modeling. Your submission does not clearly indicate such an approach.

This is a **heuristic**, not a proof that the learner's design is wrong.

A learner may have implemented the same concept using different terminology or a different valid design.

Therefore:

```text
Structural → High confidence
Heuristic  → Medium confidence
```

The system should not present heuristic findings as definitive verdicts.

---

# 12. AI Evaluation

The LLM is responsible for contextual design reasoning that simple rules cannot reliably perform.

The LLM receives:

```text
Problem
+
Learner Submission
+
Deterministic Findings
```

The evaluator can reason about:

* Responsibility assignment
* Abstraction quality
* Coupling
* Extensibility
* Whether the design satisfies the stated requirements
* Trade-offs
* Pattern appropriateness
* Possible alternative approaches
* Strengths in the learner's design

Example:

> Pricing logic is closely coupled to `ParkingLot`. If pricing rules are expected to vary, a pricing strategy abstraction could isolate that responsibility and make future changes easier.

The AI should also validate good decisions instead of only finding problems.

Example:

> Keeping vehicle behavior simple rather than creating a separate subclass for every vehicle type can be a reasonable choice when the current requirements do not require vehicle-specific behavior.

---

# 13. Why Not Use AI for Everything?

Using an LLM for every check would make the evaluation harder to trust and explain.

Instead:

```text
Objective / mechanically detectable
                ↓
        Rule-based evaluation

Contextual / judgment-based
                ↓
          LLM evaluation
```

This separation provides:

* Better transparency
* More predictable structural checks
* More useful contextual feedback
* A clearer explanation of where AI is being used

---

# 14. Composite Evaluator

The system uses a `CompositeEvaluator` to combine the different evaluation sources.

Conceptually:

```text
Evaluator
   ├── DeterministicRuleEvaluator
   ├── LLMEvaluator
   └── CompositeEvaluator
```

`CompositeEvaluator` coordinates both evaluators and produces the final feedback report.

---

# 15. Evaluation Failure Handling

LLM evaluation may fail because of:

* API errors
* Timeout
* Temporary service failure
* Invalid LLM response

The application should not discard all feedback when this happens.

Expected behavior:

```text
Submission
    ↓
Evaluating
    ↓
LLM failure
    ↓
Structural + Heuristic feedback still available
```

The feedback UI should explicitly communicate this.

Example:

> AI Insights — unavailable right now. Structural and heuristic feedback is still available.

The report should indicate:

```text
llmAvailable: false
```

This keeps the failure visible rather than silently hiding it.

---

# 16. Feedback Report

The feedback report is divided into three categories:

```text
FeedbackReport {
    structural[]
    heuristic[]
    aiInsights[]
    llmAvailable
    summary
}
```

Each finding can contain information such as:

```text
Finding {
    category
    severity
    message
    source
    confidence
}
```

Conceptually:

```text
source:
    rule
    ai

confidence:
    high
    medium
    contextual
```

---

# Feedback UX

The feedback screen will contain three visually distinct sections.

## Attempt Summary

A short overall summary.

Example:

> Solid start, but a few structural and design gaps are worth addressing.

---

## 🔧 Structural Checks

**High confidence**

These are rule-based observations.

Example:

> `ParkingSpot` has 7 listed responsibilities. Consider whether some responsibilities belong in a separate class.

---

## 💡 Worth Considering

**Medium confidence**

These are heuristic suggestions.

Example:

> The problem may benefit from explicit state-based modeling. Your submission does not clearly indicate such an approach.

---

##  AI Insights

**Contextual**

These are LLM-generated design insights.

Example:

> Pricing logic inside `ParkingLot` may make future pricing variations harder to support. A pricing strategy abstraction could isolate this concern.

The learner should be able to distinguish between:

```text
Objective observation
        vs
Heuristic suggestion
        vs
Contextual AI judgment
```

This transparency is an intentional product decision.

---

# Attempt History

The learner should be able to see previous attempts.

Example:

```text
Parking Lot

Attempt 1
3 findings

Attempt 2
2 findings

Attempt 3
1 finding
```

The purpose is not simply to store submissions.

The history supports the larger product goal:

```text
Practice
   ↓
Feedback
   ↓
Improve
   ↓
Try Again
```

---

# 21. Current Architecture at a Glance

```text
                         LLD PRACTICE PLATFORM

                              Learner
                                 │
                                 ↓
                         Choose Problem
                                 │
                                 ↓
                              Attempt
                                 │
                                 ↓
                     Structured Submission
                                 │
                                 ↓
                      Composite Evaluator
                         /             \
                        ↓               ↓
               Rule Evaluation       AI Evaluation
                  /       \               │
                 ↓         ↓              ↓
           Structural   Heuristic       Claude
                 \         /               /
                  \       /               /
                   └─────┬───────────────┘
                         ↓
                   Feedback Report
                         │
             ┌───────────┼───────────┐
             ↓           ↓           ↓
        Structural     Worth       AI
         Checks      Considering  Insights
                         │
                         ↓
                      History
                         │
                         ↓
                     Try Again
```

---


Implementation should begin only after the API and database responsibilities are clearly understood.

---

## Core Product Statement

> **LLD Practice Platform is a focused practice tool where learners can attempt LLD problems, submit structured designs, receive transparent rule-based and AI-assisted feedback, review previous attempts, and improve through repeated practice.**
