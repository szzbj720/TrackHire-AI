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
import {
  ModelDiagnostician,
  type DiagnosticianInput,
} from "./diagnostician.js";

class FakeModelProvider
  implements ModelProvider
{
  lastRequest?:
    ModelRequest;

  constructor(
    private readonly content: string,
  ) {}

  async generate(
    request: ModelRequest,
  ): Promise<ModelResponse> {
    this.lastRequest =
      request;

    return {
      content: this.content,
      model: "fake-model",
    };
  }
}

function createTask():
  EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id: "TH-001",
    request:
      "Add an optional interview date to a TrackHire application.",
    status:
      "DIAGNOSING_FAILURE",
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

function createPlan():
  ImplementationPlan {
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
        changeType:
          "modified",
        summary:
          "Added optional interviewDate field.",
      },
    ],
    commandsRun: [],
    assumptions: [],
    warnings: [],
    requiresHumanInput: false,
  };
}

function createFailedValidation():
  ValidationResult {
  return {
    passed: false,
    checks: [
      {
        name:
          "Flutter tests",
        command:
          "flutter",
        args: [
          "test",
        ],
        exitCode: 1,
        stdout: "",
        stderr:
          "job_application_test.dart failed",
        durationMs: 100,
        passed: false,
      },
    ],
    failedChecks: [
      "Flutter tests",
    ],
    durationMs: 100,
  };
}

function createInput():
  DiagnosticianInput {
  return {
    task: createTask(),
    plan: createPlan(),
    implementation:
      createImplementation(),
    validation:
      createFailedValidation(),
    relevantFiles: [
      {
        path:
          "lib/models/job_application.dart",
        content:
          "class JobApplication {\n  DateTime? interviewDate;\n}\n",
      },
    ],
  };
}

function createValidDiagnosis():
  string {
  return JSON.stringify({
    category:
      "TEST_REGRESSION",
    summary:
      "An existing application model test failed after the model change.",
    evidence: [
      "Flutter tests exited with code 1.",
      "job_application_test.dart failed.",
    ],
    suspectedFiles: [
      "lib/models/job_application.dart",
    ],
    recommendedAction:
      "Inspect the model change and repair the regression.",
    repairable: true,
    confidence: 0.9,
    requiresHumanInput: false,
  });
}

describe(
  "ModelDiagnostician",
  () => {
    it(
      "returns a validated failure diagnosis",
      async () => {
        const provider =
          new FakeModelProvider(
            createValidDiagnosis(),
          );

        const diagnostician =
          new ModelDiagnostician(
            provider,
          );

        const result =
          await diagnostician.diagnose(
            createInput(),
          );

        expect(
          result.category,
        ).toBe(
          "TEST_REGRESSION",
        );

        expect(
          result.repairable,
        ).toBe(true);

        expect(
          result.confidence,
        ).toBe(0.9);

        expect(
          result.requiresHumanInput,
        ).toBe(false);
      },
    );

    it(
      "requests structured JSON output from the model provider",
      async () => {
        const provider =
          new FakeModelProvider(
            createValidDiagnosis(),
          );

        const diagnostician =
          new ModelDiagnostician(
            provider,
          );

        await diagnostician.diagnose(
          createInput(),
        );

        expect(
          provider.lastRequest
            ?.responseSchema,
        ).toBeDefined();

        expect(
          provider.lastRequest
            ?.responseSchema,
        ).toMatchObject({
          type: "object",
          additionalProperties:
            false,
        });
      },
    );

    it(
      "rejects malformed model output",
      async () => {
        const provider =
          new FakeModelProvider(
            JSON.stringify({
              category:
                "TOTALLY_MADE_UP_CATEGORY",
              summary:
                "Something failed.",
              evidence: [],
              suspectedFiles: [],
              recommendedAction:
                "Try something.",
              repairable: true,
              confidence: 5,
              requiresHumanInput:
                false,
            }),
          );

        const diagnostician =
          new ModelDiagnostician(
            provider,
          );

        await expect(
          diagnostician.diagnose(
            createInput(),
          ),
        ).rejects.toThrow();
      },
    );

    it(
      "refuses to diagnose successful validation",
      async () => {
        const provider =
          new FakeModelProvider(
            "{}",
          );

        const diagnostician =
          new ModelDiagnostician(
            provider,
          );

        const input =
          createInput();

        input.validation = {
          ...input.validation,
          passed: true,
          failedChecks: [],
        };

        await expect(
          diagnostician.diagnose(
            input,
          ),
        ).rejects.toThrow(
          "Cannot diagnose a successful validation result.",
        );
      },
    );
  },
);