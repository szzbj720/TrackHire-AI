import {
    mkdir,
    mkdtemp,
    readFile,
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
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
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
    ModelRepairer,
    type RepairerInput,
  } from "./repairer.js";
  
  class FakeModelProvider
    implements ModelProvider
  {
    constructor(
      private readonly content: string,
    ) {}
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
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
      status: "REPAIRING",
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
            "Added interviewDate.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createValidation():
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
        "The model change caused an existing test to fail.",
      evidence: [
        "Flutter tests exited with code 1.",
      ],
      suspectedFiles: [
        "lib/models/job_application.dart",
      ],
      recommendedAction:
        "Repair the model while preserving existing behavior.",
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
        "factory-repairer-test-",
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
    diagnosis: FailureDiagnosis =
      createDiagnosis(),
  ): RepairerInput {
    return {
      task: createTask(),
      plan: createPlan(),
      implementation:
        createImplementation(),
      validation:
        createValidation(),
      diagnosis,
      relevantFiles: [
        {
          path:
            "lib/models/job_application.dart",
          content:
            "class JobApplication {\n  DateTime? interviewDate;\n}\n",
        },
      ],
      worktreePath,
    };
  }
  
  describe("ModelRepairer", () => {
    it("repairs an approved file inside the workspace", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            summary:
              "Repaired the application model.",
            writes: [
              {
                path:
                  "lib/models/job_application.dart",
                content:
                  "class JobApplication {\n  final DateTime? interviewDate;\n}\n",
                summary:
                  "Preserved the optional interview date while repairing the model.",
              },
            ],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          }),
        );
  
      const repairer =
        new ModelRepairer(provider);
  
      const result =
        await repairer.repair(
          createInput(workspacePath),
        );
  
      const content = await readFile(
        join(
          workspacePath,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );
  
      expect(content).toContain(
        "final DateTime? interviewDate",
      );
  
      expect(
        result.changedFiles,
      ).toHaveLength(1);
  
      expect(
        result.requiresHumanInput,
      ).toBe(false);
  
      expect(result.commandsRun).toEqual(
        [],
      );
    });
  
    it("rejects writes to files outside the approved plan", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const provider =
        new FakeModelProvider(
          JSON.stringify({
            summary:
              "Attempted an out-of-scope repair.",
            writes: [
              {
                path: "README.md",
                content:
                  "Unexpected modification",
                summary:
                  "Modified an unapproved file.",
              },
            ],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          }),
        );
  
      const repairer =
        new ModelRepairer(provider);
  
      await expect(
        repairer.repair(
          createInput(workspacePath),
        ),
      ).rejects.toThrow(
        "Repair attempted to modify unapproved file: README.md",
      );
    });
  
    it("refuses to repair a non-repairable diagnosis", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const provider =
        new FakeModelProvider("{}");
  
      const repairer =
        new ModelRepairer(provider);
  
      await expect(
        repairer.repair(
          createInput(
            workspacePath,
            createDiagnosis({
              repairable: false,
            }),
          ),
        ),
      ).rejects.toThrow(
        "Cannot repair a failure marked as non-repairable.",
      );
    });
  
    it("refuses to repair when human input is required", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const provider =
        new FakeModelProvider("{}");
  
      const repairer =
        new ModelRepairer(provider);
  
      await expect(
        repairer.repair(
          createInput(
            workspacePath,
            createDiagnosis({
              requiresHumanInput: true,
            }),
          ),
        ),
      ).rejects.toThrow(
        "Cannot repair a failure that requires human input.",
      );
    });
  });