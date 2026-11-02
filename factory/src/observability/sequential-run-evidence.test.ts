import { describe, expect, it } from "vitest";

import type { SequentialFactoryRun } from "../orchestrator/sequential-factory.js";
import type { EngineeringTask } from "../schemas/task.js";
import { RunTraceRecorder } from "./run-trace-recorder.js";
import { recordSequentialRunEvidence } from "./sequential-run-evidence.js";

function createTask(): EngineeringTask {
  const now = "2026-11-02T18:07:00.000Z";

  return {
    id: "TH-OBS-EVIDENCE-001",
    request: "Record sequential run evidence.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe("recordSequentialRunEvidence", () => {
  it("records verification and trust evidence from a sequential run", () => {
    const task = createTask();
    const run: SequentialFactoryRun = {
      task,
      repairs: [],
      verification: {
        passed: true,
        probes: [
          {
            probeId: "probe-1",
            command: "npm",
            args: ["test"],
            exitCode: 0,
            stdout: "passed",
            stderr: "",
            durationMs: 20,
            passed: true,
          },
        ],
        failedProbes: [],
        durationMs: 20,
      },
      trustDecision: {
        action: "MERGE",
        confidence: 0.95,
        reasons: ["All available evidence supports trust."],
        evidence: [
          {
            source: "verification",
            signal: "Independent verification passed.",
            supportsTrust: true,
          },
        ],
      },
    };
    const recorder = new RunTraceRecorder(
      task.id,
      "2026-11-02T18:06:00.000Z",
    );

    recordSequentialRunEvidence(
      recorder,
      run,
      "2026-11-02T18:08:00.000Z",
    );

    const observations = recorder.snapshot().observations;

    expect(observations.map((observation) => observation.type)).toEqual([
      "VERIFICATION_RESULT",
      "TRUST_DECISION",
    ]);
    expect(observations[0]?.details?.passed).toBe(true);
    expect(observations[1]?.details?.action).toBe("MERGE");
  });
});
