import type { RunObservation } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";

export function createRunOutcomeObservation(
  task: EngineeringTask,
  outcome: string,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  return {
    type: "RUN_OUTCOME",
    timestamp,
    stage: task.status,
    summary: `Factory run stopped with ${outcome}.`,
    details: {
      outcome,
      status: task.status,
      repairAttempts: task.repairAttempts,
    },
  };
}
