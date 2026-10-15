import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { EngineeringTask } from "../schemas/task.js";
  import type {
    SequentialFactoryResult,
    SequentialFactoryRun,
  } from "./sequential-factory.js";
  import {
    AdaptiveFactory,
    type AdaptiveFactoryResult,
    type SequentialFactoryAdapter,
  } from "./adaptive-factory.js";
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-FINAL-001",
      request: "Make a change.",
      status: "AWAITING_FINAL_APPROVAL",
      requirements: ["Make the requested change."],
      acceptanceCriteria: ["Validation passes."],
      constraints: [],
      strategy: {
        mode: "single-agent",
        reasoning: "Low-risk task.",
      },
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  class FakeSequentialFactory
    implements SequentialFactoryAdapter
  {
    start = vi.fn(
      async (): Promise<never> => {
        throw new Error(
          "start should not be called in this test.",
        );
      },
    );
  
    resumeAfterPlanApproval = vi.fn(
      async (): Promise<never> => {
        throw new Error(
          "resumeAfterPlanApproval should not be called in this test.",
        );
      },
    );
  
    resumeAfterFinalApproval = vi.fn(
      async (
        run: SequentialFactoryRun,
      ): Promise<SequentialFactoryResult> => ({
        run: {
          ...run,
          task: {
            ...run.task,
            status: "COMPLETE",
          },
        },
        stopReason: "COMPLETE",
      }),
    );
  }
  
  function createResult(
    route: "LIGHTWEIGHT" | "SEQUENTIAL",
  ): AdaptiveFactoryResult {
    return {
      run: {
        task: createTask(),
        repairs: [],
      },
      route: {
        route,
        policy:
          route === "LIGHTWEIGHT"
            ? {
                mode: "single-agent",
                disposition:
                  "SUPPORTED_LIGHTWEIGHT",
                reasoning:
                  "Lightweight execution is supported.",
              }
            : {
                mode: "sequential",
                disposition:
                  "SUPPORTED_SEQUENTIAL",
                reasoning:
                  "Sequential execution is supported.",
              },
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  describe("AdaptiveFactory final approval", () => {
    it("completes a lightweight task after final human approval", async () => {
      const sequentialFactory =
        new FakeSequentialFactory();
  
      const factory = new AdaptiveFactory(
        sequentialFactory,
      );
  
      const result =
        await factory.resumeAfterFinalApproval(
          createResult("LIGHTWEIGHT"),
        );
  
      expect(result.stopReason).toBe("COMPLETE");
      expect(result.run.task.status).toBe("COMPLETE");
  
      expect(
        sequentialFactory.resumeAfterFinalApproval,
      ).not.toHaveBeenCalled();
    });
  
    it("delegates sequential final approval to the sequential factory", async () => {
      const sequentialFactory =
        new FakeSequentialFactory();
  
      const factory = new AdaptiveFactory(
        sequentialFactory,
      );
  
      const result =
        await factory.resumeAfterFinalApproval(
          createResult("SEQUENTIAL"),
        );
  
      expect(
        sequentialFactory.resumeAfterFinalApproval,
      ).toHaveBeenCalledOnce();
  
      expect(result.stopReason).toBe("COMPLETE");
      expect(result.run.task.status).toBe("COMPLETE");
      expect(result.route?.route).toBe("SEQUENTIAL");
    });
  
    it("rejects final approval before the task reaches the final approval gate", async () => {
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
      );
  
      await expect(
        factory.resumeAfterFinalApproval({
          ...createResult("LIGHTWEIGHT"),
          stopReason: "HUMAN_INPUT_REQUIRED",
        }),
      ).rejects.toThrow(
        "Cannot approve final result from stop reason HUMAN_INPUT_REQUIRED.",
      );
    });
  
    it("rejects final approval without a routing decision", async () => {
      const factory = new AdaptiveFactory(
        new FakeSequentialFactory(),
      );
  
      await expect(
        factory.resumeAfterFinalApproval({
          run: {
            task: createTask(),
            repairs: [],
          },
          stopReason: "FINAL_APPROVAL_REQUIRED",
        }),
      ).rejects.toThrow(
        "Cannot approve final result without a routing decision.",
      );
    });
  });