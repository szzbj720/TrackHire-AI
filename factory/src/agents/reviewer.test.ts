import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from "../models/provider.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  ModelReviewer,
  type ReviewerInput,
} from "./reviewer.js";

class FakeModelProvider
  implements ModelProvider
{
  lastRequest?: ModelRequest;

  constructor(
    private readonly content: string,
  ) {}

  async generate(
    request: ModelRequest,
  ): Promise<ModelResponse> {
    this.lastRequest = request;

    return {
      content: this.content,
      model: "fake-model",
    };
  }
}

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-001",
    request:
      "Add an optional interview date to a TrackHire application.",
    status: "REVIEWING",
    requirements: [
      "Interview date must be optional.",
    ],
    acceptanceCriteria: [
      "Existing applications continue to work.",
    ],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createPlan(): ImplementationPlan {
  return {
    summary:
      "Add interview date support.",
    steps: [
      {
        order: 1,
        description:
          "Update the application model.",
        files: [
          "lib/models/job_application.dart",
        ],
        rationale:
          "The model needs to store the interview date.",
      },
    ],
    affectedFiles: [
      "lib/models/job_application.dart",
    ],
    validationSteps: [
      "Run flutter analyze.",
      "Run flutter test.",
    ],
    risks: [],
    assumptions: [
      "Interview date is optional.",
    ],
    requiresHumanInput: false,
  };
}

function createImplementation():
  ImplementationResult {
  return {
    summary:
      "Added interview date support.",
    changedFiles: [
      {
        path:
          "lib/models/job_application.dart",
        changeType: "modified",
        summary:
          "Added optional interviewDate.",
      },
    ],
    commandsRun: [],
    assumptions: [],
    warnings: [],
    requiresHumanInput: false,
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
        stdout: passed
          ? "All tests passed."
          : "",
        stderr: passed
          ? ""
          : "Tests failed.",
        durationMs: 100,
        passed,
      },
    ],
    failedChecks: passed
      ? []
      : ["Flutter tests"],
    durationMs: 100,
  };
}

function createVerification():
  VerificationResult {
  return {
    passed: false,
    probes: [
      {
        probeId:
          "missing-persistence",
        command: "flutter",
        args: [
          "test",
          "test/interview_date_persistence_test.dart",
        ],
        exitCode: 1,
        stdout: "",
        stderr:
          "Interview date was not restored after reload.",
        durationMs: 80,
        passed: false,
      },
    ],
    failedProbes: [
      "missing-persistence",
    ],
    durationMs: 80,
  };
}

function createInput(
  validation = createValidation(),
  verification?: VerificationResult,
): ReviewerInput {
  return {
    task: createTask(),
    plan: createPlan(),
    implementation:
      createImplementation(),
    validation,
    ...(verification
      ? { verification }
      : {}),
    relevantFiles: [
      {
        path:
          "lib/models/job_application.dart",
        content:
          "class JobApplication {\n  final DateTime? interviewDate;\n}\n",
      },
    ],
  };
}

describe("ModelReviewer", () => {
  it(
    "returns a validated independent review",
    async () => {
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            approved: true,
            summary:
              "The implementation satisfies the approved task.",
            findings: [],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "JobApplication.interviewDate is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.92,
          }),
        );

      const reviewer =
        new ModelReviewer(provider);

      const result =
        await reviewer.review(
          createInput(),
        );

      expect(result.approved).toBe(
        true,
      );

      expect(result.confidence).toBe(
        0.92,
      );

      expect(
        result.requirementCoverage,
      ).toHaveLength(1);
    },
  );

  it(
    "returns review findings when problems are detected",
    async () => {
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            approved: false,
            summary:
              "The implementation has a regression risk.",
            findings: [
              {
                severity: "HIGH",
                summary:
                  "Existing behavior may not be preserved.",
                evidence: [
                  "The supplied implementation changes constructor behavior.",
                ],
                files: [
                  "lib/models/job_application.dart",
                ],
                recommendation:
                  "Preserve backwards-compatible construction.",
              },
            ],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "The field is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.87,
          }),
        );

      const reviewer =
        new ModelReviewer(provider);

      const result =
        await reviewer.review(
          createInput(),
        );

      expect(result.approved).toBe(
        false,
      );

      expect(
        result.findings,
      ).toHaveLength(1);

      expect(
        result.findings[0]?.severity,
      ).toBe("HIGH");
    },
  );

  it(
    "includes independent verification evidence in the review request",
    async () => {
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            approved: false,
            summary:
              "Independent verification found a persistence failure.",
            findings: [
              {
                severity: "HIGH",
                summary:
                  "Interview date persistence failed.",
                evidence: [
                  "The missing-persistence verification probe failed.",
                ],
                files: [
                  "lib/models/job_application.dart",
                ],
                recommendation:
                  "Fix persistence before approval.",
              },
            ],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "The field is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.95,
          }),
        );

      const reviewer =
        new ModelReviewer(provider);

      await reviewer.review(
        createInput(
          createValidation(),
          createVerification(),
        ),
      );

      expect(
        provider.lastRequest,
      ).toBeDefined();

      const payload =
        JSON.parse(
          provider.lastRequest
            ?.userPrompt ?? "{}",
        );

      expect(
        payload.verification,
      ).toEqual(
        createVerification(),
      );
    },
  );

  it(
    "returns valid reviews without verification evidence for backward compatibility",
    async () => {
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            approved: true,
            summary:
              "The implementation satisfies the approved task.",
            findings: [],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "The field is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.9,
          }),
        );

      const reviewer =
        new ModelReviewer(provider);

      await reviewer.review(
        createInput(),
      );

      const payload =
        JSON.parse(
          provider.lastRequest
            ?.userPrompt ?? "{}",
        );

      expect(
        payload.verification,
      ).toBeUndefined();
    },
  );

  it(
    "rejects invalid model output",
    async () => {
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            approved: true,
            summary:
              "Implementation approved.",
            findings: [],
            requirementCoverage: [],
            requiresHumanInput: false,
            confidence: 2,
          }),
        );

      const reviewer =
        new ModelReviewer(provider);

      await expect(
        reviewer.review(
          createInput(),
        ),
      ).rejects.toThrow();
    },
  );

  it(
    "refuses to review failed deterministic validation",
    async () => {
      const provider =
        new FakeModelProvider("{}");

      const reviewer =
        new ModelReviewer(provider);

      await expect(
        reviewer.review(
          createInput(
            createValidation(false),
          ),
        ),
      ).rejects.toThrow(
        "Cannot review an implementation that failed deterministic validation.",
      );
    },
  );
});
