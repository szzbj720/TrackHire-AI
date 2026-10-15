import type {
    Reviewer,
  } from "../agents/reviewer.js";
  import {
    buildChangeEvidence,
  } from "../evidence/change-evidence.js";
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
  }
  
  export interface ReviewWorkflowResult {
    task: EngineeringTask;
    review?: ReviewResult;
    changeEvidence: ChangeEvidence;
  }
  
  export class ReviewWorkflow {
    constructor(
      private readonly reviewer: Reviewer,
      private readonly approvalConfidenceThreshold = 0.7,
    ) {}
  
    async run(
      input: ReviewWorkflowInput,
    ): Promise<ReviewWorkflowResult> {
      if (input.task.status !== "REVIEWING") {
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
  
      const workspace = new Workspace(
        input.worktreePath,
      );
  
      const relevantFiles =
        await this.readRelevantFiles(
          workspace,
          input.task.plan.affectedFiles,
        );
  
      const review =
        await this.reviewer.review({
          task: input.task,
          plan: input.task.plan,
          implementation:
            input.implementation,
          validation: input.validation,
          relevantFiles,
        });
  
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