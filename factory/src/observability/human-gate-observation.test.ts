import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import { createHumanGateObservation } from "./human-gate-observation.js";

describe("createHumanGateObservation", () => {
  it("records a final approval gate with its reason", () => {
    const now = "2026-11-02T17:57:00.000Z";
    const task: EngineeringTask = {
      id: "TH-OBS-GATE-001",
      request: "Observe a human approval gate.",
      status: "AWAITING_FINAL_APPROVAL",
      requirements: [],
      acceptanceCriteria: [],
      constraints: [],
      repairAttempts: 1,
      createdAt: now,
      updatedAt: now,
    };

    expect(
      createHumanGateObservation(
        task,
        "FINAL_APPROVAL",
        "Final approval remains mandatory.",
        now,
      ),
    ).toEqual({
      type: "HUMAN_GATE",
      timestamp: now,
      stage: "AWAITING_FINAL_APPROVAL",
      summary: "Human gate required: FINAL_APPROVAL.",
      details: {
        gate: "FINAL_APPROVAL",
        reason: "Final approval remains mandatory.",
        status: "AWAITING_FINAL_APPROVAL",
        repairAttempts: 1,
      },
    });
  });
});
