import type { RunObservation } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { AutonomyPolicyDecision } from "../orchestrator/autonomy-policy.js";

export function createAutonomyObservation(
  task: EngineeringTask,
  decision: AutonomyPolicyDecision,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  return {
    type: "AUTONOMY_DECISION",
    timestamp,
    stage: task.status,
    summary: `Autonomy policy: plan approval ${decision.planApproval.toLowerCase().replace("_", " ")}.`,
    details: {
      risk: decision.risk,
      planApproval: decision.planApproval,
      finalApproval: decision.finalApproval,
      maxAutonomousRepairAttempts:
        decision.maxAutonomousRepairAttempts,
      reasoningCount: decision.reasoning.length,
    },
  };
}
