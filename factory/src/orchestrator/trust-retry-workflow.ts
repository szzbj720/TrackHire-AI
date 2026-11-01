import type {
  Repairer,
} from "../agents/repairer.js";
import type {
  FailureDiagnosis,
} from "../schemas/diagnosis.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  TrustDecision,
} from "../schemas/trust-decision.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  Workspace,
} from "../tools/workspace.js";
import type {
  Validator,
} from "../validation/validator.js";
import {
  Orchestrator,
} from "./orchestrator.js";

export interface TrustRetryWorkflowInput {
  task: EngineeringTask;
  implementation: ImplementationResult;
  validation: ValidationResult;
  verification: VerificationResult;
  review: ReviewResult;
  trustDecision: TrustDecision;
  worktreePath: string;
}

export interface TrustRetryWorkflowResult {
  task: EngineeringTask;
  repair?: ImplementationResult;
  validation: ValidationResult;
  diagnosis: FailureDiagnosis;
}

export class TrustRetryWorkflow {
  constructor(
    private readonly repairer: Repairer,
    private readonly validator: Validator,
    private readonly maxRepairAttempts = 2,
  ) {}

  async run(
    input: TrustRetryWorkflowInput,
  ): Promise<TrustRetryWorkflowResult> {
    if (input.trustDecision.action !== "RETRY") {
      throw new Error(
        `Cannot retry trust decision with action ${input.trustDecision.action}.`,
      );
    }

    if (
      input.task.status !== "AWAITING_FINAL_APPROVAL" &&
      input.task.status !== "NEEDS_HUMAN"
    ) {
      throw new Error(
        `Cannot retry trust decision while task is in state ${input.task.status}.`,
      );
    }

    if (!input.task.plan) {
      throw new Error(
        "Cannot retry trust decision without an approved plan.",
      );
    }

    if (
      input.task.repairAttempts >=
      this.maxRepairAttempts
    ) {
      throw new Error(
        "Cannot retry trust decision after the repair attempt budget is exhausted.",
      );
    }

    const diagnosis =
      this.buildDiagnosis(input);
    const orchestrator =
      new Orchestrator(input.task);

    orchestrator.transition("REPAIRING");

    const workspace =
      new Workspace(input.worktreePath);
    const relevantFiles =
      await this.readRelevantFiles(
        workspace,
        input.task.plan.affectedFiles,
      );

    const repair =
      await this.repairer.repair({
        task: orchestrator.getTask(),
        plan: input.task.plan,
        implementation:
          input.implementation,
        validation: input.validation,
        diagnosis,
        relevantFiles,
        worktreePath: input.worktreePath,
      });

    if (repair.requiresHumanInput) {
      orchestrator.transition("NEEDS_HUMAN");

      return {
        task: orchestrator.getTask(),
        repair,
        validation: input.validation,
        diagnosis,
      };
    }

    const repairAttempts =
      input.task.repairAttempts + 1;

    input.task.repairAttempts =
      repairAttempts;
    input.task.updatedAt =
      new Date().toISOString();

    orchestrator.transition("VALIDATING");

    const validation =
      await this.validator.validate(
        input.worktreePath,
      );

    if (validation.passed) {
      orchestrator.transition("REVIEWING");
    } else {
      orchestrator.transition(
        "DIAGNOSING_FAILURE",
      );
    }

    const task = orchestrator.getTask();
    task.repairAttempts = repairAttempts;
    task.updatedAt = input.task.updatedAt;

    return {
      task,
      repair,
      validation,
      diagnosis,
    };
  }

  private buildDiagnosis(
    input: TrustRetryWorkflowInput,
  ): FailureDiagnosis {
    const evidence = [
      ...input.trustDecision.reasons,
      ...input.verification.failedProbes.map(
        (probe) =>
          `Independent verification failed probe: ${probe}.`,
      ),
      ...input.review.findings.map(
        (finding) =>
          `${finding.severity}: ${finding.summary}`,
      ),
    ];

    return {
      category: "INCORRECT_IMPLEMENTATION",
      summary:
        "Trust evaluation found actionable negative evidence after review.",
      evidence:
        evidence.length > 0
          ? evidence
          : [
              "The trust decision requested an automated retry.",
            ],
      suspectedFiles:
        input.implementation.changedFiles.map(
          (change) => change.path,
        ),
      recommendedAction:
        "Repair the implementation using the trust, verification, and review evidence, then rerun deterministic validation.",
      repairable: true,
      confidence:
        input.trustDecision.confidence,
      requiresHumanInput: false,
    };
  }

  private async readRelevantFiles(
    workspace: Workspace,
    paths: string[],
  ): Promise<
    Array<{
      path: string;
      content: string;
    }>
  > {
    const files: Array<{
      path: string;
      content: string;
    }> = [];

    for (const path of paths) {
      files.push({
        path,
        content:
          await workspace.read(path),
      });
    }

    return files;
  }
}
