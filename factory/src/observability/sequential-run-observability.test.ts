import { describe, expect, it } from "vitest";
import type {
  SequentialFactoryResult,
} from "../orchestrator/sequential-factory.js";
import type { EngineeringTask } from "../schemas/task.js";
import { RunTraceRecorder } from "./run-trace-recorder.js";
import { recordSequentialFactoryResult } from "./sequential-run-observability.js";

function createTask(status: EngineeringTask["status"]): EngineeringTask {
  const now = "2026-11-02T18:06:00.000Z";

  return {
    id: "task-sequential-observability",
    request: "Observe sequential factory results.",
    status,
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe("recordSequentialFactoryResult", () => {
  it("records human gates and nonterminal outcomes without completing the trace", () => {
    const recorder = new RunTraceRecorder(
      "task-sequential-observability",
      "2026-11-02T18:06:00.000Z",
    );
    const result: SequentialFactoryResult = {
      run: {
        task: createTask("AWAITING_FINAL_APPROVAL"),
        repairs: [],
      },
      stopReason: "FINAL_APPROVAL_REQUIRED",
    };

    recordSequentialFactoryResult(
      recorder,
      result,
      "2026-11-02T18:07:00.000Z",
    );

    const trace = recorder.snapshot();

    expect(trace.completedAt).toBeUndefined();
    expect(trace.observations).toHaveLength(2);
    expect(trace.observations[0]).toMatchObject({
      type: "HUMAN_GATE",
      stage: "AWAITING_FINAL_APPROVAL",
      details: {
        gate: "FINAL_APPROVAL",
        repairAttempts: 1,
      },
    });
    expect(trace.observations[1]).toMatchObject({
      type: "RUN_OUTCOME",
      stage: "AWAITING_FINAL_APPROVAL",
      details: {
        outcome: "FINAL_APPROVAL_REQUIRED",
        status: "AWAITING_FINAL_APPROVAL",
      },
    });
  });

  it("records and completes terminal outcomes", () => {
    const recorder = new RunTraceRecorder(
      "task-sequential-observability",
      "2026-11-02T18:06:00.000Z",
    );
    const result: SequentialFactoryResult = {
      run: {
        task: createTask("COMPLETE"),
        repairs: [],
      },
      stopReason: "COMPLETE",
    };

    recordSequentialFactoryResult(
      recorder,
      result,
      "2026-11-02T18:08:00.000Z",
    );

    const trace = recorder.snapshot();

    expect(trace.completedAt).toBe(
      "2026-11-02T18:08:00.000Z",
    );
    expect(trace.observations).toHaveLength(1);
    expect(trace.observations[0]).toMatchObject({
      type: "RUN_OUTCOME",
      stage: "COMPLETE",
      details: {
        outcome: "COMPLETE",
        status: "COMPLETE",
        repairAttempts: 1,
      },
    });
  });
});
