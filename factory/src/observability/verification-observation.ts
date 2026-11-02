import type { RunObservation } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { VerificationResult } from "../schemas/verification.js";

export function createVerificationObservation(
  task: EngineeringTask,
  result: VerificationResult,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  const passedProbes = result.probes.filter(
    (probe) => probe.passed,
  ).length;

  return {
    type: "VERIFICATION_RESULT",
    timestamp,
    stage: task.status,
    summary: result.passed
      ? "Independent verification passed."
      : "Independent verification failed.",
    details: {
      passed: result.passed,
      probeCount: result.probes.length,
      passedProbes,
      failedProbes: result.failedProbes.length,
      durationMs: result.durationMs,
    },
  };
}
