import { describe, expect, it } from "vitest";

import type { ImplementationResult } from "../schemas/implementation.js";
import type { EngineeringTask } from "../schemas/task.js";
import { createRepairAttemptObservation } from "./repair-attempt-observation.js";

describe("createRepairAttemptObservation", () => {
  it("summarizes completed repair evidence", () => {
    const now = "2026-11-02T17:58:00.000Z";
    const task: EngineeringTask = {
      id: "TH-OBS-REPAIR-001",
      request: "Observe a repair attempt.",
      status: "VALIDATING",
      requirements: [],
      acceptanceCriteria: [],
      constraints: [],
      repairAttempts: 2,
      createdAt: now,
      updatedAt: now,
    };
    const repair: ImplementationResult = {
      summary: "Repaired the implementation.",
      changedFiles: [
        {
          path: "src/example.ts",
          changeType: "modified",
          summary: "Fixed the failing behavior.",
        },
        {
          path: "src/example.test.ts",
          changeType: "modified",
          summary: "Updated regression coverage.",
        },
      ],
      commandsRun: ["npm test"],
      assumptions: [],
      warnings: ["Follow-up cleanup may be useful."],
      requiresHumanInput: false,
    };

    expect(
      createRepairAttemptObservation(task, repair, now),
    ).toEqual({
      type: "REPAIR_ATTEMPT",
      timestamp: now,
      stage: "VALIDATING",
      summary: "Repair attempt 2 completed.",
      details: {
        repairAttempt: 2,
        changedFileCount: 2,
        commandCount: 1,
        warningCount: 1,
        requiresHumanInput: false,
      },
    });
  });
});
