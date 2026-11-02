import {
  describe,
  expect,
  it,
} from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { TrustDecision } from "../schemas/trust-decision.js";
import { createTrustDecisionObservation } from "./trust-decision-observation.js";

function createTask(): EngineeringTask {
  return {
    id: "TH-OBS-TRUST-001",
    request: "Observe a trust decision.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 1,
    createdAt: "2026-11-02T17:00:00.000Z",
    updatedAt: "2026-11-02T17:01:00.000Z",
  };
}

describe("trust decision observation", () => {
  it("captures the trust outcome and evidence balance", () => {
    const decision: TrustDecision = {
      action: "RETRY",
      confidence: 0.72,
      reasons: [
        "Independent verification found a regression.",
        "One autonomous repair remains.",
      ],
      evidence: [
        {
          source: "validation",
          signal: "Validation passed.",
          supportsTrust: true,
        },
        {
          source: "verification",
          signal: "Verification failed.",
          supportsTrust: false,
        },
        {
          source: "review",
          signal: "Review approved the implementation shape.",
          supportsTrust: true,
        },
      ],
    };

    const observation = createTrustDecisionObservation(
      createTask(),
      decision,
      "2026-11-02T17:02:00.000Z",
    );

    expect(observation).toEqual({
      type: "TRUST_DECISION",
      timestamp: "2026-11-02T17:02:00.000Z",
      stage: "AWAITING_FINAL_APPROVAL",
      summary: "Trust decision: RETRY.",
      details: {
        action: "RETRY",
        confidence: 0.72,
        reasonCount: 2,
        evidenceCount: 3,
        supportingEvidence: 2,
        opposingEvidence: 1,
        repairAttempts: 1,
      },
    });
  });
});
