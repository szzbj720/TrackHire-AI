import { describe, expect, it } from "vitest";
import type { EngineeringTask } from "../schemas/task.js";
import { routeTaskWithTrace } from "./observable-routing.js";

function createTask(): EngineeringTask {
  const timestamp = "2026-11-02T19:00:00.000Z";

  return {
    id: "runner-routing-test",
    request: "Make a low-risk sequential change.",
    status: "PLANNING",
    requirements: ["Preserve existing behavior."],
    acceptanceCriteria: ["The change is validated."],
    constraints: [],
    analysis: {
      complexity: "low",
      risk: "low",
      affectedAreas: ["factory"],
      relevantFiles: ["factory/src/index.ts"],
      ambiguities: [],
      assumptions: [],
      confidence: 0.95,
      requiresHumanInput: false,
      reasoning: "Small, well-scoped change.",
    },
    strategy: {
      mode: "sequential",
      reasoning: "One dependent implementation path.",
    },
    repairAttempts: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("routeTaskWithTrace", () => {
  it("returns the routing decision with its decision trace", () => {
    const timestamp = "2026-11-02T19:01:00.000Z";
    const result = routeTaskWithTrace(
      createTask(),
      timestamp,
    );

    expect(result.decision.route).toBe("SEQUENTIAL");
    expect(result.trace.taskId).toBe("runner-routing-test");
    expect(result.trace.startedAt).toBe(timestamp);
    expect(
      result.trace.observations.map(
        (observation) => observation.type,
      ),
    ).toEqual([
      "ROUTING_DECISION",
      "AUTONOMY_DECISION",
    ]);
  });
});
