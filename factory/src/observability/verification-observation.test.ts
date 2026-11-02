import { describe, expect, it } from "vitest";
import type { EngineeringTask } from "../schemas/task.js";
import type { VerificationResult } from "../schemas/verification.js";
import { createVerificationObservation } from "./verification-observation.js";

describe("createVerificationObservation", () => {
  it("summarizes failed independent verification evidence", () => {
    const task = {
      id: "task-1",
      status: "VERIFYING",
    } as EngineeringTask;
    const verification: VerificationResult = {
      passed: false,
      probes: [
        {
          probeId: "probe-1",
          command: "npm",
          args: ["test"],
          exitCode: 0,
          stdout: "ok",
          stderr: "",
          durationMs: 20,
          passed: true,
        },
        {
          probeId: "probe-2",
          command: "npm",
          args: ["run", "lint"],
          exitCode: 1,
          stdout: "",
          stderr: "lint failed",
          durationMs: 30,
          passed: false,
        },
      ],
      failedProbes: ["probe-2"],
      durationMs: 50,
    };

    expect(
      createVerificationObservation(
        task,
        verification,
        "2026-11-02T17:51:00.000Z",
      ),
    ).toEqual({
      type: "VERIFICATION_RESULT",
      timestamp: "2026-11-02T17:51:00.000Z",
      stage: "VERIFYING",
      summary: "Independent verification failed.",
      details: {
        passed: false,
        probeCount: 2,
        passedProbeCount: 1,
        failedProbeCount: 1,
        failedProbes: "probe-2",
        durationMs: 50,
      },
    });
  });
});
