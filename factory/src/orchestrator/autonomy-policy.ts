import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";

export type ApprovalRequirement =
  | "REQUIRED"
  | "CAN_PROCEED";

export interface AutonomyPolicyDecision {
  risk: TaskRisk;
  planApproval: ApprovalRequirement;
  finalApproval: "REQUIRED";
  maxAutonomousRepairAttempts: number;
  reasoning: string[];
}

const MIN_AUTONOMOUS_PLAN_CONFIDENCE = 0.9;

const AUTONOMOUS_REPAIR_BUDGET: Record<
  TaskRisk,
  number
> = {
  low: 2,
  medium: 1,
  high: 0,
};

export function evaluateAutonomyPolicy(
  task: EngineeringTask,
): AutonomyPolicyDecision {
  if (!task.analysis) {
    throw new Error(
      "Cannot evaluate autonomy policy without task analysis.",
    );
  }

  if (!task.strategy) {
    throw new Error(
      "Cannot evaluate autonomy policy without an execution strategy.",
    );
  }

  const analysis = task.analysis;
  const reasoning: string[] = [];

  const requiresPlanApproval =
    analysis.requiresHumanInput ||
    analysis.risk !== "low" ||
    analysis.confidence <
      MIN_AUTONOMOUS_PLAN_CONFIDENCE ||
    task.strategy.mode === "parallel";

  const maxAutonomousRepairAttempts =
    analysis.requiresHumanInput
      ? 0
      : AUTONOMOUS_REPAIR_BUDGET[
          analysis.risk
        ];

  if (analysis.requiresHumanInput) {
    reasoning.push(
      "Task analysis explicitly requires human input.",
    );
  }

  if (analysis.risk !== "low") {
    reasoning.push(
      `${analysis.risk} risk requires human plan approval.`,
    );
  }

  if (
    analysis.confidence <
    MIN_AUTONOMOUS_PLAN_CONFIDENCE
  ) {
    reasoning.push(
      `Analysis confidence ${analysis.confidence} is below the autonomous planning threshold ${MIN_AUTONOMOUS_PLAN_CONFIDENCE}.`,
    );
  }

  if (task.strategy.mode === "parallel") {
    reasoning.push(
      "Parallel execution requires human approval before decomposition is executed.",
    );
  }

  if (!requiresPlanApproval) {
    reasoning.push(
      "Low-risk, high-confidence non-parallel work may proceed past planning without an additional approval gate.",
    );
  }

  reasoning.push(
    `Risk policy allows at most ${maxAutonomousRepairAttempts} autonomous repair attempt${maxAutonomousRepairAttempts === 1 ? "" : "s"} before human escalation.`,
  );

  reasoning.push(
    "Final human approval remains required before completion regardless of risk level.",
  );

  return {
    risk: analysis.risk,
    planApproval: requiresPlanApproval
      ? "REQUIRED"
      : "CAN_PROCEED",
    finalApproval: "REQUIRED",
    maxAutonomousRepairAttempts,
    reasoning,
  };
}
