import type { EngineeringTask } from "../schemas/task.js";
import type { RunObservation } from "../schemas/run-observation.js";
import type { TrustDecision } from "../schemas/trust-decision.js";

export function createTrustDecisionObservation(
  task: EngineeringTask,
  decision: TrustDecision,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  const supportingEvidence = decision.evidence.filter(
    (evidence) => evidence.supportsTrust,
  ).length;

  return {
    type: "TRUST_DECISION",
    timestamp,
    stage: task.status,
    summary: `Trust decision: ${decision.action}.`,
    details: {
      action: decision.action,
      confidence: decision.confidence,
      reasonCount: decision.reasons.length,
      evidenceCount: decision.evidence.length,
      supportingEvidence,
      opposingEvidence:
        decision.evidence.length - supportingEvidence,
      repairAttempts: task.repairAttempts,
    },
  };
}
