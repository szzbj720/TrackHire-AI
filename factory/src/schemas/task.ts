export type FactoryState =
  | "TASK_CREATED"
  | "ANALYZING"
  | "PLANNING"
  | "AWAITING_PLAN_APPROVAL"
  | "IMPLEMENTING"
  | "VALIDATING"
  | "DIAGNOSING_FAILURE"
  | "REPAIRING"
  | "REVIEWING"
  | "AWAITING_FINAL_APPROVAL"
  | "NEEDS_HUMAN"
  | "COMPLETE"
  | "FAILED";

export type TaskComplexity = "low" | "medium" | "high";

export type TaskRisk = "low" | "medium" | "high";

export type ExecutionMode =
  | "single-agent"
  | "sequential"
  | "parallel";

export interface TaskAnalysis {
  complexity: TaskComplexity;
  risk: TaskRisk;
  affectedAreas: string[];
  confidence: number;
}

export interface ExecutionStrategy {
  mode: ExecutionMode;
  reasoning: string;
}

export interface EngineeringTask {
  id: string;
  request: string;
  status: FactoryState;

  requirements: string[];
  acceptanceCriteria: string[];
  constraints: string[];

  analysis?: TaskAnalysis;
  strategy?: ExecutionStrategy;

  repairAttempts: number;

  createdAt: string;
  updatedAt: string;
}