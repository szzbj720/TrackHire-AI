import type { FactoryState } from "./task.js";

export type RunObservationType =
  | "ROUTING_DECISION"
  | "AUTONOMY_DECISION"
  | "VERIFICATION_RESULT"
  | "TRUST_DECISION"
  | "REPAIR_ATTEMPT"
  | "HUMAN_GATE"
  | "RUN_OUTCOME";

export interface RunObservation {
  taskId: string;
  type: RunObservationType;
  timestamp: string;
  stage?: FactoryState;
  summary: string;
  details?: Record<string, string | number | boolean>;
}

export interface FactoryRunTrace {
  taskId: string;
  startedAt: string;
  completedAt?: string;
  observations: RunObservation[];
}
