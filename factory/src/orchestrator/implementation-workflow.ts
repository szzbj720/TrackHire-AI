import { execFile } from "node:child_process";
import { promisify } from "node:util";

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

const execFileAsync = promisify(execFile);

export interface ImplementationWorkflowResult {
  task: EngineeringTask;
  worktree: Worktree;
  implementation: ImplementationResult;
  validation: ValidationResult;
}

export interface ImplementationWorkspace {
  path: string;
  branch: string;
}

export interface ImplementationWorkflowOptions {
  worktree?: ImplementationWorkspace;
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
    options: ImplementationWorkflowOptions = {},
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

    const orchestrator = new Orchestrator(task);

    const worktree =
      options.worktree ??
      await createTaskWorktree({
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
      orchestrator.transition("NEEDS_HUMAN");

      throw new Error(
        "Builder requires human input before validation can begin.",
      );
    }

    // Only factory-created worktrees are guaranteed to be real Git
    // repositories. Supplied benchmark workspaces may be virtual paths.
    if (!options.worktree) {
      // Model-reported changedFiles are claims, not evidence of a diff.
      // Reject unchanged replacements before any validation or review.
      const { stdout: diffOutput } = await execFileAsync(
        "git",
        ["diff", "--name-only", "HEAD", "--"],
        { cwd: worktree.path },
      );
      const actuallyChanged = new Set(
        diffOutput.split("\n").map((path) => path.trim()).filter(Boolean),
      );
      const reportedPaths = implementation.changedFiles
        .filter((change) => change.changeType !== "deleted")
        .map((change) => change.path);
      if (
        actuallyChanged.size === 0 ||
        reportedPaths.some((path) => !actuallyChanged.has(path))
      ) {
        throw new Error(
          "Builder reported implementation changes without corresponding Git diffs. " +
          "Refusing to validate unchanged or incomplete implementation.",
        );
      }

    }

    orchestrator.transition("VALIDATING");

    const validation =
      await this.validator.validate(
        worktree.path,
      );

    if (validation.passed) {
      orchestrator.transition("REVIEWING");
    } else {
      orchestrator.transition(
        "DIAGNOSING_FAILURE",
      );
    }

    return {
      task: orchestrator.getTask(),
      worktree,
      implementation,
      validation,
    };
  }
}