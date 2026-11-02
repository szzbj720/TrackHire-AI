import {
  describe,
  expect,
  it,
} from "vitest";

import { routeTask } from "../orchestrator/adaptive-routing.js";
import type { EngineeringTask } from "../schemas/task.js";
import { createRoutingObservation } from "./routing-observation.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T17:00:00.000Z";

  return {
    id: "TH-OBS-ROUTING-001",
    request: "Observe adaptive routing.",
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
      reasoning: "Deterministic observability test.",
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

describe("routing observation", () => {
  it("captures route and autonomy evidence from a real routing decision", () => {
    const task = createTask();
    const decision = routeTask(task);

    const observation = createRoutingObservation(
      task,
      decision,
      "2026-11-02T17:01:00.000Z",
    );

    expect(observation).toEqual({
      type: "ROUTING_DECISION",
      timestamp: "2026-11-02T17:01:00.000Z",
      stage: "AWAITING_PLAN_APPROVAL",
      summary: "Routed task to SEQUENTIAL.",
      details: {
        route: "SEQUENTIAL",
        disposition: "SUPPORTED_SEQUENTIAL",
        risk: "low",
        planApproval: "CAN_PROCEED",
        maxAutonomousRepairAttempts: 2,
        finalApproval: "REQUIRED",
      },
    });
  });

  it("preserves compatibility when routing has no autonomy decision", () => {
    const task = createTask();
    delete task.analysis;
    const decision = routeTask(task);

    const observation = createRoutingObservation(
      task,
      decision,
      "2026-11-02T17:02:00.000Z",
    );

    expect(observation.details).toEqual({
      route: "SEQUENTIAL",
      disposition: "SUPPORTED_SEQUENTIAL",
    });
  });
});
