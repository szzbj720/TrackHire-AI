import { stat } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

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

    // A model may invent a test filename. Do not treat a missing test
    // as an implementation failure or trigger an automated repair.
    for (const probe of plan.probes) {
      const targets = probe.args.slice(1).filter((arg) => !arg.startsWith("-"));
      for (const target of targets) {
        if (!target.endsWith(".dart")) {
          continue;
        }
        const absoluteTarget = resolve(input.worktreePath, target);
        const relativeTarget = relative(input.worktreePath, absoluteTarget);
        if (
          isAbsolute(target) ||
          relativeTarget === ".." ||
          relativeTarget.startsWith("../") ||
          relativeTarget.startsWith("..\\")
        ) {
          throw new Error(
            `Verification probe "${probe.id}" references an unsafe test path: ${target}.`,
          );
        }
        const file = await stat(absoluteTarget).catch(() => null);
        if (!file?.isFile()) {
          throw new Error(
            `Verification probe "${probe.id}" references a missing test file: ${target}. This is a verification-plan error, not an implementation failure.`,
          );
        }
      }
    }

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
