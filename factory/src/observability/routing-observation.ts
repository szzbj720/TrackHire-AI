import type { EngineeringTask } from "../schemas/task.js";
import type { RunObservation } from "../schemas/run-observation.js";
import type { AdaptiveRoutingDecision } from "../orchestrator/adaptive-routing.js";

export function createRoutingObservation(
  task: EngineeringTask,
  decision: AdaptiveRoutingDecision,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  return {
    type: "ROUTING_DECISION",
    timestamp,
    stage: task.state,
    summary: `Routed task to ${decision.route}.`,
    details: {
      route: decision.route,
      disposition: decision.policy.disposition,
      ...(decision.autonomy
        ? {
            risk: decision.autonomy.risk,
            planApproval: decision.autonomy.planApproval,
            maxAutonomousRepairAttempts:
              decision.autonomy.maxAutonomousRepairAttempts,
            finalApproval: decision.autonomy.finalApproval,
          }
        : {}),
    },
  };
}
