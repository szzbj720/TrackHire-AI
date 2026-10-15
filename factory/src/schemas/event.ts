import type { FactoryState } from "./task.js";

export type FactoryEventType =
  | "TASK_CREATED"
  | "STATE_TRANSITION"
  | "AGENT_STARTED"
  | "AGENT_COMPLETED"
  | "VALIDATION_STARTED"
  | "VALIDATION_COMPLETED"
  | "HUMAN_APPROVAL_REQUESTED"
  | "HUMAN_APPROVAL_RECEIVED"
  | "ERROR";

export interface FactoryEvent {
  id: string;
  taskId: string;
  type: FactoryEventType;
  timestamp: string;

  stage?: FactoryState;

  agent?: {
    role: string;
    model?: string;
  };

  transition?: {
    from: FactoryState;
    to: FactoryState;
  };

  validation?: {
    command: string;
    exitCode: number;
    passed: boolean;
  };

  metrics?: {
    durationMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
  };

  message?: string;
}