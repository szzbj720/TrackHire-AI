import { describe, expect, it } from "vitest";

import type {
  EngineeringTask,
  ExecutionMode,
  TaskRisk,
} from "../schemas/task.js";
import { evaluateAutonomyPolicy } from "./autonomy-policy.js";

function createTask(options?: {
  risk?: TaskRisk;
  confidence?: number;
  requiresHumanInput?: boolean;
  mode?: ExecutionMode;
}): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "autonomy-policy-test",
    request: "Make a safe test change",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    analysis: {
      complexity: "low",
      risk: options?.risk ?? "low",
      affectedAreas: [],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: options?.confidence ?? 0.95,
      requiresHumanInput:
        options?.requiresHumanInput ?? false,
      reasoning: "Test analysis",
    },
    strategy: {
      mode: options?.mode ?? "single-agent",
      reasoning: "Test strategy",
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("evaluateAutonomyPolicy", () => {
  it("allows low-risk high-confidence work past the plan gate", () => {
    const decision = evaluateAutonomyPolicy(
      createTask(),
    );

    expect(decision.planApproval).toBe(
      "CAN_PROCEED",
    );
    expect(decision.finalApproval).toBe(
      "REQUIRED",
    );
  });

  it("requires plan approval for medium-risk work", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ risk: "medium" }),
    );

    expect(decision.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("requires plan approval for high-risk work", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ risk: "high" }),
    );

    expect(decision.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("requires plan approval when analysis confidence is low", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ confidence: 0.89 }),
    );

    expect(decision.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("requires plan approval when human input is requested", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({
        requiresHumanInput: true,
      }),
    );

    expect(decision.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("keeps parallel execution behind a plan approval gate", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ mode: "parallel" }),
    );

    expect(decision.planApproval).toBe(
      "REQUIRED",
    );
  });

  it("allows two autonomous repairs for low-risk work", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ risk: "low" }),
    );

    expect(
      decision.maxAutonomousRepairAttempts,
    ).toBe(2);
  });

  it("allows one autonomous repair for medium-risk work", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ risk: "medium" }),
    );

    expect(
      decision.maxAutonomousRepairAttempts,
    ).toBe(1);
  });

  it("does not allow autonomous repairs for high-risk work", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({ risk: "high" }),
    );

    expect(
      decision.maxAutonomousRepairAttempts,
    ).toBe(0);
  });

  it("disables autonomous repairs when human input is required", () => {
    const decision = evaluateAutonomyPolicy(
      createTask({
        risk: "low",
        requiresHumanInput: true,
      }),
    );

    expect(
      decision.maxAutonomousRepairAttempts,
    ).toBe(0);
  });

  it("always preserves final human approval", () => {
    const lowRisk = evaluateAutonomyPolicy(
      createTask(),
    );
    const highRisk = evaluateAutonomyPolicy(
      createTask({ risk: "high" }),
    );

    expect(lowRisk.finalApproval).toBe(
      "REQUIRED",
    );
    expect(highRisk.finalApproval).toBe(
      "REQUIRED",
    );
  });

  it("rejects tasks without analysis", () => {
    const task = createTask();
    delete task.analysis;

    expect(() =>
      evaluateAutonomyPolicy(task),
    ).toThrow(
      "Cannot evaluate autonomy policy without task analysis.",
    );
  });

  it("rejects tasks without an execution strategy", () => {
    const task = createTask();
    delete task.strategy;

    expect(() =>
      evaluateAutonomyPolicy(task),
    ).toThrow(
      "Cannot evaluate autonomy policy without an execution strategy.",
    );
  });
});
