import { describe, expect, it, vi } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type {
  AdaptiveFactory,
  AdaptiveFactoryResult,
} from "./adaptive-factory.js";
import type {
  LightweightWorkflow,
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
import type {
  SequentialFactory,
  SequentialFactoryResult,
} from "./sequential-factory.js";
import { FactoryRunner } from "./factory-runner.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T19:50:00.000Z";

  return {
    id: "TH-FACTORY-RUNNER-001",
    request: "Run a sequential task through the factory runner.",
    status: "TASK_CREATED",
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
      reasoning: "Sequential execution is appropriate.",
    },
    strategy: {
      mode: "sequential",
      reasoning: "Use the sequential factory.",
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("FactoryRunner", () => {
  it("rejects tasks that have not completed planning", async () => {
    const plannedTask = createTask();
    const { strategy: _strategy, ...unplannedTask } = plannedTask;
    const start = vi.fn();
    const sequentialFactory = {
      start,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);

    await expect(
      runner.run(
        unplannedTask,
        "/repo",
        "2026-11-02T19:49:00.000Z",
      ),
    ).rejects.toThrow(
      "FactoryRunner requires a planned task with an execution strategy.",
    );

    expect(start).not.toHaveBeenCalled();
  });

  it("routes sequential work through the sequential factory and preserves one trace", async () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      status: "AWAITING_PLAN_APPROVAL",
    };
    const finalTask: EngineeringTask = {
      ...task,
      status: "AWAITING_FINAL_APPROVAL",
      updatedAt: "2026-11-02T19:51:00.000Z",
    };
    const sequentialResult: SequentialFactoryResult = {
      run: {
        task: finalTask,
        repairs: [],
        verification: {
          passed: true,
          probes: [],
          failedProbes: [],
          durationMs: 10,
        },
        trustDecision: {
          action: "MERGE",
          confidence: 0.95,
          reasons: ["Independent verification passed."],
          evidence: [
            {
              source: "verification",
              signal: "Independent verification passed.",
              supportsTrust: true,
            },
          ],
        },
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    };
    const start = vi.fn();
    const resumeAfterPlanApproval = vi.fn().mockResolvedValue(sequentialResult);
    const sequentialFactory = {
      start,
      resumeAfterPlanApproval,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);

    const result = await runner.run(
      task,
      "/repo",
      "2026-11-02T19:50:00.000Z",
      "develop",
    );

    expect(result.decision.route).toBe("SEQUENTIAL");
    expect(start).not.toHaveBeenCalled();
    expect(resumeAfterPlanApproval).toHaveBeenCalledOnce();
    expect(resumeAfterPlanApproval).toHaveBeenCalledWith(
      {
        task,
        repairs: [],
      },
      "/repo",
      "develop",
    );
    expect(result.sequentialResult).toBe(sequentialResult);
    expect(result.trace.taskId).toBe(task.id);
    expect(result.trace.startedAt).toBe("2026-11-02T19:50:00.000Z");
    expect(result.trace.observations.map((observation) => observation.type)).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
      "VERIFICATION_RESULT",
      "TRUST_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
  });

  it("executes lightweight work through the lightweight workflow", async () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      status: "AWAITING_PLAN_APPROVAL",
      strategy: {
        mode: "single-agent",
        reasoning: "Use lightweight execution.",
      },
    };
    const finalTask: EngineeringTask = {
      ...task,
      status: "AWAITING_FINAL_APPROVAL",
      updatedAt: "2026-11-02T19:54:00.000Z",
    };
    const lightweightResult = {
      task: finalTask,
      worktree: {
        path: "/repo/.factory/worktrees/TH-FACTORY-RUNNER-001",
        branch: "factory/TH-FACTORY-RUNNER-001",
      },
      implementation: {
        summary: "Implemented lightweight task.",
        changedFiles: ["src/example.ts"],
        commandsRun: [],
        warnings: [],
        requiresHumanInput: false,
      },
      validation: {
        passed: true,
        commands: [],
        durationMs: 10,
      },
    } as unknown as LightweightWorkflowResult;
    const start = vi.fn();
    const run = vi.fn().mockResolvedValue(lightweightResult);
    const sequentialFactory = {
      start,
    } as unknown as SequentialFactory;
    const lightweightWorkflow = {
      run,
    } as unknown as LightweightWorkflow;
    const runner = new FactoryRunner(
      sequentialFactory,
      lightweightWorkflow,
    );

    const result = await runner.run(
      task,
      "/repo",
      "2026-11-02T19:53:00.000Z",
      "develop",
    );

    expect(result.decision.route).toBe("LIGHTWEIGHT");
    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith(
      task,
      "/repo",
      "develop",
    );
    expect(start).not.toHaveBeenCalled();
    expect(result.lightweightResult).toBe(lightweightResult);
    expect(result.sequentialResult).toBeUndefined();
    expect(result.trace.taskId).toBe(task.id);
    expect(result.trace.startedAt).toBe("2026-11-02T19:53:00.000Z");
    expect(
      result.trace.observations.map(
        (observation) => observation.type,
      ),
    ).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
    expect(result.trace.observations.at(-2)).toMatchObject({
      type: "HUMAN_GATE",
      details: {
        gate: "FINAL_APPROVAL",
      },
    });
    expect(result.trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "FINAL_APPROVAL_REQUIRED",
      },
    });
  });

  it("delegates parallel work to the adaptive factory", async () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      status: "AWAITING_PLAN_APPROVAL",
      strategy: {
        mode: "parallel",
        reasoning: "Use parallel execution.",
      },
    };
    const adaptiveResult = {
      run: {
        task: {
          ...task,
          status: "AWAITING_PARALLEL_APPROVAL",
        },
        repairs: [],
      },
      route: {
        route: "PARALLEL",
        policy: {
          disposition: "SUPPORTED_PARALLEL",
          reasoning: "Use parallel execution.",
        },
      },
      workGraph: {
        taskId: task.id,
        nodes: [],
      },
      stopReason: "PARALLEL_APPROVAL_REQUIRED",
    } as unknown as AdaptiveFactoryResult;
    const sequentialStart = vi.fn();
    const lightweightRun = vi.fn();
    const adaptiveStart = vi.fn();
    const resumeAfterPlanApproval = vi.fn().mockResolvedValue(adaptiveResult);
    const sequentialFactory = {
      start: sequentialStart,
    } as unknown as SequentialFactory;
    const lightweightWorkflow = {
      run: lightweightRun,
    } as unknown as LightweightWorkflow;
    const adaptiveFactory = {
      start: adaptiveStart,
      resumeAfterPlanApproval,
    } as unknown as AdaptiveFactory;
    const runner = new FactoryRunner(
      sequentialFactory,
      lightweightWorkflow,
      adaptiveFactory,
    );

    const result = await runner.run(
      task,
      "/repo",
      "2026-11-02T19:55:00.000Z",
      "develop",
    );

    expect(result.decision.route).toBe("PARALLEL");
    expect(adaptiveStart).not.toHaveBeenCalled();
    expect(resumeAfterPlanApproval).toHaveBeenCalledOnce();
    expect(resumeAfterPlanApproval).toHaveBeenCalledWith(
      {
        run: {
          task,
          repairs: [],
        },
        route: result.decision,
        stopReason: "PLAN_APPROVAL_REQUIRED",
      },
      "/repo",
      "develop",
    );
    expect(sequentialStart).not.toHaveBeenCalled();
    expect(lightweightRun).not.toHaveBeenCalled();
    expect(result.adaptiveResult).toBe(adaptiveResult);
    expect(result.trace.taskId).toBe(task.id);
    expect(result.trace.startedAt).toBe("2026-11-02T19:55:00.000Z");
    expect(
      result.trace.observations.map(
        (observation) => observation.type,
      ),
    ).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
    expect(result.trace.observations.at(-2)).toMatchObject({
      type: "HUMAN_GATE",
      details: {
        gate: "PARALLEL_APPROVAL",
      },
    });
    expect(result.trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "PARALLEL_APPROVAL_REQUIRED",
      },
    });
  });

  it("rejects lightweight routing when the lightweight workflow is unavailable", async () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      strategy: {
        mode: "single-agent",
        reasoning: "Use lightweight execution.",
      },
    };
    const start = vi.fn();
    const sequentialFactory = {
      start,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);

    await expect(
      runner.run(
        task,
        "/repo",
        "2026-11-02T19:52:00.000Z",
      ),
    ).rejects.toThrow(
      "FactoryRunner requires a lightweight workflow for LIGHTWEIGHT routing.",
    );

    expect(start).not.toHaveBeenCalled();
  });

  it("rejects parallel routing when the adaptive factory is unavailable", async () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      strategy: {
        mode: "parallel",
        reasoning: "Use parallel execution.",
      },
    };
    const start = vi.fn();
    const sequentialFactory = {
      start,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);

    await expect(
      runner.run(
        task,
        "/repo",
        "2026-11-02T19:52:00.000Z",
      ),
    ).rejects.toThrow(
      "FactoryRunner requires an adaptive factory for PARALLEL routing.",
    );

    expect(start).not.toHaveBeenCalled();
  });
});
