# AI Usage

I used AI during this assignment mainly as a development and review aid. I did not use it as a replacement for making the design decisions myself.

A few decisions where AI assistance was useful are below.

## 1. Submission Format

I considered different ways for a learner to submit an LLD solution.

A completely free-form answer would be easier for the learner, but it would be difficult to evaluate consistently. On the other hand, accepting and executing arbitrary code would make the MVP much bigger than needed.

I decided to use a structured submission containing classes, responsibilities, relationships and patterns, with an optional code stub.

This gives the evaluator some concrete information while still allowing different solutions.

## 2. Using More Than Just an LLM

One option was to send the complete submission to an LLM and use its response as the evaluation.

I did not want to depend on that for everything.

I ended up separating the evaluation into structural checks, heuristic checks and AI feedback. This makes simple checks predictable and leaves the more subjective parts to the LLM.

## 3. Expected Concepts Are Not Answer Keys

I initially looked at how problem-specific concepts could be used during evaluation.

I decided not to treat them as mandatory answers. An LLD problem can have multiple reasonable designs, and forcing a particular pattern or class would make the feedback less useful.

They are therefore used as signals for heuristic feedback rather than as a fixed solution.

## 4. Handling AI Failure

I considered making the whole evaluation fail if the Gemini request failed.

I rejected that approach because the basic feedback should still be useful even when an external AI service is temporarily unavailable.

The current evaluator keeps the structural, heuristic and requirement-coverage feedback and marks `llmAvailable` as false when the LLM part cannot be completed.

A complete deterministic/evaluation pipeline failure is handled separately.

## 5. Keeping the Architecture Simple

During the design process, I considered whether patterns such as a full State Pattern or more infrastructure around evaluation were necessary.

For the current scope, I chose simpler solutions.

Attempt status changes are controlled through an explicit transition map, and the application remains a monolith. I felt this was more appropriate for a two-day assignment because the extra infrastructure would add complexity without improving the main practice flow.

## What AI Helped With

AI was also useful for:

- discussing alternative designs
- reviewing implementation decisions
- finding bugs during development
- suggesting test cases
- checking edge cases
- helping write and refine some implementation code

I reviewed these suggestions and changed or rejected them when they did not fit the actual requirements or the scope of the project.

The final implementation was kept aligned with the assignment rather than blindly following AI suggestions.
