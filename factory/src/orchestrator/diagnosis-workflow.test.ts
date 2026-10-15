import {
    mkdir,
    mkdtemp,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Diagnostician,
    DiagnosticianInput,
  } from "../agents/diagnostician.js";
  import type {
    FailureDiagnosis,
  } from "../schemas/diagnosis.js";
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
    DiagnosisWorkflow,
  } from "./diagnosis-workflow.js";
  
  class FakeDiagnostician
    implements Diagnostician
  {
    constructor(
      private readonly diagnosis:
        FailureDiagnosis,
    ) {}
  
    async diagnose(
      _input: DiagnosticianInput,
    ): Promise<FailureDiagnosis> {
      return this.diagnosis;
    }
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
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to a TrackHire application.",
      status: "DIAGNOSING_FAILURE",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
      constraints: [],
      repairAttempts: 0,
      plan: createPlan(),
      createdAt: now,
      updatedAt: now,
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
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
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
  
  function createDiagnosis(
    overrides: Partial<FailureDiagnosis> = {},
  ): FailureDiagnosis {
    return {
      category: "TEST_REGRESSION",
      summary:
        "An existing test failed after the implementation.",
      evidence: [
        "Flutter tests exited with code 1.",
      ],
      suspectedFiles: [
        "lib/models/job_application.dart",
      ],
      recommendedAction:
        "Repair the regression.",
      repairable: true,
      confidence: 0.9,
      requiresHumanInput: false,
      ...overrides,
    };
  }
  
  async function createTemporaryWorkspace():
    Promise<string> {
    const workspaceRoot = await mkdtemp(
      join(
        tmpdir(),
        "factory-diagnosis-test-",
      ),
    );
  
    const modelDirectory = join(
      workspaceRoot,
      "lib",
      "models",
    );
  
    await mkdir(modelDirectory, {
      recursive: true,
    });
  
    await writeFile(
      join(
        modelDirectory,
        "job_application.dart",
      ),
      "class JobApplication {\n  DateTime? interviewDate;\n}\n",
      "utf8",
    );
  
    return workspaceRoot;
  }
  
  function createInput(
    worktreePath: string,
  ) {
    return {
      task: createTask(),
      implementation:
        createImplementation(),
      validation:
        createFailedValidation(),
      worktreePath,
    };
  }
  
  describe("DiagnosisWorkflow", () => {
    it("routes a high-confidence repairable failure to REPAIRING", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const diagnostician =
        new FakeDiagnostician(
          createDiagnosis(),
        );
  
      const workflow =
        new DiagnosisWorkflow(
          diagnostician,
        );
  
      const result = await workflow.run(
        createInput(workspacePath),
      );
  
      expect(result.task.status).toBe(
        "REPAIRING",
      );
  
      expect(
        result.diagnosis.repairable,
      ).toBe(true);
    });
  
    it("routes a diagnosis requiring human input to NEEDS_HUMAN", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const diagnostician =
        new FakeDiagnostician(
          createDiagnosis({
            repairable: false,
            requiresHumanInput: true,
            confidence: 0.95,
          }),
        );
  
      const workflow =
        new DiagnosisWorkflow(
          diagnostician,
        );
  
      const result = await workflow.run(
        createInput(workspacePath),
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
    });
  
    it("routes a low-confidence diagnosis to NEEDS_HUMAN", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const diagnostician =
        new FakeDiagnostician(
          createDiagnosis({
            confidence: 0.4,
          }),
        );
  
      const workflow =
        new DiagnosisWorkflow(
          diagnostician,
        );
  
      const result = await workflow.run(
        createInput(workspacePath),
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
    });
  });