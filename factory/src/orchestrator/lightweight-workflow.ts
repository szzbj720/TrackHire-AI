import type { Builder } from "../agents/builder.js";
import type { ImplementationResult } from "../schemas/implementation.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { ValidationResult } from "../schemas/validation.js";
import {
  createTaskWorktree,
  type Worktree,
} from "../tools/git-worktree.js";
import type { Validator } from "../validation/validator.js";
import { Orchestrator } from "./orchestrator.js";

export interface LightweightWorkflowResult {
  task: EngineeringTask;
  worktree: Worktree;
  implementation: ImplementationResult;
  validation?: ValidationResult;
}

export class LightweightWorkflow {
  constructor(
    private readonly builder: Builder,
    private readonly validator: Validator,
  ) {}

  async run(
    task: EngineeringTask,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<LightweightWorkflowResult> {
    if (
      task.status !==
      "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Cannot start lightweight execution while task is in state ${task.status}`,
      );
    }

    if (!task.plan) {
      throw new Error(
        "Cannot start lightweight execution without a plan.",
      );
    }

    if (task.plan.requiresHumanInput) {
      throw new Error(
        "Cannot implement a plan that still requires human input.",
      );
    }

    if (
      task.strategy?.mode !== "single-agent"
    ) {
      throw new Error(
        "Lightweight execution requires a single-agent strategy.",
      );
    }

    const orchestrator = new Orchestrator(task);

    orchestrator.approvePlan();

    const implementingTask =
      orchestrator.getTask();

    const worktree = await createTaskWorktree({
      repositoryRoot,
      taskId: implementingTask.id,
      baseBranch,
    });

    const implementation =
      await this.builder.implement({
        task: implementingTask,
        plan: implementingTask.plan!,
        worktreePath: worktree.path,
      });

    if (implementation.requiresHumanInput) {
      orchestrator.transition("NEEDS_HUMAN");

      return {
        task: orchestrator.getTask(),
        worktree,
        implementation,
      };
    }

    orchestrator.transition("VALIDATING");

    const validation =
      await this.validator.validate(
        worktree.path,
      );

    if (validation.passed) {
      orchestrator.transition(
        "AWAITING_FINAL_APPROVAL",
      );
    } else {
      orchestrator.transition("NEEDS_HUMAN");
    }

    return {
      task: orchestrator.getTask(),
      worktree,
      implementation,
      validation,
    };
  }
}