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

# Experiment 1: Scenario 1 Baseline Control

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

# Experiment 2: Scenario 1 Real Qwen One-Shot Implementation

## Question

Can a local coding model implement the TrackHire interview scheduling task in a single implementation pass?

## Model

`qwen2.5-coder:7b`

Runtime environment:

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
```

No diagnosis or repair loop was used.

## Result

Overall success:

**FAIL**

Deterministic validation:

**FAIL**

Acceptance criteria:

**0 / 5**

Runtime:

**338.6 seconds**

Model usage:

- Input tokens: 5,436
- Output tokens: 5,187
- Estimated model cost: $0
- Human interventions: 1

## Observed Failure

The model identified the general files and feature areas that needed to change, but the generated implementation contained basic type and nullability errors.

Observed problems included:

- `DateTime` and `String` mismatches.
- Nullable values used where non-null values were required.
- Incorrect comparison behavior involving nullable interview dates.
- UI code assigning a `DateTime?` value where a string value was expected.
- Tests using string dates while the implementation expected `DateTime?`.
- Incorrect or incomplete filtering behavior for missing and past interview dates.

The generated implementation failed static analysis and caused the regression criterion to fail.

## Interpretation

The model showed useful high-level task understanding but did not produce a repository-consistent implementation in one pass.

Deterministic validation prevented the generated change from being treated as successful.

This result does not establish that Qwen cannot complete the task with recovery, stronger context, a different prompt, or a different orchestration strategy. It establishes only that this one-shot implementation failed under the measured configuration.

---

# Experiment 3: Initial Strategy Comparison

## Question

Does labeling execution as lightweight versus sequential produce a meaningful difference when both strategies use effectively the same implementation path?

## Strategies

- Lightweight
- Sequential

Both strategies used the same model-backed builder and the same hard-coded implementation plan.

## Result

Lightweight:

- Overall success: FAIL
- Deterministic validation: FAIL
- Acceptance criteria: 0 / 5
- Runtime: 273.0 seconds
- Input tokens: 5,436
- Output tokens: 5,187
- Human interventions: 1

Sequential:

- Overall success: FAIL
- Deterministic validation: FAIL
- Acceptance criteria: 0 / 5
- Runtime: 245.8 seconds
- Input tokens: 5,436
- Output tokens: 5,187
- Human interventions: 1

The AI-modified source produced by the two runs was byte-identical.

## Interpretation

This was not a valid comparison of orchestration strategies.

Changing the strategy label without changing the execution behavior does not create a meaningful experimental treatment.

This result led to separating the actual sequential strategy from the lightweight strategy by wiring diagnosis and bounded repair into the sequential path.

The result should not be used as evidence that lightweight and sequential orchestration perform equally.

---

# Experiment 4: Controlled Bounded Recovery

## Question

Can the factory detect a failed implementation, diagnose a repairable problem, apply a bounded repair, and revalidate successfully?

## Strategy

The experiment used the real recovery architecture:

```text
Implementation
  ↓
Validation FAIL
  ↓
Diagnosis
  ↓
Repair
  ↓
Validation PASS
```

Model behavior was replaced with deterministic providers so the orchestration itself could be tested independently from local-model quality and latency.

## Result

The controlled experiment successfully demonstrated:

- Initial deterministic validation failure.
- Structured failure diagnosis.
- Repairability classification.
- High-confidence repair decision.
- Transition into repair.
- Corrected file output.
- Revalidation after repair.
- Successful validation after the repair.

## Interpretation

The bounded recovery architecture works under a controlled, reproducible failure.

This verifies orchestration behavior, not Qwen's ability to perform the diagnosis or repair.

---

# Experiment 5: Controlled Human Escalation

## Question

Can the factory refuse unsafe or low-confidence recovery and escalate the task to a human?

## Strategy

A deterministic failure was paired with a diagnosis containing:

- `REQUIREMENT_AMBIGUITY`
- `repairable: false`
- Low confidence
- `requiresHumanInput: true`

## Result

The factory:

- Ran validation once.
- Ran diagnosis once.
- Did not invoke repair.
- Transitioned the task to `NEEDS_HUMAN`.
- Preserved the failing workspace without applying the configured unsafe repair.

## Interpretation

The factory can distinguish a repairable failure from a failure that should not be automatically modified.

This provides deterministic evidence that human escalation is an explicit part of the orchestration rather than an afterthought.

---

# Experiment 6: Real-Model Bounded Recovery Attempt

## Question

Can the real local Qwen model execute the full implementation, diagnosis, and bounded repair path within a practical local runtime?

## Model

`qwen2.5-coder:7b`

Runtime environment:

Local Ollama inference on the development machine.

## Strategy

The real sequential recovery path allowed multiple model calls for:

- Implementation.
- Diagnosis.
- Repair.
- Revalidation and possible additional recovery cycles.

## Result

The experiment was manually stopped after approximately three hours.

A final successful or failed engineering result was therefore not established.

## Interpretation

This experiment revealed an operational limitation of the current local-model configuration.

Multi-call agent workflows can introduce substantial latency and local compute cost even when monetary API cost is zero.

A strategy that performs more reasoning or recovery is not automatically preferable if the additional model calls make execution impractical.

The stopped run should not be interpreted as evidence that bounded recovery fails technically. The deterministic recovery experiment already verifies the orchestration path itself.

---

# Benchmark Scenario 2: TrackHire Application Status Summary

## Task

Add a status summary that reports how many tracked job applications exist in each application status.

The implementation must support:

1. Correct counts for applications in each status.
2. Zero counts for supported statuses with no applications.
3. Updated counts when the application collection changes.
4. Representation of every supported TrackHire application status.
5. Preservation of existing TrackHire behavior.

## Deterministic Acceptance Criteria

The benchmark contains five acceptance criteria:

- `counts-statuses`
- `zero-counts`
- `updates-summary`
- `all-statuses`
- `regression`

The first four verify the new feature.

The final criterion verifies that existing TrackHire behavior remains valid.

This scenario tests a different engineering behavior from Scenario 1. Instead of date representation and serialization, it focuses primarily on repository-aware data aggregation and consistency with existing application APIs.

---

# Experiment 7: Scenario 2 Baseline Control

## Question

Does the second benchmark correctly distinguish the requested status-summary feature from untouched TrackHire behavior?

## Strategy

No AI implementation is performed.

The protected benchmark fixture is installed into an isolated workspace and evaluated against the untouched TrackHire repository.

## Result

| Criterion | Result |
|---|---|
| Count applications by status | FAIL |
| Return zero for empty statuses | FAIL |
| Update summary with application collection | FAIL |
| Represent all supported statuses | FAIL |
| Existing regression behavior | PASS |

Feature acceptance:

**0 / 4**

Regression:

**PASS**

Overall baseline:

**FAIL**

## Interpretation

This is the expected control result.

Untouched TrackHire does not already implement the status-summary feature, while its existing behavior passes regression validation.

This establishes Scenario 2 as a valid benchmark control.

---

# Experiment 8: Scenario 2 Real Qwen One-Shot Implementation

## Question

Can the same local coding model complete a second TrackHire engineering task involving application-state aggregation and repository API consistency?

## Model

`qwen2.5-coder:7b`

Runtime environment:

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
```

No diagnosis or repair loop was used.

## Result

Overall success:

**FAIL**

Deterministic validation:

**FAIL**

Acceptance criteria:

**0 / 5**

Runtime:

**189.3 seconds**

Model usage:

- Input tokens: 3,775
- Output tokens: 3,270
- Total tokens: 7,045
- Estimated model cost: $0
- Human interventions: 1

Acceptance results:

| Criterion | Result |
|---|---|
| `counts-statuses` | FAIL |
| `zero-counts` | FAIL |
| `updates-summary` | FAIL |
| `all-statuses` | FAIL |
| `regression` | FAIL |

## Generated Implementation

The production change added a `statusSummary` getter to `ApplicationProvider` that counted:

- `Applied`
- `Interviewing`
- `Offer`
- `Rejected`

At a high level, this was directionally aligned with the requested feature.

However, the model also modified `test/job_application_test.dart` in ways that were inconsistent with the actual repository API.

## Deterministic Failure Evidence

Running Flutter analysis against the generated implementation produced:

**61 analyzer issues**

The generated tests instantiated `JobApplication` objects with only a `status` argument even though the existing constructor requires additional fields including:

- `company`
- `role`
- `dateApplied`
- `location`
- `salaryRange`
- `notes`
- Application-material flags
- `isSaved`

The generated test also called:

```dart
JobApplication.statusSummary(applications)
```

but the model had implemented the feature as:

```dart
ApplicationProvider.statusSummary
```

The analyzer therefore reported that `statusSummary` was not defined for `JobApplication`.

There was also a status-name inconsistency:

- Production implementation used `Offer`.
- Generated test used `Offered`.

## Failure Classification

Primary classification:

`INCORRECT_IMPLEMENTATION`

More specifically, the run demonstrated:

- Cross-file API inconsistency.
- Failure to respect the existing model constructor contract.
- Inconsistency between implementation and generated tests.
- Inconsistent status naming.
- Regression introduced by generated test code.

## Interpretation

The model understood the broad feature intent and produced a plausible provider-level aggregation implementation.

However, it failed to maintain consistency across the repository.

This is a different failure pattern from Scenario 1.

Scenario 1 primarily exposed type, nullability, date representation, and filtering problems.

Scenario 2 primarily exposed repository API and cross-file consistency problems.

In both cases:

- The untouched repository passed regression validation.
- The model-generated implementation failed deterministic validation.
- The model-generated implementation failed all five benchmark criteria.
- Regression validation caught model-introduced problems.
- No generated change was accepted based only on plausible-looking code.

The second run was faster than Scenario 1, but still required more than three minutes of sustained local inference.

---

# Current Evidence

The experiments currently support the following conclusions.

## Supported

### Deterministic validation is necessary

Both real Qwen one-shot runs generated code that was directionally related to the task but failed deterministic verification.

Plausible-looking generated code was not sufficient evidence of correctness.

### Repository consistency is a major failure surface

The second real-model run demonstrated that a coding model can understand the requested feature while still generating tests and API calls that conflict with the repository it is modifying.

### Regression checks provide independent value

Both benchmark baselines passed regression validation.

Both real-model one-shot implementations caused regression validation to fail.

This allows the benchmark to distinguish between a missing feature and a model-introduced regression.

### Controlled bounded recovery works

The deterministic recovery experiment verifies that the factory can diagnose a repairable failure, execute a bounded repair, and revalidate the result.

### Human escalation works

The deterministic escalation experiment verifies that low-confidence or unsafe recovery can be stopped before repair and escalated to a human.

### Local inference has meaningful operational cost

Although local Ollama inference has no API charge, real model runs consume substantial time and compute.

The two completed one-shot runs required approximately:

- 338.6 seconds for Scenario 1.
- 189.3 seconds for Scenario 2.

The multi-call recovery experiment was stopped after approximately three hours.

Latency and compute therefore need to be treated as first-class evaluation metrics rather than hidden costs.

---

# Claims Not Yet Supported

The current evidence does not establish that:

- Sequential orchestration outperforms lightweight execution on real-model tasks.
- Bounded recovery improves Qwen's real-world task success rate.
- Qwen cannot complete either benchmark under a different configuration.
- Multi-agent execution outperforms single-agent execution.
- Parallel execution improves engineering outcomes.
- A larger or different model would produce the same failures.
- The current two benchmark scenarios are representative of software engineering tasks generally.

These questions require additional controlled experiments.

---

# Evaluation Strategy Going Forward

Development and evaluation should use two layers.

## Layer 1: Fast Deterministic Verification

Use deterministic providers to test:

- State transitions.
- Diagnosis routing.
- Bounded repair.
- Human escalation.
- Evidence handling.
- Benchmark aggregation.
- Reporting.
- Orchestration correctness.

These tests should run in seconds and should be used during normal development.

## Layer 2: Selective Real-Model Evaluation

Use real models only when the experiment requires measuring model behavior.

Real-model runs should be selected intentionally and should record:

- Task success.
- Acceptance criteria.
- Regression behavior.
- Failure classification.
- Runtime.
- Token usage.
- Cost.
- Human intervention.
- Number of model calls.

This avoids repeatedly paying local inference latency merely to verify deterministic orchestration logic.

---

# Next Experimental Question

The next useful question is not whether another strategy label can be added.

The next useful question is:

> Under controlled conditions, when does additional orchestration improve engineering outcomes enough to justify its additional model calls, latency, and complexity?

Future experiments should compare genuinely different execution paths while keeping the task, repository baseline, acceptance criteria, validation, and model configuration controlled.