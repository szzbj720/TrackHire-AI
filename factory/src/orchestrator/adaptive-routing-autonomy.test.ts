import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";
import { routeTask } from "./adaptive-routing.js";

function createTask(
  risk: TaskRisk,
  confidence: number,
  mode:
    | "single-agent"
    | "sequential"
    | "parallel" = "sequential",
): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-AUTONOMY-ROUTING-001",
    request: "Test autonomy-aware routing.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    analysis: {
      complexity: "low",
      risk,
      affectedAreas: [],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence,
      requiresHumanInput: false,
      reasoning: "Deterministic test analysis.",
    },
    strategy: {
      mode,
      reasoning: `Selected ${mode}.`,
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("adaptive routing autonomy integration", () => {
  it("attaches autonomous plan permission for low-risk high-confidence work", () => {
    const decision = routeTask(
      createTask("low", 0.95),
    );

    expect(decision.route).toBe("SEQUENTIAL");
    expect(decision.autonomy?.planApproval).toBe(
      "CAN_PROCEED",
    );
    expect(decision.autonomy?.finalApproval).toBe(
      "REQUIRED",
    );
  });

  it("keeps plan approval for higher-risk work", () => {
    const decision = routeTask(
      createTask("high", 0.99),
    );

    expect(decision.autonomy?.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("keeps plan approval for parallel execution even when risk is low", () => {
    const decision = routeTask(
      createTask("low", 0.99, "parallel"),
    );

    expect(decision.route).toBe("PARALLEL");
    expect(decision.autonomy?.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("preserves compatibility when older planned tasks do not contain analysis", () => {
    const task = createTask("low", 0.95);
    delete task.analysis;

    const decision = routeTask(task);

    expect(decision.route).toBe("SEQUENTIAL");
    expect(decision.autonomy).toBeUndefined();
  });
});
