import type {
    Reviewer,
    ReviewerInput,
  } from "../agents/reviewer.js";
  import type {
    ReviewResult,
  } from "../schemas/review.js";
  import type {
    TaskRisk,
  } from "../schemas/task.js";
  import {
    evaluateDisagreementEscalation,
    type DisagreementEscalationDecision,
  } from "./disagreement-escalation-policy.js";
  import {
    evaluateModelDisagreement,
    type ModelDisagreement,
    type ModelReviewJudgment,
  } from "./model-disagreement.js";
  
  export interface ReviewTarget {
    id: string;
    model: string;
    reviewer: Reviewer;
  }
  
  export interface SuccessfulReviewExecution {
    targetId: string;
    model: string;
    status: "success";
    review: ReviewResult;
  }
  
  export interface FailedReviewExecution {
    targetId: string;
    model: string;
    status: "error";
    error: string;
  }
  
  export type ReviewExecution =
    | SuccessfulReviewExecution
    | FailedReviewExecution;
  
  export interface MultiModelReviewResult {
    executions: ReviewExecution[];
    disagreement: ModelDisagreement;
    escalation: DisagreementEscalationDecision;
  }
  
  export class MultiModelReviewCoordinator {
    async review(
      input: ReviewerInput,
      targets: ReviewTarget[],
      taskRisk: TaskRisk,
    ): Promise<MultiModelReviewResult> {
      if (targets.length < 2) {
        throw new Error(
          "Multi-model review requires at least two review targets.",
        );
      }
  
      this.assertUniqueTargetIds(targets);
  
      const executions = await Promise.all(
        targets.map((target) =>
          this.executeReview(
            input,
            target,
          ),
        ),
      );
  
      const judgments =
        this.createJudgments(executions);
  
      const disagreement =
        evaluateModelDisagreement(
          judgments,
        );
  
      const escalation =
        evaluateDisagreementEscalation({
          disagreement,
          taskRisk,
        });
  
      return {
        executions,
        disagreement,
        escalation,
      };
    }
  
    private async executeReview(
      input: ReviewerInput,
      target: ReviewTarget,
    ): Promise<ReviewExecution> {
      try {
        const review =
          await target.reviewer.review(
            input,
          );
  
        return {
          targetId: target.id,
          model: target.model,
          status: "success",
          review,
        };
      } catch (error) {
        return {
          targetId: target.id,
          model: target.model,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }
  
    private createJudgments(
      executions: ReviewExecution[],
    ): ModelReviewJudgment[] {
      return executions.flatMap(
        (execution) => {
          if (
            execution.status === "error"
          ) {
            return [];
          }
  
          return [
            {
              targetId:
                execution.targetId,
              model: execution.model,
              approved:
                execution.review.approved,
              requiresHumanInput:
                execution.review
                  .requiresHumanInput,
              confidence:
                execution.review.confidence,
            },
          ];
        },
      );
    }
  
    private assertUniqueTargetIds(
      targets: ReviewTarget[],
    ): void {
      const ids = new Set<string>();
  
      for (const target of targets) {
        if (ids.has(target.id)) {
          throw new Error(
            `Duplicate review target: ${target.id}`,
          );
        }
  
        ids.add(target.id);
      }
    }
  }