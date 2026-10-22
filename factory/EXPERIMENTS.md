# AI Engineering Factory Experiments

## Purpose

The AI Engineering Factory is designed to answer a practical question:

> When does additional AI-agent orchestration actually improve software engineering outcomes, and when does it only add cost, latency, or complexity?

TrackHire is the first real-world codebase used to evaluate the factory.

The goal of these experiments is not to demonstrate that an LLM can generate code. The goal is to measure whether different execution strategies produce software changes that are correct, validated, recoverable, and trustworthy.

---

## Experimental Principles

Experiments should preserve the following controls whenever possible:

- Same engineering task
- Same repository baseline
- Same acceptance criteria
- Same deterministic validation
- Same model when comparing orchestration strategies
- Isolated Git worktrees for every run
- Structured benchmark results
- No manual correction of generated code during a run

Primary measurements include:

- Overall task success
- Deterministic validation pass rate
- Acceptance-criteria pass rate
- Individual criterion pass rate
- Runtime
- Input tokens
- Output tokens
- Estimated model cost
- Human interventions

Negative results are considered useful evidence.

A strategy is not considered better simply because it uses more agents or more model calls.

---

# Benchmark Scenario 1: TrackHire Interview Scheduling

## Task

Add optional interview scheduling support to TrackHire.

The implementation must support:

1. An optional interview date on a job application.
2. Persistence of the interview date through serialization and deserialization.
3. Editing an existing interview date.
4. Deriving upcoming interviews in chronological order while excluding missing and past dates.
5. Preservation of existing TrackHire behavior.

## Deterministic Acceptance Criteria

The benchmark contains five acceptance criteria:

- `optional-date`
- `persist-date`
- `edit-date`
- `upcoming-interviews`
- `regression`

The first four verify the new feature.

The final criterion verifies that existing TrackHire behavior remains valid.

---

# Experiment 1: Baseline Control

## Question

Does the benchmark correctly distinguish an implementation that contains the requested feature from the untouched TrackHire repository?

## Strategy

No AI implementation is performed.

The benchmark is executed directly against the baseline repository.

## Result

| Criterion | Result |
|---|---|
| Optional interview date | FAIL |
| Persist interview date | FAIL |
| Edit interview date | FAIL |
| Upcoming interviews | FAIL |
| Existing regression behavior | PASS |

Feature acceptance:

**0 / 4**

Regression:

**PASS**

## Interpretation

This is the expected control result.

The untouched TrackHire repository does not contain the requested interview scheduling feature, while its existing behavior remains valid.

This demonstrates that the benchmark is capable of detecting the missing feature without incorrectly treating the original application as broken.

---

# Experiment 2: Real Qwen One-Shot Implementation

## Question

Can a local coding model implement the TrackHire interview scheduling task in a single implementation pass?

## Model

`qwen2.5-coder:7b`

Runtime:

Local Ollama inference.

Estimated API cost:

**$0**

## Strategy

Single implementation pass:

```text
Task
  ↓
Implementation
  ↓
Deterministic validation
  ↓
Acceptance evaluation