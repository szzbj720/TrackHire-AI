import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import { createRunOutcomeObservation } from "./run-outcome-observation.js";

describe("createRunOutcomeObservation", () => {
  it("records the final stop reason and task state", () => {
    const now = "2026-11-02T17:55:00.000Z";
    const task: EngineeringTask = {
      id: "TH-OBS-OUTCOME-001",
      request: "Observe a factory run outcome.",
      status: "AWAITING_FINAL_APPROVAL",
      requirements: [],
      acceptanceCriteria: [],
      constraints: [],
      repairAttempts: 2,
      createdAt: now,
      updatedAt: now,
    };

    expect(
      createRunOutcomeObservation(
        task,
        "FINAL_APPROVAL_REQUIRED",
        now,
      ),
    ).toEqual({
      type: "RUN_OUTCOME",
      timestamp: now,
      stage: "AWAITING_FINAL_APPROVAL",
      summary:
        "Factory run stopped with FINAL_APPROVAL_REQUIRED.",
      details: {
        outcome: "FINAL_APPROVAL_REQUIRED",
        status: "AWAITING_FINAL_APPROVAL",
        repairAttempts: 2,
      },
    });
  });
});
