import { describe, expect, it } from "vitest";

import { routeTask } from "../orchestrator/adaptive-routing.js";
import type { EngineeringTask } from "../schemas/task.js";
import { recordAdaptiveRoutingDecision } from "./adaptive-routing-observability.js";
import { RunTraceRecorder } from "./run-trace-recorder.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T18:08:00.000Z";

  return {
    id: "TH-OBS-ADAPTIVE-001",
    request: "Observe adaptive routing evidence.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    analysis: {
      complexity: "low",
      risk: "low",
      affectedAreas: [],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: 0.95,
      requiresHumanInput: false,
      reasoning: "Deterministic adaptive observability test.",
    },
    strategy: {
      mode: "sequential",
      reasoning: "Use sequential execution.",
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("recordAdaptiveRoutingDecision", () => {
  it("records routing and autonomy decisions in order", () => {
    const task = createTask();
    const decision = routeTask(task);
    const recorder = new RunTraceRecorder(
      task.id,
      "2026-11-02T18:08:00.000Z",
    );

    recordAdaptiveRoutingDecision(
      recorder,
      task,
      decision,
      "2026-11-02T18:09:00.000Z",
    );

    const observations = recorder.snapshot().observations;

    expect(observations).toHaveLength(2);
    expect(observations.map((observation) => observation.type)).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
    ]);
    expect(observations[0]?.details).toMatchObject({
      route: "SEQUENTIAL",
      disposition: "SUPPORTED_SEQUENTIAL",
    });
    expect(observations[1]?.details).toMatchObject({
      risk: "low",
      planApproval: "CAN_PROCEED",
      maxAutonomousRepairAttempts: 2,
      finalApproval: "REQUIRED",
    });
  });

  it("records only routing evidence when autonomy is unavailable", () => {
    const task = createTask();
    delete task.analysis;
    const decision = routeTask(task);
    const recorder = new RunTraceRecorder(task.id);

    recordAdaptiveRoutingDecision(recorder, task, decision);

    expect(
      recorder.snapshot().observations.map(
        (observation) => observation.type,
      ),
    ).toEqual(["ROUTING_DECISION"]);
  });
});
