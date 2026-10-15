import { describe, expect, it } from "vitest";
import type {
  EngineeringTask,
  ExecutionMode,
} from "../schemas/task.js";
import { routeTask } from "./adaptive-routing.js";

function createTask(
  mode?: ExecutionMode,
): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-ADAPTIVE-001",
    request: "Test adaptive routing.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    ...(mode
      ? {
          strategy: {
            mode,
            reasoning: `Selected ${mode}.`,
          },
        }
      : {}),
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("routeTask", () => {
  it("routes single-agent tasks to lightweight execution", () => {
    const decision = routeTask(
      createTask("single-agent"),
    );

    expect(decision.route).toBe(
      "LIGHTWEIGHT",
    );

    expect(decision.policy.disposition).toBe(
      "SUPPORTED_LIGHTWEIGHT",
    );
  });

  it("routes sequential tasks to the sequential factory", () => {
    const decision = routeTask(
      createTask("sequential"),
    );

    expect(decision.route).toBe(
      "SEQUENTIAL",
    );

    expect(decision.policy.disposition).toBe(
      "SUPPORTED_SEQUENTIAL",
    );
  });

  it("routes parallel tasks to controlled parallel execution", () => {
    const decision = routeTask(
      createTask("parallel"),
    );

    expect(decision.route).toBe(
      "PARALLEL",
    );

    expect(decision.policy.disposition).toBe(
      "SUPPORTED_PARALLEL",
    );
  });

  it("refuses to route a task without a strategy", () => {
    expect(
      () => routeTask(createTask()),
    ).toThrow(
      "Cannot route task without an execution strategy.",
    );
  });
});