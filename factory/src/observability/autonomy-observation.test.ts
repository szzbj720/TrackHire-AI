import { describe, expect, it } from "vitest";
import type { EngineeringTask } from "../schemas/task.js";
import { evaluateAutonomyPolicy } from "../orchestrator/autonomy-policy.js";
import { createAutonomyObservation } from "./autonomy-observation.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T17:53:00.000Z";

  return {
    id: "task-autonomy-observation",
    request: "Observe autonomy policy evidence.",
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
      reasoning: "Deterministic observability test analysis.",
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

describe("createAutonomyObservation", () => {
  it("records the evaluated autonomy policy", () => {
    const task = createTask();
    const decision = evaluateAutonomyPolicy(task);

    expect(
      createAutonomyObservation(
        task,
        decision,
        "2026-11-02T17:54:00.000Z",
      ),
    ).toEqual({
      type: "AUTONOMY_DECISION",
      timestamp: "2026-11-02T17:54:00.000Z",
      stage: "AWAITING_PLAN_APPROVAL",
      summary: "Autonomy policy: plan approval can proceed.",
      details: {
        risk: "low",
        planApproval: "CAN_PROCEED",
        finalApproval: "REQUIRED",
        maxAutonomousRepairAttempts: 2,
        reasoningCount: decision.reasoning.length,
      },
    });
  });
});
