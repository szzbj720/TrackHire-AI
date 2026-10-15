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
    Repairer,
    RepairerInput,
  } from "../agents/repairer.js";
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
  import type {
    Validator,
  } from "../validation/validator.js";
  import {
    RepairWorkflow,
  } from "./repair-workflow.js";
  
  class FakeRepairer implements Repairer {
    constructor(
      private readonly result:
        ImplementationResult,
    ) {}
  
    async repair(
      _input: RepairerInput,
    ): Promise<ImplementationResult> {
      return this.result;
    }
  }
  
  class FakeValidator implements Validator {
    constructor(
      private readonly result:
        ValidationResult,
    ) {}
  
    async validate(
      _worktreePath: string,
    ): Promise<ValidationResult> {
      return this.result;
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
  
  function createTask(
    repairAttempts = 0,
  ): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to a TrackHire application.",
      status: "REPAIRING",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
      constraints: [],
      repairAttempts,
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
            "Added optional interviewDate.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createRepair(
    requiresHumanInput = false,
  ): ImplementationResult {
    return {
      summary:
        requiresHumanInput
          ? "Repair requires clarification."
          : "Repaired the implementation.",
      changedFiles:
        requiresHumanInput
          ? []
          : [
              {
                path:
                  "lib/models/job_application.dart",
                changeType: "modified",
                summary:
                  "Repaired the application model.",
              },
            ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput,
    };
  }
  
  function createDiagnosis():
    FailureDiagnosis {
    return {
      category: "TEST_REGRESSION",
      summary:
        "An existing test failed.",
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
  
  function createPassedValidation():
    ValidationResult {
    return {
      passed: true,
      checks: [
        {
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
          exitCode: 0,
          stdout:
            "All tests passed.",
          stderr: "",
          durationMs: 100,
          passed: true,
        },
      ],
      failedChecks: [],
      durationMs: 100,
    };
  }
  
  async function createTemporaryWorkspace():
    Promise<string> {
    const workspaceRoot = await mkdtemp(
      join(
        tmpdir(),
        "factory-repair-workflow-test-",
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
  
  describe("RepairWorkflow", () => {
    it("routes a successful repair to REVIEWING", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new RepairWorkflow(
          new FakeRepairer(
            createRepair(),
          ),
          new FakeValidator(
            createPassedValidation(),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createFailedValidation(),
        diagnosis:
          createDiagnosis(),
        worktreePath: workspacePath,
      });
  
      expect(
        result.task.repairAttempts,
      ).toBe(1);
  
      expect(
        result.validation.passed,
      ).toBe(true);
  
      expect(result.task.status).toBe(
        "REVIEWING",
      );
  
      expect(result.repair).toBeDefined();
  
      expect(
        result.repair?.requiresHumanInput,
      ).toBe(false);
    });
  
    it("routes a failed repair back to DIAGNOSING_FAILURE", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new RepairWorkflow(
          new FakeRepairer(
            createRepair(),
          ),
          new FakeValidator(
            createFailedValidation(),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createFailedValidation(),
        diagnosis:
          createDiagnosis(),
        worktreePath: workspacePath,
      });
  
      expect(
        result.task.repairAttempts,
      ).toBe(1);
  
      expect(
        result.validation.passed,
      ).toBe(false);
  
      expect(result.task.status).toBe(
        "DIAGNOSING_FAILURE",
      );
  
      expect(result.repair).toBeDefined();
    });
  
    it("routes a repair requiring human input to NEEDS_HUMAN without consuming an attempt", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new RepairWorkflow(
          new FakeRepairer(
            createRepair(true),
          ),
          new FakeValidator(
            createPassedValidation(),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createFailedValidation(),
        diagnosis:
          createDiagnosis(),
        worktreePath: workspacePath,
      });
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(
        result.task.repairAttempts,
      ).toBe(0);
  
      expect(result.repair).toBeDefined();
  
      expect(
        result.repair?.requiresHumanInput,
      ).toBe(true);
  
      expect(
        result.validation.passed,
      ).toBe(false);
    });
  
    it("escalates to NEEDS_HUMAN when the repair budget is exhausted", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new RepairWorkflow(
          new FakeRepairer(
            createRepair(),
          ),
          new FakeValidator(
            createPassedValidation(),
          ),
          2,
        );
  
      const result = await workflow.run({
        task: createTask(2),
        implementation:
          createImplementation(),
        validation:
          createFailedValidation(),
        diagnosis:
          createDiagnosis(),
        worktreePath: workspacePath,
      });
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(
        result.task.repairAttempts,
      ).toBe(2);
  
      expect(result.repair).toBeUndefined();
  
      expect(
        result.validation.passed,
      ).toBe(false);
    });
  });