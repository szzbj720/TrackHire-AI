import type { ImplementationResult } from "../schemas/implementation.js";
import type { RunObservation } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";

export function createRepairAttemptObservation(
  task: EngineeringTask,
  repair: ImplementationResult,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  return {
    type: "REPAIR_ATTEMPT",
    timestamp,
    stage: task.status,
    summary: `Repair attempt ${task.repairAttempts} completed.`,
    details: {
      repairAttempt: task.repairAttempts,
      changedFileCount: repair.changedFiles.length,
      commandCount: repair.commandsRun.length,
      warningCount: repair.warnings.length,
      requiresHumanInput: repair.requiresHumanInput,
    },
  };
}
