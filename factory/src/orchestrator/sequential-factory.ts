import type {
  RunArtifactStore,
} from "../artifact/run-artifact-store.js";
import type {
  MultiModelReviewResult,
} from "../models/multi-model-review-coordinator.js";
import type {
  ChangeEvidence,
} from "../schemas/change-evidence.js";
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
import type {
  Worktree,
} from "../tools/git-worktree.js";
import {
  Workspace,
} from "../tools/workspace.js";
import {
  combineImplementationEvidence,
} from "../evidence/implementation-evidence.js";
import type {
  VerificationPlan,
} from "../verification/verification-planner.js";
import type {
  VerificationWorkflow,
} from "../verification/verification-workflow.js";
import type {
  DiagnosisWorkflow,
} from "./diagnosis-workflow.js";
import type {
  ImplementationWorkflow,
} from "./implementation-workflow.js";
import {
  Orchestrator,
} from "./orchestrator.js";
import type {
  PlanningWorkflow,
} from "./planning-workflow.js";
import type {
  RepairWorkflow,
} from "./repair-workflow.js";
import {
  extractReviewLifecycleEvidence,
} from "./review-lifecycle-evidence.js";
import type {
  ReviewWorkflow,
} from "./review-workflow.js";
import type {
  TrustDecisionWorkflow,
} from "./trust-decision-workflow.js";

export interface SequentialFactoryRun {
  task: EngineeringTask;
  worktree?: Worktree;
  implementation?: ImplementationResult;
  validation?: ValidationResult;
  verificationPlan?: VerificationPlan;
  verification?: VerificationResult;
  diagnosis?: FailureDiagnosis;
  repairs: ImplementationResult[];
  review?: ReviewResult;
  multiModelReview?: MultiModelReviewResult;
  changeEvidence?: ChangeEvidence;
  trustDecision?: TrustDecision;
}

export type SequentialFactoryStopReason =
  | "PLAN_APPROVAL_REQUIRED"
  | "FINAL_APPROVAL_REQUIRED"
  | "TRUST_RETRY_REQUIRED"
  | "HUMAN_INPUT_REQUIRED"
  | "COMPLETE"
  | "FAILED";

export interface SequentialFactoryResult {
  run: SequentialFactoryRun;
  stopReason: SequentialFactoryStopReason;
}

export class SequentialFactory {
  constructor(
    private readonly planningWorkflow:
      PlanningWorkflow,
    private readonly implementationWorkflow?:
      ImplementationWorkflow,
    private readonly diagnosisWorkflow?:
      DiagnosisWorkflow,
    private readonly repairWorkflow?:
      RepairWorkflow,
    private readonly reviewWorkflow?:
      ReviewWorkflow,
    private readonly artifactStore?:
      RunArtifactStore,
    private readonly verificationWorkflow?:
      VerificationWorkflow,
    private readonly trustDecisionWorkflow?:
      TrustDecisionWorkflow,
  ) {}

  async start(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<SequentialFactoryResult> {
    if (task.status !== "TASK_CREATED") {
      throw new Error(
        `Cannot start sequential factory while task is in state ${task.status}`,
      );
    }

    const orchestrator =
      await this.planningWorkflow.run(
        task,
        repositoryRoot,
      );

    const plannedTask =
      orchestrator.getTask();

    const run: SequentialFactoryRun = {
      task: plannedTask,
      repairs: [],
    };

    await this.persistRun(run);

    if (
      plannedTask.status ===
      "AWAITING_PLAN_APPROVAL"
    ) {
      return {
        run,
        stopReason:
          "PLAN_APPROVAL_REQUIRED",
      };
    }

    if (
      plannedTask.status ===
      "NEEDS_HUMAN"
    ) {
      return {
        run,
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };
    }

    if (
      plannedTask.status === "FAILED"
    ) {
      return {
        run,
        stopReason: "FAILED",
      };
    }

    throw new Error(
      `Planning stopped in unexpected state ${plannedTask.status}`,
    );
  }

  async resumeAfterPlanApproval(
    run: SequentialFactoryRun,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<SequentialFactoryResult> {
    if (
      run.task.status !==
      "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Cannot approve plan while task is in state ${run.task.status}`,
      );
    }

    if (!this.implementationWorkflow) {
      throw new Error(
        "Sequential factory does not have an implementation workflow.",
      );
    }

    const orchestrator =
      new Orchestrator(run.task);

    orchestrator.approvePlan();

    const implementationResult =
      await this.implementationWorkflow.run(
        orchestrator.getTask(),
        repositoryRoot,
        baseBranch,
      );

    const nextRun: SequentialFactoryRun = {
      ...run,
      task: implementationResult.task,
      worktree:
        implementationResult.worktree,
      implementation:
        implementationResult.implementation,
      validation:
        implementationResult.validation,
    };

    await this.persistRun(nextRun);

    return this.continueAfterValidation(
      nextRun,
    );
  }

  async resumeAfterFinalApproval(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    if (
      run.task.status !==
      "AWAITING_FINAL_APPROVAL"
    ) {
      throw new Error(
        `Cannot approve final result while task is in state ${run.task.status}`,
      );
    }

    const orchestrator =
      new Orchestrator(run.task);

    orchestrator.approveFinal();

    const completedRun: SequentialFactoryRun = {
      ...run,
      task: orchestrator.getTask(),
    };

    await this.persistRun(completedRun);

    return {
      run: completedRun,
      stopReason: "COMPLETE",
    };
  }

  private async continueAfterValidation(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    if (run.task.status === "REVIEWING") {
      return this.verifyAndReviewImplementation(
        run,
      );
    }

    if (
      run.task.status ===
      "DIAGNOSING_FAILURE"
    ) {
      return this.handleFailure(run);
    }

    if (
      run.task.status ===
      "NEEDS_HUMAN"
    ) {
      return {
        run,
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };
    }

    if (run.task.status === "FAILED") {
      return {
        run,
        stopReason: "FAILED",
      };
    }

    throw new Error(
      `Validation stopped in unexpected state ${run.task.status}`,
    );
  }

  private async handleFailure(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    let currentRun = run;

    while (
      currentRun.task.status ===
      "DIAGNOSING_FAILURE"
    ) {
      currentRun =
        await this.diagnoseFailure(
          currentRun,
        );

      if (
        currentRun.task.status ===
        "NEEDS_HUMAN"
      ) {
        return {
          run: currentRun,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };
      }

      if (
        currentRun.task.status ===
        "FAILED"
      ) {
        return {
          run: currentRun,
          stopReason: "FAILED",
        };
      }

      if (
        currentRun.task.status !==
        "REPAIRING"
      ) {
        throw new Error(
          `Diagnosis stopped in unexpected state ${currentRun.task.status}`,
        );
      }

      currentRun =
        await this.repairFailure(
          currentRun,
        );

      if (
        currentRun.task.status ===
        "REVIEWING"
      ) {
        return this.verifyAndReviewImplementation(
          currentRun,
        );
      }

      if (
        currentRun.task.status ===
        "NEEDS_HUMAN"
      ) {
        return {
          run: currentRun,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };
      }

      if (
        currentRun.task.status ===
        "FAILED"
      ) {
        return {
          run: currentRun,
          stopReason: "FAILED",
        };
      }

      if (
        currentRun.task.status !==
        "DIAGNOSING_FAILURE"
      ) {
        throw new Error(
          `Repair stopped in unexpected state ${currentRun.task.status}`,
        );
      }
    }

    throw new Error(
      `Failure recovery stopped in unexpected state ${currentRun.task.status}`,
    );
  }

  private async diagnoseFailure(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryRun> {
    if (!this.diagnosisWorkflow) {
      throw new Error(
        "Sequential factory does not have a diagnosis workflow.",
      );
    }

    if (!run.worktree) {
      throw new Error(
        "Cannot diagnose failure without a worktree.",
      );
    }

    if (!run.implementation) {
      throw new Error(
        "Cannot diagnose failure without an implementation result.",
      );
    }

    if (!run.validation) {
      throw new Error(
        "Cannot diagnose failure without validation evidence.",
      );
    }

    const diagnosisResult =
      await this.diagnosisWorkflow.run({
        task: run.task,
        implementation:
          run.implementation,
        validation: run.validation,
        worktreePath: run.worktree.path,
      });

    const nextRun: SequentialFactoryRun = {
      ...run,
      task: diagnosisResult.task,
      diagnosis:
        diagnosisResult.diagnosis,
    };

    await this.persistRun(nextRun);

    return nextRun;
  }

  private async repairFailure(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryRun> {
    if (!this.repairWorkflow) {
      throw new Error(
        "Sequential factory does not have a repair workflow.",
      );
    }

    if (!run.worktree) {
      throw new Error(
        "Cannot repair failure without a worktree.",
      );
    }

    if (!run.implementation) {
      throw new Error(
        "Cannot repair failure without an implementation result.",
      );
    }

    if (!run.validation) {
      throw new Error(
        "Cannot repair failure without validation evidence.",
      );
    }

    if (!run.diagnosis) {
      throw new Error(
        "Cannot repair failure without a diagnosis.",
      );
    }

    const repairResult =
      await this.repairWorkflow.run({
        task: run.task,
        implementation:
          run.implementation,
        validation: run.validation,
        diagnosis: run.diagnosis,
        worktreePath: run.worktree.path,
      });

    const repairs = [...run.repairs];

    if (repairResult.repair) {
      repairs.push(
        repairResult.repair,
      );
    }

    const nextRun: SequentialFactoryRun = {
      ...run,
      task: repairResult.task,
      validation:
        repairResult.validation,
      repairs,
    };

    await this.persistRun(nextRun);

    return nextRun;
  }

  private async verifyAndReviewImplementation(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    if (!this.verificationWorkflow) {
      return this.reviewImplementation(run);
    }

    if (!run.worktree) {
      throw new Error(
        "Cannot verify without a worktree.",
      );
    }

    if (!run.implementation) {
      throw new Error(
        "Cannot verify without an implementation result.",
      );
    }

    if (!run.validation) {
      throw new Error(
        "Cannot verify without validation evidence.",
      );
    }

    if (!run.validation.passed) {
      throw new Error(
        "Cannot run independent verification after failed deterministic validation.",
      );
    }

    const implementationEvidence =
      combineImplementationEvidence(
        run.implementation,
        run.repairs,
      );

    const workspace =
      new Workspace(run.worktree.path);

    const changedFiles = await Promise.all(
      implementationEvidence.changedFiles
        .filter(
          (change) =>
            change.changeType !== "deleted",
        )
        .map(async (change) => ({
          path: change.path,
          content:
            await workspace.read(change.path),
        })),
    );

    const verificationResult =
      await this.verificationWorkflow.run({
        task: run.task,
        validation: run.validation,
        changedFiles,
        worktreePath: run.worktree.path,
      });

    const nextRun: SequentialFactoryRun = {
      ...run,
      verificationPlan:
        verificationResult.plan,
      verification:
        verificationResult.verification,
    };

    await this.persistRun(nextRun);

    return this.reviewImplementation(nextRun);
  }

  private async reviewImplementation(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    if (!this.reviewWorkflow) {
      throw new Error(
        "Sequential factory does not have a review workflow.",
      );
    }

    if (!run.worktree) {
      throw new Error(
        "Cannot review without a worktree.",
      );
    }

    if (!run.implementation) {
      throw new Error(
        "Cannot review without an implementation result.",
      );
    }

    if (!run.validation) {
      throw new Error(
        "Cannot review without validation evidence.",
      );
    }

    const implementationEvidence =
      combineImplementationEvidence(
        run.implementation,
        run.repairs,
      );

    const reviewResult =
      await this.reviewWorkflow.run({
        task: run.task,
        implementation:
          implementationEvidence,
        validation: run.validation,
        ...(run.verification
          ? {
              verification:
                run.verification,
            }
          : {}),
        worktreePath:
          run.worktree.path,
      });

    const reviewEvidence =
      extractReviewLifecycleEvidence(
        reviewResult,
      );

    let nextRun: SequentialFactoryRun = {
      ...run,
      task: reviewResult.task,
      changeEvidence:
        reviewResult.changeEvidence,
      ...reviewEvidence,
    };

    if (
      this.trustDecisionWorkflow &&
      nextRun.validation &&
      nextRun.verification &&
      nextRun.review
    ) {
      const trustDecision =
        this.trustDecisionWorkflow.run({
          task: nextRun.task,
          validation: nextRun.validation,
          verification: nextRun.verification,
          review: nextRun.review,
        });

      nextRun = {
        ...nextRun,
        trustDecision,
      };
    }

    await this.persistRun(nextRun);

    if (
      nextRun.trustDecision?.action ===
      "RETRY"
    ) {
      return {
        run: nextRun,
        stopReason:
          "TRUST_RETRY_REQUIRED",
      };
    }

    if (
      nextRun.trustDecision?.action ===
      "ESCALATE"
    ) {
      return {
        run: nextRun,
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };
    }

    if (
      nextRun.task.status ===
      "AWAITING_FINAL_APPROVAL"
    ) {
      return {
        run: nextRun,
        stopReason:
          "FINAL_APPROVAL_REQUIRED",
      };
    }

    if (
      nextRun.task.status ===
      "NEEDS_HUMAN"
    ) {
      return {
        run: nextRun,
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };
    }

    if (
      nextRun.task.status === "FAILED"
    ) {
      return {
        run: nextRun,
        stopReason: "FAILED",
      };
    }

    throw new Error(
      `Review stopped in unexpected state ${nextRun.task.status}`,
    );
  }

  private async persistRun(
    run: SequentialFactoryRun,
  ): Promise<void> {
    if (!this.artifactStore) {
      return;
    }

    const runId = run.task.id;

    await this.artifactStore.writeJson(
      runId,
      "task",
      run.task,
    );

    if (run.task.analysis) {
      await this.artifactStore.writeJson(
        runId,
        "analysis",
        run.task.analysis,
      );
    }

    if (run.task.plan) {
      await this.artifactStore.writeJson(
        runId,
        "plan",
        run.task.plan,
      );
    }

    if (run.implementation) {
      await this.artifactStore.writeJson(
        runId,
        "implementation",
        run.implementation,
      );
    }

    if (run.validation) {
      await this.artifactStore.writeJson(
        runId,
        "validation",
        run.validation,
      );
    }

    if (run.verificationPlan) {
      await this.artifactStore.writeJson(
        runId,
        "verification-plan",
        run.verificationPlan,
      );
    }

    if (run.verification) {
      await this.artifactStore.writeJson(
        runId,
        "verification",
        run.verification,
      );
    }

    if (run.diagnosis) {
      await this.artifactStore.writeJson(
        runId,
        "diagnosis",
        run.diagnosis,
      );
    }

    if (run.repairs.length > 0) {
      await this.artifactStore.writeJson(
        runId,
        "repairs",
        run.repairs,
      );
    }

    if (run.review) {
      await this.artifactStore.writeJson(
        runId,
        "review",
        run.review,
      );
    }

    if (run.multiModelReview) {
      await this.artifactStore.writeJson(
        runId,
        "multi-model-review",
        run.multiModelReview,
      );
    }

    if (run.changeEvidence) {
      await this.artifactStore.writeJson(
        runId,
        "change-evidence",
        run.changeEvidence,
      );
    }

    if (run.trustDecision) {
      await this.artifactStore.writeJson(
        runId,
        "trust-decision",
        run.trustDecision,
      );
    }

    await this.artifactStore.writeJson(
      runId,
      "run",
      run,
    );
  }
}
