import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  TrustDecisionWorkflow,
} from "./trust-decision-workflow.js";

function createTask(
  repairAttempts = 0,
): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-TRUST-WORKFLOW-001",
    request: "Make a safe change.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: ["Preserve behavior."],
    acceptanceCriteria: ["Evidence is positive."],
    constraints: [],
    analysis: {
      complexity: "medium",
      risk: "low",
      affectedAreas: ["app"],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning: "The task is well understood.",
    },
    repairAttempts,
    createdAt: now,
    updatedAt: now,
  };
}

const validation = {
  passed: true,
  checks: [],
  failedChecks: [],
  durationMs: 10,
};

const passingVerification = {
  passed: true,
  probes: [
    {
      probeId: "probe-1",
      command: "npm",
      args: ["test"],
      exitCode: 0,
      stdout: "passed",
      stderr: "",
      durationMs: 10,
      passed: true,
    },
  ],
  failedProbes: [],
  durationMs: 10,
};

const review = {
  approved: true,
  summary: "The implementation is safe.",
  findings: [],
  requirementCoverage: [
    {
      requirement: "Preserve behavior.",
      satisfied: true,
      evidence: ["Validation and verification passed."],
    },
  ],
  requiresHumanInput: false,
  confidence: 0.92,
};

describe("TrustDecisionWorkflow", () => {
  it("returns MERGE when the complete evidence chain supports trust", () => {
    const workflow =
      new TrustDecisionWorkflow();

    const decision = workflow.run({
      task: createTask(),
      validation,
      verification: passingVerification,
      review,
    });

    expect(decision.action).toBe("MERGE");
    expect(decision.evidence).toHaveLength(4);
  });

  it("returns RETRY when independent verification finds a failure", () => {
    const workflow =
      new TrustDecisionWorkflow();

    const decision = workflow.run({
      task: createTask(),
      validation,
      verification: {
        ...passingVerification,
        passed: false,
        probes: [
          {
            ...passingVerification.probes[0]!,
            exitCode: 1,
            stderr: "edge case failed",
            passed: false,
          },
        ],
        failedProbes: ["probe-1"],
      },
      review: {
        ...review,
        approved: false,
        confidence: 0.7,
      },
    });

    expect(decision.action).toBe("RETRY");
  });
});
