import type {
  Reviewer,
  ReviewerInput,
} from "../agents/reviewer.js";
import {
  buildChangeEvidence,
} from "../evidence/change-evidence.js";
import type {
  MultiModelReviewResult,
  ReviewTarget,
} from "../models/multi-model-review-coordinator.js";
import {
  MultiModelReviewCoordinator,
} from "../models/multi-model-review-coordinator.js";
import type {
  ChangeEvidence,
} from "../schemas/change-evidence.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import {
  getGitDiffEvidence,
} from "../tools/git-diff.js";
import {
  Workspace,
} from "../tools/workspace.js";
import {
  Orchestrator,
} from "./orchestrator.js";

export interface ReviewWorkflowInput {
  task: EngineeringTask;
  implementation: ImplementationResult;
  validation: ValidationResult;
  worktreePath: string;
  baseRef?: string;
}

export interface MultiModelReviewConfiguration {
  targets: ReviewTarget[];
  coordinator?: MultiModelReviewCoordinator;
}

export interface ReviewWorkflowResult {
  task: EngineeringTask;
  review?: ReviewResult;
  multiModelReview?: MultiModelReviewResult;
  changeEvidence: ChangeEvidence;
}

export class ReviewWorkflow {
  constructor(
    private readonly reviewer: Reviewer,
    private readonly approvalConfidenceThreshold = 0.7,
    private readonly multiModelReviewConfiguration?: MultiModelReviewConfiguration,
  ) {}

  async run(
    input: ReviewWorkflowInput,
  ): Promise<ReviewWorkflowResult> {
    if (
      input.task.status !== "REVIEWING"
    ) {
      throw new Error(
        `Cannot review while task is in state ${input.task.status}`,
      );
    }

    if (!input.task.plan) {
      throw new Error(
        "Cannot review without an approved plan.",
      );
    }

    if (!input.validation.passed) {
      throw new Error(
        "Cannot review an implementation that failed deterministic validation.",
      );
    }

    const gitDiff =
      await getGitDiffEvidence(
        input.worktreePath,
        input.baseRef,
      );

    const changeEvidence =
      buildChangeEvidence(
        input.task.plan,
        input.implementation,
        gitDiff,
      );

    const orchestrator =
      new Orchestrator(input.task);

    if (
      !changeEvidence.withinApprovedScope ||
      !changeEvidence.reportMatchesObserved
    ) {
      orchestrator.transition(
        "NEEDS_HUMAN",
      );

      return {
        task: orchestrator.getTask(),
        changeEvidence,
      };
    }

    const workspace =
      new Workspace(
        input.worktreePath,
      );

    const relevantFiles =
      await this.readRelevantFiles(
        workspace,
        input.task.plan.affectedFiles,
      );

    const reviewerInput: ReviewerInput = {
      task: input.task,
      plan: input.task.plan,
      implementation:
        input.implementation,
      validation:
        input.validation,
      relevantFiles,
    };

    const taskRisk =
      input.task.analysis?.risk;

    if (
      this.shouldUseMultiModelReview(
        taskRisk,
      )
    ) {
      return this.runMultiModelReview(
        orchestrator,
        reviewerInput,
        changeEvidence,
        taskRisk,
      );
    }

    const review =
      await this.reviewer.review(
        reviewerInput,
      );

    if (
      review.approved &&
      !review.requiresHumanInput &&
      review.confidence >=
        this.approvalConfidenceThreshold
    ) {
      orchestrator.transition(
        "AWAITING_FINAL_APPROVAL",
      );
    } else {
      orchestrator.transition(
        "NEEDS_HUMAN",
      );
    }

    return {
      task: orchestrator.getTask(),
      review,
      changeEvidence,
    };
  }

  private shouldUseMultiModelReview(
    taskRisk: TaskRisk | undefined,
  ): taskRisk is "medium" | "high" {
    return (
      this.multiModelReviewConfiguration !==
        undefined &&
      (
        taskRisk === "medium" ||
        taskRisk === "high"
      )
    );
  }

  private async runMultiModelReview(
    orchestrator: Orchestrator,
    reviewerInput: ReviewerInput,
    changeEvidence: ChangeEvidence,
    taskRisk: "medium" | "high",
  ): Promise<ReviewWorkflowResult> {
    const configuration =
      this.multiModelReviewConfiguration;

    if (!configuration) {
      throw new Error(
        "Multi-model review configuration is required.",
      );
    }

    const coordinator =
      configuration.coordinator ??
      new MultiModelReviewCoordinator();

    const multiModelReview =
      await coordinator.review(
        reviewerInput,
        configuration.targets,
        taskRisk,
      );

    const successfulExecutions =
      multiModelReview.executions.filter(
        (execution) =>
          execution.status === "success",
      );

    const failedExecutions =
      multiModelReview.executions.filter(
        (execution) =>
          execution.status === "error",
      );

    const primaryExecution =
      successfulExecutions[0];

    if (
      failedExecutions.length > 0 ||
      !primaryExecution ||
      multiModelReview.escalation
        .requiresHumanInput
    ) {
      orchestrator.transition(
        "NEEDS_HUMAN",
      );

      if (
        primaryExecution?.status ===
        "success"
      ) {
        return {
          task: orchestrator.getTask(),
          review:
            primaryExecution.review,
          multiModelReview,
          changeEvidence,
        };
      }

      return {
        task: orchestrator.getTask(),
        multiModelReview,
        changeEvidence,
      };
    }

    const review =
      primaryExecution.review;

    const allReviewsApprove =
      successfulExecutions.every(
        (execution) =>
          execution.status ===
            "success" &&
          execution.review.approved &&
          !execution.review
            .requiresHumanInput &&
          execution.review.confidence >=
            this.approvalConfidenceThreshold,
      );

    if (allReviewsApprove) {
      orchestrator.transition(
        "AWAITING_FINAL_APPROVAL",
      );
    } else {
      orchestrator.transition(
        "NEEDS_HUMAN",
      );
    }

    return {
      task: orchestrator.getTask(),
      review,
      multiModelReview,
      changeEvidence,
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
      const content =
        await workspace.read(path);

      files.push({
        path,
        content,
      });
    }

    return files;
  }
}