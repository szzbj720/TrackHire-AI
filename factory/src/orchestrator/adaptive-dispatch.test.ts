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

function createTask(
  mode:
    | "single-agent"
    | "sequential"
    | "parallel",
): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-DISPATCH-001",
    request: "Make a change.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [
      "Make the requested change.",
    ],
    acceptanceCriteria: [
      "Validation passes.",
    ],
    constraints: [],
    strategy: {
      mode,
      reasoning: "Test routing strategy.",
    },
    plan: {
      summary: "Implement the change.",
      steps: [
        {
          order: 1,
          description: "Update the file.",
          files: ["lib/example.dart"],
          rationale: "Required by the task.",
        },
      ],
      affectedFiles: [
        "lib/example.dart",
      ],
      validationSteps: [
        "Run tests.",
      ],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

class FakeSequentialFactory
  implements SequentialFactoryAdapter
{
  resumeAfterFinalApproval = vi.fn(
    async (): Promise<never> => {
      throw new Error(
        "resumeAfterFinalApproval should not be called in this test.",
      );
    },
  );

  resumeAfterPlanApproval = vi.fn(
    async (
      run: SequentialFactoryRun,
    ): Promise<SequentialFactoryResult> => ({
      run: {
        ...run,
        task: {
          ...run.task,
          status: "AWAITING_FINAL_APPROVAL",
        },
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    }),
  );

  async start(): Promise<never> {
    throw new Error(
      "start should not be called in this test.",
    );
  }
}

function createSequentialResult(): AdaptiveFactoryResult {
  return {
    run: {
      task: createTask("sequential"),
      repairs: [],
    },
    route: {
      route: "SEQUENTIAL",
      policy: {
        mode: "sequential",
        disposition: "SUPPORTED_SEQUENTIAL",
        reasoning:
          "Sequential execution is supported.",
      },
    },
    stopReason: "PLAN_APPROVAL_REQUIRED",
  };
}

function createParallelResult(): AdaptiveFactoryResult {
  return {
    run: {
      task: createTask("parallel"),
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

describe("AdaptiveFactory plan approval dispatch", () => {
  it("dispatches a sequential route through the sequential factory", async () => {
    const sequentialFactory =
      new FakeSequentialFactory();

    const factory = new AdaptiveFactory(
      sequentialFactory,
    );

    const result =
      await factory.resumeAfterPlanApproval(
        createSequentialResult(),
        "/repository",
        "main",
      );

    expect(
      sequentialFactory.resumeAfterPlanApproval,
    ).toHaveBeenCalledOnce();

    expect(result.stopReason).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );

    expect(result.run.task.status).toBe(
      "AWAITING_FINAL_APPROVAL",
    );
  });

  it("preserves the adaptive routing decision after sequential execution", async () => {
    const factory = new AdaptiveFactory(
      new FakeSequentialFactory(),
    );

    const result =
      await factory.resumeAfterPlanApproval(
        createSequentialResult(),
        "/repository",
        "main",
      );

    expect(result.route?.route).toBe(
      "SEQUENTIAL",
    );
  });

  it("rejects adaptive resume without a routing decision", async () => {
    const factory = new AdaptiveFactory(
      new FakeSequentialFactory(),
    );

    const result: AdaptiveFactoryResult = {
      run: {
        task: createTask("sequential"),
        repairs: [],
      },
      stopReason: "PLAN_APPROVAL_REQUIRED",
    };

    await expect(
      factory.resumeAfterPlanApproval(
        result,
        "/repository",
        "main",
      ),
    ).rejects.toThrow(
      "Cannot resume adaptive execution without a routing decision.",
    );
  });

  it("rejects parallel preparation when no parallel planning workflow is configured", async () => {
    const factory = new AdaptiveFactory(
      new FakeSequentialFactory(),
    );

    await expect(
      factory.resumeAfterPlanApproval(
        createParallelResult(),
        "/repository",
        "main",
      ),
    ).rejects.toThrow(
      "Cannot prepare parallel execution without a parallel planning workflow.",
    );
  });
});