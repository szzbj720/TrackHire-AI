import type { RunObservation } from "../schemas/run-observation.js";
import type { EngineeringTask } from "../schemas/task.js";

export type HumanGate =
  | "PLAN_APPROVAL"
  | "PARALLEL_APPROVAL"
  | "FINAL_APPROVAL"
  | "HUMAN_INPUT";

export function createHumanGateObservation(
  task: EngineeringTask,
  gate: HumanGate,
  reason: string,
  timestamp = new Date().toISOString(),
): Omit<RunObservation, "taskId"> {
  return {
    type: "HUMAN_GATE",
    timestamp,
    stage: task.status,
    summary: `Human gate required: ${gate}.`,
    details: {
      gate,
      reason,
      status: task.status,
      repairAttempts: task.repairAttempts,
    },
  };
}
