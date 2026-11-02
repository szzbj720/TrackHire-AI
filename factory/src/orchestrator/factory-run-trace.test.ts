import { describe, expect, it } from "vitest";

import type { AdaptiveFactoryResult } from "./adaptive-factory.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { SequentialFactoryResult } from "./sequential-factory.js";
import { startFactoryRunTrace } from "./factory-run-trace.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T19:45:00.000Z";

  return {
    id: "TH-RUNNER-TRACE-001",
    request: "Preserve one trace across routing and sequential execution.",
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

describe("startFactoryRunTrace", () => {
  it("preserves routing and sequential evidence in one trace", () => {
    const task = createTask();
    const session = startFactoryRunTrace(
      task,
      "2026-11-02T19:45:00.000Z",
    );
    const result: SequentialFactoryResult = {
      run: {
        task,
        repairs: [],
        verification: {
          passed: true,
          probes: [
            {
              probeId: "probe-1",
              command: "npm",
              args: ["test"],
              exitCode: 0,
              stdout: "passed",
              stderr: "",
              durationMs: 25,
              passed: true,
            },
          ],
          failedProbes: [],
          durationMs: 25,
        },
        trustDecision: {
          action: "MERGE",
          confidence: 0.96,
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

    const trace = session.recordSequentialResult(
      result,
      "2026-11-02T19:46:00.000Z",
    );

    expect(session.decision.route).toBe("SEQUENTIAL");
    expect(trace.taskId).toBe(task.id);
    expect(trace.startedAt).toBe("2026-11-02T19:45:00.000Z");
    expect(trace.completedAt).toBeUndefined();
    expect(trace.observations.map((observation) => observation.type)).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
      "VERIFICATION_RESULT",
      "TRUST_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
    expect(trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "FINAL_APPROVAL_REQUIRED",
      },
    });
    expect(session.snapshot()).toEqual(trace);
  });

  it("records the parallel approval boundary from an adaptive result", () => {
    const baseTask = createTask();
    const task: EngineeringTask = {
      ...baseTask,
      status: "AWAITING_PLAN_APPROVAL",
      strategy: {
        mode: "parallel",
        reasoning: "Use parallel execution.",
      },
    };
    const parallelTask: EngineeringTask = {
      ...task,
      status: "AWAITING_PARALLEL_APPROVAL",
      updatedAt: "2026-11-02T19:47:00.000Z",
    };
    const session = startFactoryRunTrace(
      task,
      "2026-11-02T19:45:00.000Z",
    );
    const result = {
      run: {
        task: parallelTask,
        repairs: [],
      },
      route: session.decision,
      stopReason: "PARALLEL_APPROVAL_REQUIRED",
    } as AdaptiveFactoryResult;

    const trace = session.recordAdaptiveResult(
      result,
      "2026-11-02T19:47:00.000Z",
    );

    expect(session.decision.route).toBe("PARALLEL");
    expect(trace.completedAt).toBeUndefined();
    expect(trace.observations.map((observation) => observation.type)).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
    expect(trace.observations.at(-2)).toMatchObject({
      type: "HUMAN_GATE",
      details: {
        gate: "PARALLEL_APPROVAL",
      },
    });
    expect(trace.observations.at(-1)).toMatchObject({
      type: "RUN_OUTCOME",
      details: {
        outcome: "PARALLEL_APPROVAL_REQUIRED",
      },
    });
  });
});
