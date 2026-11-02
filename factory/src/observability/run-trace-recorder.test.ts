import { describe, expect, it } from "vitest";

import { RunTraceRecorder } from "./run-trace-recorder.js";

describe("RunTraceRecorder", () => {
  it("records observations with the run task id", () => {
    const recorder = new RunTraceRecorder(
      "task-123",
      "2026-11-02T17:00:00.000Z",
    );

    recorder.record({
      type: "ROUTING_DECISION",
      timestamp: "2026-11-02T17:00:01.000Z",
      summary: "Selected sequential execution",
      details: {
        route: "sequential",
      },
    });

    expect(recorder.snapshot()).toEqual({
      taskId: "task-123",
      startedAt: "2026-11-02T17:00:00.000Z",
      observations: [
        {
          taskId: "task-123",
          type: "ROUTING_DECISION",
          timestamp: "2026-11-02T17:00:01.000Z",
          summary: "Selected sequential execution",
          details: {
            route: "sequential",
          },
        },
      ],
    });
  });

  it("marks the trace complete", () => {
    const recorder = new RunTraceRecorder(
      "task-123",
      "2026-11-02T17:00:00.000Z",
    );

    recorder.complete("2026-11-02T17:05:00.000Z");

    expect(recorder.snapshot().completedAt).toBe(
      "2026-11-02T17:05:00.000Z",
    );
  });

  it("returns snapshots that cannot mutate recorded observations", () => {
    const recorder = new RunTraceRecorder("task-123");

    recorder.record({
      type: "TRUST_DECISION",
      timestamp: "2026-11-02T17:00:01.000Z",
      summary: "Trust engine requested retry",
    });

    const snapshot = recorder.snapshot();
    snapshot.observations[0]!.summary = "mutated";

    expect(recorder.snapshot().observations[0]!.summary).toBe(
      "Trust engine requested retry",
    );
  });
});
