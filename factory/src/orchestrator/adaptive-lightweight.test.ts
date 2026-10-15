import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { Builder } from "../agents/builder.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import type { Validator } from "../validation/validator.js";
  import { LightweightWorkflow } from "./lightweight-workflow.js";
  import {
    AdaptiveFactory,
    type AdaptiveFactoryResult,
    type SequentialFactoryStarter,
  } from "./adaptive-factory.js";
  
  vi.mock("../tools/git-worktree.js", () => ({
    createTaskWorktree: vi.fn(async () => ({
      path: "/tmp/factory-adaptive-lightweight",
      branch: "factory/TH-ADAPTIVE-LIGHT-001",
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
      validationSteps: [
        "Run deterministic validation.",
      ],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-ADAPTIVE-LIGHT-001",
      request: "Make a low-risk change.",
      status: "AWAITING_PLAN_APPROVAL",
      requirements: [
        "Make the requested change.",
      ],
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
    };
  }
  
  class FakeSequentialFactory
    implements SequentialFactoryStarter
  {
    async start(): Promise<never> {
      throw new Error(
        "start should not be called in this test.",
      );
    }
  }
  
  function createAdaptiveResult(): AdaptiveFactoryResult {
    return {
      run: {
        task: createTask(),
        repairs: [],
      },
      route: {
        route: "LIGHTWEIGHT",
        policy: {
          mode: "single-agent",
          disposition: "SUPPORTED_LIGHTWEIGHT",
          reasoning:
            "The single-agent strategy uses lightweight execution.",
        },
      },
      stopReason: "LIGHTWEIGHT_EXECUTION_REQUIRED",
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
  
  describe("AdaptiveFactory lightweight execution", () => {
    it("continues a lightweight route to final approval when validation passes", async () => {
      const workflow = new LightweightWorkflow(
        createBuilder(),
        createValidator(true),
      );
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        workflow,
      );
  
      const result =
        await factory.resumeLightweightAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        );
  
      expect(result.stopReason).toBe(
        "FINAL_APPROVAL_REQUIRED",
      );
      expect(result.run.task.status).toBe(
        "AWAITING_FINAL_APPROVAL",
      );
      expect(result.run.implementation).toBeDefined();
      expect(result.run.validation?.passed).toBe(true);
    });
  
    it("escalates a lightweight route when validation fails", async () => {
      const workflow = new LightweightWorkflow(
        createBuilder(),
        createValidator(false),
      );
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        workflow,
      );
  
      const result =
        await factory.resumeLightweightAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        );
  
      expect(result.stopReason).toBe(
        "HUMAN_INPUT_REQUIRED",
      );
      expect(result.run.task.status).toBe(
        "NEEDS_HUMAN",
      );
      expect(result.run.validation?.passed).toBe(false);
    });
  
    it("escalates when the lightweight builder requires human input", async () => {
      const workflow = new LightweightWorkflow(
        createBuilder(true),
        createValidator(true),
      );
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        workflow,
      );
  
      const result =
        await factory.resumeLightweightAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        );
  
      expect(result.stopReason).toBe(
        "HUMAN_INPUT_REQUIRED",
      );
      expect(result.run.task.status).toBe(
        "NEEDS_HUMAN",
      );
      expect(result.run.validation).toBeUndefined();
    });
  
    it("rejects lightweight resume for a non-lightweight stop reason", async () => {
      const workflow = new LightweightWorkflow(
        createBuilder(),
        createValidator(true),
      );
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        workflow,
      );
  
      await expect(
        factory.resumeLightweightAfterPlanApproval(
          {
            ...createAdaptiveResult(),
            stopReason: "PLAN_APPROVAL_REQUIRED",
          },
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Cannot resume lightweight execution from stop reason PLAN_APPROVAL_REQUIRED.",
      );
    });
  
    it("rejects lightweight resume when no lightweight workflow is configured", async () => {
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
      );
  
      await expect(
        factory.resumeLightweightAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Cannot resume lightweight execution without a lightweight workflow.",
      );
    });
  });