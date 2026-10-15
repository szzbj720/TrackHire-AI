import {
    afterEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { Builder } from "../agents/builder.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import type { Validator } from "../validation/validator.js";
  import {
    LightweightWorkflow,
  } from "./lightweight-workflow.js";
  
  vi.mock("../tools/git-worktree.js", () => ({
    createTaskWorktree: vi.fn(async () => ({
      path: "/tmp/factory-lightweight",
      branch: "factory/TH-LIGHT-001",
    })),
  }));
  
  function createPlan(): ImplementationPlan {
    return {
      summary: "Make a low-risk change.",
      steps: [
        {
          order: 1,
          description: "Update the approved file.",
          files: ["lib/example.dart"],
          rationale: "Required by the task.",
        },
      ],
      affectedFiles: ["lib/example.dart"],
      validationSteps: ["Run deterministic validation."],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };
  }
  
  function createTask(
    overrides: Partial<EngineeringTask> = {},
  ): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-LIGHT-001",
      request: "Make a low-risk change.",
      status: "AWAITING_PLAN_APPROVAL",
      requirements: ["Make the requested change."],
      acceptanceCriteria: [
        "Deterministic validation passes.",
      ],
      constraints: [],
      strategy: {
        mode: "single-agent",
        reasoning:
          "The task has low complexity and low risk.",
      },
      plan: createPlan(),
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }
  
  function createBuilder(
    requiresHumanInput = false,
  ): Builder {
    return {
      implement: vi.fn(async () => ({
        summary: "Implemented the change.",
        changedFiles: [
          {
            path: "lib/example.dart",
            changeType: "modified" as const,
            summary: "Updated the approved file.",
          },
        ],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput,
      })),
    };
  }
  
  function createValidator(
    passed: boolean,
  ): Validator {
    return {
      validate: vi.fn(async () => ({
        passed,
        checks: [],
        failedChecks: passed
          ? []
          : ["deterministic validation"],
        durationMs: 10,
      })),
    };
  }
  
  describe("LightweightWorkflow", () => {
    afterEach(() => {
      vi.clearAllMocks();
    });
  
    it("moves a passing lightweight task directly to final approval", async () => {
      const builder = createBuilder();
      const validator = createValidator(true);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      const result = await workflow.run(
        createTask(),
        "/repository",
        "main",
      );
  
      expect(result.task.status).toBe(
        "AWAITING_FINAL_APPROVAL",
      );
      expect(result.validation?.passed).toBe(true);
      expect(builder.implement).toHaveBeenCalledOnce();
      expect(validator.validate).toHaveBeenCalledOnce();
    });
  
    it("escalates failed validation instead of starting automated repair", async () => {
      const builder = createBuilder();
      const validator = createValidator(false);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      const result = await workflow.run(
        createTask(),
        "/repository",
        "main",
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
      expect(result.validation?.passed).toBe(false);
      expect(validator.validate).toHaveBeenCalledOnce();
    });
  
    it("returns human escalation when the builder requires input", async () => {
      const builder = createBuilder(true);
      const validator = createValidator(true);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      const result = await workflow.run(
        createTask(),
        "/repository",
        "main",
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
      expect(result.validation).toBeUndefined();
      expect(validator.validate).not.toHaveBeenCalled();
    });
  
    it("rejects a non-single-agent strategy", async () => {
      const builder = createBuilder();
      const validator = createValidator(true);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      await expect(
        workflow.run(
          createTask({
            strategy: {
              mode: "sequential",
              reasoning: "Medium-risk task.",
            },
          }),
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Lightweight execution requires a single-agent strategy.",
      );
    });
  
    it("rejects execution before plan approval is required", async () => {
      const builder = createBuilder();
      const validator = createValidator(true);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      await expect(
        workflow.run(
          createTask({
            status: "PLANNING",
          }),
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Cannot start lightweight execution while task is in state PLANNING",
      );
    });
  
    it("rejects a plan that still requires human input", async () => {
      const builder = createBuilder();
      const validator = createValidator(true);
  
      const workflow = new LightweightWorkflow(
        builder,
        validator,
      );
  
      await expect(
        workflow.run(
          createTask({
            plan: {
              ...createPlan(),
              requiresHumanInput: true,
            },
          }),
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Cannot implement a plan that still requires human input.",
      );
    });
  });