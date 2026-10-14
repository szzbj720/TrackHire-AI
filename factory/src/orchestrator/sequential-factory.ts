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
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    ChangeEvidence,
  } from "../schemas/change-evidence.js";
  import type {
    Worktree,
  } from "../tools/git-worktree.js";
  import {
    combineImplementationEvidence,
  } from "../evidence/implementation-evidence.js";
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
  import type {
    ReviewWorkflow,
  } from "./review-workflow.js";
  
  export interface SequentialFactoryRun {
    task: EngineeringTask;
    worktree?: Worktree;
    implementation?: ImplementationResult;
    validation?: ValidationResult;
    diagnosis?: FailureDiagnosis;
    repairs: ImplementationResult[];
    review?: ReviewResult;
    changeEvidence?: ChangeEvidence;
  }
  
  export type SequentialFactoryStopReason =
    | "PLAN_APPROVAL_REQUIRED"
    | "FINAL_APPROVAL_REQUIRED"
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
  
      return this.continueAfterValidation(
        nextRun,
      );
    }
  
    private async continueAfterValidation(
      run: SequentialFactoryRun,
    ): Promise<SequentialFactoryResult> {
      if (run.task.status === "REVIEWING") {
        return this.reviewImplementation(
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
          currentRun.task.status === "FAILED"
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
          return this.reviewImplementation(
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
          currentRun.task.status === "FAILED"
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
  
      return {
        ...run,
        task: diagnosisResult.task,
        diagnosis:
          diagnosisResult.diagnosis,
      };
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
        repairs.push(repairResult.repair);
      }
  
      return {
        ...run,
        task: repairResult.task,
        validation:
          repairResult.validation,
        repairs,
      };
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
          worktreePath: run.worktree.path,
        });
  
      const nextRun: SequentialFactoryRun = {
        ...run,
        task: reviewResult.task,
        changeEvidence:
          reviewResult.changeEvidence,
        ...(reviewResult.review
          ? {
              review:
                reviewResult.review,
            }
          : {}),
      };
  
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
  }