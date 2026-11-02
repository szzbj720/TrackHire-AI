import { describe, expect, it, vi } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
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
  it("routes sequential work through the sequential factory and preserves one trace", async () => {
    const task = createTask();
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
    const start = vi.fn().mockResolvedValue(sequentialResult);
    const sequentialFactory = {
      start,
    } as unknown as SequentialFactory;
    const runner = new FactoryRunner(sequentialFactory);

    const result = await runner.run(
      task,
      "/repo",
      "2026-11-02T19:50:00.000Z",
    );

    expect(result.decision.route).toBe("SEQUENTIAL");
    expect(start).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledWith(task, "/repo");
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

  it.each([
    ["single-agent", "LIGHTWEIGHT"],
    ["parallel", "PARALLEL"],
  ] as const)(
    "returns the %s routing trace without invoking the sequential factory",
    async (mode, expectedRoute) => {
      const baseTask = createTask();
      const task: EngineeringTask = {
        ...baseTask,
        strategy: {
          mode,
          reasoning: `Use ${mode} execution.`,
        },
      };
      const start = vi.fn();
      const sequentialFactory = {
        start,
      } as unknown as SequentialFactory;
      const runner = new FactoryRunner(sequentialFactory);

      const result = await runner.run(
        task,
        "/repo",
        "2026-11-02T19:52:00.000Z",
      );

      expect(result.decision.route).toBe(expectedRoute);
      expect(start).not.toHaveBeenCalled();
      expect(result.sequentialResult).toBeUndefined();
      expect(result.trace.taskId).toBe(task.id);
      expect(result.trace.startedAt).toBe("2026-11-02T19:52:00.000Z");
      expect(
        result.trace.observations.map(
          (observation) => observation.type,
        ),
      ).toEqual([
        "ROUTING_DECISION",
        "AUTONOMY_DECISION",
      ]);
    },
  );
});
