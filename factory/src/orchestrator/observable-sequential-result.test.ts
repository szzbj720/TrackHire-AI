import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { SequentialFactoryResult } from "./sequential-factory.js";
import { traceSequentialFactoryResult } from "./observable-sequential-result.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T19:00:00.000Z";

  return {
    id: "task-observable-sequential-result",
    request: "Trace a sequential factory result.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("traceSequentialFactoryResult", () => {
  it("preserves execution evidence and the final human gate outcome in one trace", () => {
    const task = createTask();
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
              durationMs: 20,
              passed: true,
            },
          ],
          failedProbes: [],
          durationMs: 20,
        },
        trustDecision: {
          action: "MERGE",
          confidence: 0.95,
          reasons: ["Verification supports trust."],
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

    const trace = traceSequentialFactoryResult(
      result,
      "2026-11-02T18:59:00.000Z",
      "2026-11-02T19:01:00.000Z",
    );

    expect(trace.taskId).toBe(task.id);
    expect(trace.startedAt).toBe("2026-11-02T18:59:00.000Z");
    expect(trace.completedAt).toBeUndefined();
    expect(trace.observations.map((observation) => observation.type)).toEqual([
      "VERIFICATION_RESULT",
      "TRUST_DECISION",
      "HUMAN_GATE",
      "RUN_OUTCOME",
    ]);
    expect(trace.observations[0]?.details?.passed).toBe(true);
    expect(trace.observations[1]?.details?.action).toBe("MERGE");
    expect(trace.observations[2]?.details?.gate).toBe("FINAL_APPROVAL");
    expect(trace.observations[3]?.details?.outcome).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );
  });
});
