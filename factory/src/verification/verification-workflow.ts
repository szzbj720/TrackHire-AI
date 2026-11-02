import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  VerificationExecutor,
} from "./verification-executor.js";
import type {
  VerificationPlan,
  VerificationPlanner,
} from "./verification-planner.js";

export interface VerificationWorkflowInput {
  task: EngineeringTask;
  validation: ValidationResult;
  changedFiles: Array<{
    path: string;
    content: string;
  }>;
  worktreePath: string;
}

export interface VerificationWorkflowResult {
  plan: VerificationPlan;
  verification: VerificationResult;
}

export class VerificationWorkflow {
  constructor(
    private readonly planner:
      VerificationPlanner,
    private readonly executor:
      VerificationExecutor,
  ) {}

  async run(
    input: VerificationWorkflowInput,
  ): Promise<VerificationWorkflowResult> {
    if (!input.validation.passed) {
      throw new Error(
        "Cannot run independent verification after failed deterministic validation.",
      );
    }

    const plan =
      await this.planner.plan({
        task: input.task,
        changedFiles:
          input.changedFiles,
      });

    const verification =
      await this.executor.execute(
        plan.probes,
        input.worktreePath,
      );

    return {
      plan,
      verification,
    };
  }
}
