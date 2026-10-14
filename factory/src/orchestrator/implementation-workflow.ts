import type { Builder } from "../agents/builder.js";
import type { ImplementationResult } from "../schemas/implementation.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { ValidationResult } from "../schemas/validation.js";
import {
  createTaskWorktree,
  type Worktree,
} from "../tools/git-worktree.js";
import type { Validator } from "../validation/validator.js";

export interface ImplementationWorkflowResult {
  task: EngineeringTask;
  worktree: Worktree;
  implementation: ImplementationResult;
  validation: ValidationResult;
}

export class ImplementationWorkflow {
  constructor(
    private readonly builder: Builder,
    private readonly validator: Validator,
  ) {}

  async run(
    task: EngineeringTask,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<ImplementationWorkflowResult> {
    if (task.status !== "IMPLEMENTING") {
      throw new Error(
        `Cannot start implementation while task is in state ${task.status}`,
      );
    }

    if (!task.plan) {
      throw new Error(
        "Cannot start implementation without an approved plan.",
      );
    }

    if (task.plan.requiresHumanInput) {
      throw new Error(
        "Cannot implement a plan that still requires human input.",
      );
    }

    const worktree = await createTaskWorktree({
      repositoryRoot,
      taskId: task.id,
      baseBranch,
    });

    const implementation =
      await this.builder.implement({
        task,
        plan: task.plan,
        worktreePath: worktree.path,
      });

    if (implementation.requiresHumanInput) {
      throw new Error(
        "Builder requires human input before validation can begin.",
      );
    }

    const validation =
      await this.validator.validate(
        worktree.path,
      );

    return {
      task,
      worktree,
      implementation,
      validation,
    };
  }
}