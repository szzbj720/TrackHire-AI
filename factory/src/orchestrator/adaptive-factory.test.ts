import { describe, expect, it, vi } from "vitest";
import type { EngineeringTask } from "../schemas/task.js";
import type {
  SequentialFactoryResult,
} from "./sequential-factory.js";
import {
  AdaptiveFactory,
  type SequentialFactoryAdapter,
} from "./adaptive-factory.js";

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-ADAPTIVE-001",
    request: "Test adaptive execution.",
    status: "TASK_CREATED",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createPlannedResult(
  mode: "single-agent" | "sequential" | "parallel",
): SequentialFactoryResult {
  return {
    run: {
      task: {
        ...createTask(),
        status: "AWAITING_PLAN_APPROVAL",
        strategy: {
          mode,
          reasoning: `Selected ${mode}.`,
        },
      },
      repairs: [],
    },
    stopReason: "PLAN_APPROVAL_REQUIRED",
  };
}

class FakeSequentialFactory
  implements SequentialFactoryAdapter
{
  resumeAfterPlanApproval = vi.fn(
    async (): Promise<never> => {
      throw new Error(
        "resumeAfterPlanApproval should not be called in this test.",
      );
    },
  );

  calls = 0;

  constructor(
    private readonly result: SequentialFactoryResult,
  ) {}

  resumeAfterFinalApproval = vi.fn(
    async (): Promise<never> => {
      throw new Error(
        "resumeAfterFinalApproval should not be called in this test.",
      );
    },
  );


  async start(
    _task: EngineeringTask,
    _repositoryRoot: string,
  ): Promise<SequentialFactoryResult> {
    this.calls += 1;
    return this.result;
  }
}

describe("AdaptiveFactory", () => {
  it("preserves the sequential approval path for sequential tasks", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult("sequential"),
      );

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const result = await factory.start(
      createTask(),
      "/repository",
    );

    expect(result.stopReason).toBe(
      "PLAN_APPROVAL_REQUIRED",
    );
    expect(result.route?.route).toBe("SEQUENTIAL");
    expect(sequentialFactory.calls).toBe(1);
  });

  it("routes low-risk tasks toward lightweight execution", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult("single-agent"),
      );

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const result = await factory.start(
      createTask(),
      "/repository",
    );

    expect(result.stopReason).toBe(
      "LIGHTWEIGHT_EXECUTION_REQUIRED",
    );
    expect(result.route?.route).toBe("LIGHTWEIGHT");
  });

  it("blocks parallel execution and escalates to a human", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult("parallel"),
      );

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const result = await factory.start(
      createTask(),
      "/repository",
    );

    expect(result.stopReason).toBe(
      "HUMAN_INPUT_REQUIRED",
    );
    expect(result.route?.route).toBe(
      "HUMAN_ESCALATION",
    );
    expect(result.run.worktree).toBeUndefined();
    expect(result.run.implementation).toBeUndefined();
  });

  it("preserves human escalation when planning already requires human input", async () => {
    const result: SequentialFactoryResult = {
      run: {
        task: {
          ...createTask(),
          status: "NEEDS_HUMAN",
        },
        repairs: [],
      },
      stopReason: "HUMAN_INPUT_REQUIRED",
    };

    const sequentialFactory =
      new FakeSequentialFactory(result);

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const adaptiveResult = await factory.start(
      createTask(),
      "/repository",
    );

    expect(adaptiveResult.stopReason).toBe(
      "HUMAN_INPUT_REQUIRED",
    );
    expect(adaptiveResult.route).toBeUndefined();
  });

  it("preserves planning failure", async () => {
    const result: SequentialFactoryResult = {
      run: {
        task: {
          ...createTask(),
          status: "FAILED",
        },
        repairs: [],
      },
      stopReason: "FAILED",
    };

    const sequentialFactory =
      new FakeSequentialFactory(result);

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const adaptiveResult = await factory.start(
      createTask(),
      "/repository",
    );

    expect(adaptiveResult.stopReason).toBe("FAILED");
    expect(adaptiveResult.route).toBeUndefined();
  });
});