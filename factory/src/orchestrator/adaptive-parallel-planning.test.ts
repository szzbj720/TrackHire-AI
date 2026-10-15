import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { Decomposer } from "../agents/decomposer.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import type { WorkGraph } from "../schemas/work-graph.js";
  import {
    AdaptiveFactory,
    type AdaptiveFactoryResult,
    type SequentialFactoryAdapter,
  } from "./adaptive-factory.js";
  import { ParallelPlanningWorkflow } from "./parallel-planning-workflow.js";
  
  function createPlan(): ImplementationPlan {
    return {
      summary:
        "Implement a cross-cutting change.",
      steps: [
        {
          order: 1,
          description: "Update the model.",
          files: ["lib/models/example.dart"],
          rationale: "Required by the feature.",
        },
      ],
      affectedFiles: [
        "lib/models/example.dart",
      ],
      validationSteps: ["Run tests."],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-ADAPTIVE-PARALLEL-001",
      request:
        "Implement a cross-cutting change.",
      status: "AWAITING_PLAN_APPROVAL",
      requirements: [
        "Implement the requested change.",
      ],
      acceptanceCriteria: [
        "Validation passes.",
      ],
      constraints: [],
      strategy: {
        mode: "parallel",
        reasoning:
          "The task requires decomposition.",
      },
      plan: createPlan(),
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createGraph(): WorkGraph {
    return {
      units: [
        {
          id: "model",
          description: "Update the model.",
          files: ["lib/models/example.dart"],
          dependsOn: [],
        },
        {
          id: "ui",
          description: "Update the UI.",
          files: ["lib/screens/example.dart"],
          dependsOn: ["model"],
        },
      ],
    };
  }
  
  class FakeSequentialFactory
    implements SequentialFactoryAdapter
  {
    async start(): Promise<never> {
      throw new Error(
        "start should not be called.",
      );
    }
  
    async resumeAfterPlanApproval(): Promise<never> {
      throw new Error(
        "resumeAfterPlanApproval should not be called.",
      );
    }
  
    async resumeAfterFinalApproval(): Promise<never> {
      throw new Error(
        "resumeAfterFinalApproval should not be called.",
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
        route: "PARALLEL",
        policy: {
          mode: "parallel",
          disposition: "SUPPORTED_PARALLEL",
          reasoning:
            "Parallel execution is supported through controlled decomposition.",
        },
      },
      stopReason: "PLAN_APPROVAL_REQUIRED",
    };
  }
  
  describe("AdaptiveFactory parallel planning", () => {
    it("prepares a validated parallel work graph after plan approval", async () => {
      const decomposer: Decomposer = {
        decompose: vi.fn(
          async () => createGraph(),
        ),
      };
  
      const parallelWorkflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        undefined,
        parallelWorkflow,
      );
  
      const result =
        await factory.resumeAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        );
  
      expect(result.stopReason).toBe(
        "PARALLEL_APPROVAL_REQUIRED",
      );
  
      expect(result.run.task.status).toBe(
        "AWAITING_PARALLEL_APPROVAL",
      );
  
      expect(result.workGraph).toEqual(
        createGraph(),
      );
  
      expect(
        decomposer.decompose,
      ).toHaveBeenCalledOnce();
    });
  
    it("preserves the parallel routing decision", async () => {
      const decomposer: Decomposer = {
        decompose: vi.fn(
          async () => createGraph(),
        ),
      };
  
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
        undefined,
        new ParallelPlanningWorkflow(
          decomposer,
        ),
      );
  
      const result =
        await factory.resumeAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        );
  
      expect(result.route?.route).toBe(
        "PARALLEL",
      );
  
      expect(result.route?.policy.mode).toBe(
        "parallel",
      );
  
      expect(
        result.route?.policy.disposition,
      ).toBe("SUPPORTED_PARALLEL");
    });
  
    it("rejects parallel preparation when no parallel workflow is configured", async () => {
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
      );
  
      await expect(
        factory.resumeAfterPlanApproval(
          createAdaptiveResult(),
          "/repository",
          "main",
        ),
      ).rejects.toThrow(
        "Cannot prepare parallel execution without a parallel planning workflow.",
      );
    });
  });