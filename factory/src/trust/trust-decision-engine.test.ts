import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  TrustDecisionEngine,
} from "./trust-decision-engine.js";

function createTask(
  repairAttempts = 0,
  risk: TaskRisk = "low",
  requiresHumanInput = false,
): EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id: "TH-TRUST-001",
    request:
      "Make a safe TrackHire change.",
    status: "REVIEWING",
    requirements: [
      "Preserve existing behavior.",
    ],
    acceptanceCriteria: [
      "The change is verified.",
    ],
    constraints: [],
    analysis: {
      complexity: "medium",
      risk,
      affectedAreas: ["app"],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: 0.9,
      requiresHumanInput,
      reasoning:
        "The task is well understood.",
    },
    strategy: {
      mode: "sequential",
      reasoning: "Use the full sequential workflow.",
    },
    repairAttempts,
    createdAt: now,
    updatedAt: now,
  };
}

function createValidation(
  passed = true,
): ValidationResult {
  return {
    passed,
    checks: [
      {
        name: "Flutter tests",
        command: "flutter",
        args: ["test"],
        exitCode: passed ? 0 : 1,
        stdout: "",
        stderr: "",
        durationMs: 10,
        passed,
      },
    ],
    failedChecks: passed
      ? []
      : ["Flutter tests"],
    durationMs: 10,
  };
}

function createVerification(
  passed = true,
): VerificationResult {
  return {
    passed,
    probes: [
      {
        probeId: "probe-1",
        command: "flutter",
        args: [
          "test",
          "test/probe_test.dart",
        ],
        exitCode: passed ? 0 : 1,
        stdout: "",
        stderr: "",
        durationMs: 10,
        passed,
      },
    ],
    failedProbes: passed
      ? []
      : ["probe-1"],
    durationMs: 10,
  };
}

function createReview(
  overrides:
    Partial<ReviewResult> = {},
): ReviewResult {
  return {
    approved: true,
    summary:
      "The implementation is safe.",
    findings: [],
    requirementCoverage: [
      {
        requirement:
          "Preserve existing behavior.",
        satisfied: true,
        evidence: [
          "Validation evidence supports the requirement.",
        ],
      },
    ],
    requiresHumanInput: false,
    confidence: 0.92,
    ...overrides,
  };
}

describe(
  "TrustDecisionEngine",
  () => {
    it(
      "merges when all trust signals are positive",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(),
            validation:
              createValidation(),
            verification:
              createVerification(),
            review:
              createReview(),
          });

        expect(decision.action).toBe(
          "MERGE",
        );

        expect(
          decision.confidence,
        ).toBe(0.92);
      },
    );

    it(
      "allows verified high-risk work to reach final approval",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(0, "high"),
            validation:
              createValidation(),
            verification:
              createVerification(),
            review:
              createReview(),
          });

        expect(decision.action).toBe(
          "MERGE",
        );
      },
    );

    it(
      "retries when independent verification finds an actionable failure",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(),
            validation:
              createValidation(),
            verification:
              createVerification(false),
            review:
              createReview({
                approved: false,
              }),
          });

        expect(decision.action).toBe(
          "RETRY",
        );
      },
    );

    it(
      "escalates when human judgment is required",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(),
            validation:
              createValidation(),
            verification:
              createVerification(),
            review:
              createReview({
                approved: false,
                requiresHumanInput:
                  true,
                confidence: 0.55,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );

    it(
      "escalates when task analysis requires human input",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(0, "low", true),
            validation:
              createValidation(),
            verification:
              createVerification(false),
            review:
              createReview({
                approved: false,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );

    it(
      "escalates when the low-risk repair budget is exhausted",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(2),
            validation:
              createValidation(),
            verification:
              createVerification(false),
            review:
              createReview({
                approved: false,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );

    it(
      "escalates medium-risk work after one autonomous repair",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(1, "medium"),
            validation:
              createValidation(),
            verification:
              createVerification(false),
            review:
              createReview({
                approved: false,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );

    it(
      "never autonomously retries high-risk work",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(0, "high"),
            validation:
              createValidation(),
            verification:
              createVerification(false),
            review:
              createReview({
                approved: false,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );

    it(
      "escalates instead of merging when review confidence is too low",
      () => {
        const engine =
          new TrustDecisionEngine();

        const decision =
          engine.decide({
            task: createTask(),
            validation:
              createValidation(),
            verification:
              createVerification(),
            review:
              createReview({
                confidence: 0.65,
              }),
          });

        expect(decision.action).toBe(
          "ESCALATE",
        );
      },
    );
  },
);
