import { describe, expect, it, vi } from "vitest";

import type { FactoryRunTrace } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";
import type {
  AdaptiveFactory,
  AdaptiveFactoryResult,
} from "./adaptive-factory.js";
import { FactoryRunner } from "./factory-runner.js";
import type {
  SequentialFactory,
  SequentialFactoryResult,
} from "./sequential-factory.js";

function createTask(mode: "sequential" | "parallel"): EngineeringTask {
  const now = "2026-11-03T00:00:00.000Z";

  return {
    id: `TH-FINAL-${mode}`,
    request: "Complete a factory run after final human approval.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    analysis: {
      complexity: "medium",
      risk: "medium",
      affectedAreas: ["factory"],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning: "Final approval is required.",
    },
    strategy: {
      mode,
      reasoning: `Use ${mode} execution.`,
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createTrace(task: EngineeringTask): FactoryRunTrace {
  return {
    taskId: task.id,
    startedAt: "2026-11-02T23:59:00.000Z",
    observations: [],
  };
}

describe("FactoryRunner final approval", () => {
  it("completes sequential work through the traced final approval boundary", async () => {
    const task = createTask("sequential");
    const pending: SequentialFactoryResult = {
      run: {
        task,
        repairs: [],
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    };
    const completed: SequentialFactoryResult = {
      run: {
        ...pending.run,
        task: {
          ...task,
          status: "COMPLETE",
        },
      },
      stopReason: "COMPLETE",
    };
    const resumeAfterFinalApproval = vi.fn().mockResolvedValue(completed);
    const sequentialFactory = {
      resumeAfterFinalApproval,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);
    const trace = createTrace(task);

    const result = await runner.resumeAfterSequentialFinalApproval(
      pending,
      trace,
    );

    expect(resumeAfterFinalApproval).toHaveBeenCalledWith(pending.run);
    expect(result.sequentialResult).toBe(completed);
    expect(result.trace.startedAt).toBe(trace.startedAt);
    expect(result.trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "COMPLETE",
      },
    });
  });

  it("completes parallel work through the traced final approval boundary", async () => {
    const task = createTask("parallel");
    const pending = {
      run: {
        task,
        repairs: [],
      },
      route: {
        route: "PARALLEL",
        policy: {
          disposition: "SUPPORTED_PARALLEL",
          mode: "parallel",
          reasoning: "Use parallel execution.",
        },
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    } as AdaptiveFactoryResult;
    const completed = {
      ...pending,
      run: {
        ...pending.run,
        task: {
          ...task,
          status: "COMPLETE",
        },
      },
      stopReason: "COMPLETE",
    } as AdaptiveFactoryResult;
    const resumeAfterFinalApproval = vi.fn().mockResolvedValue(completed);
    const sequentialFactory = {} as SequentialFactory;
    const adaptiveFactory = {
      resumeAfterFinalApproval,
    } as unknown as AdaptiveFactory;
    const runner = new FactoryRunner(
      sequentialFactory,
      undefined,
      adaptiveFactory,
    );
    const trace = createTrace(task);

    const result = await runner.resumeAfterParallelFinalApproval(
      pending,
      trace,
    );

    expect(resumeAfterFinalApproval).toHaveBeenCalledWith(pending);
    expect(result.adaptiveResult).toBe(completed);
    expect(result.trace.startedAt).toBe(trace.startedAt);
    expect(result.trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "COMPLETE",
      },
    });
  });
});
