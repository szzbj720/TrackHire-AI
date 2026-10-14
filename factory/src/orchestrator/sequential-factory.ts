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
  import type {
    ImplementationWorkflow,
  } from "./implementation-workflow.js";
  import {
    Orchestrator,
  } from "./orchestrator.js";
  import type {
    PlanningWorkflow,
  } from "./planning-workflow.js";
  
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
    | "READY_FOR_DIAGNOSIS"
    | "READY_FOR_REVIEW"
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
  
      if (
        implementationResult.task.status ===
        "REVIEWING"
      ) {
        return {
          run: nextRun,
          stopReason: "READY_FOR_REVIEW",
        };
      }
  
      if (
        implementationResult.task.status ===
        "DIAGNOSING_FAILURE"
      ) {
        return {
          run: nextRun,
          stopReason:
            "READY_FOR_DIAGNOSIS",
        };
      }
  
      if (
        implementationResult.task.status ===
        "NEEDS_HUMAN"
      ) {
        return {
          run: nextRun,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };
      }
  
      if (
        implementationResult.task.status ===
        "FAILED"
      ) {
        return {
          run: nextRun,
          stopReason: "FAILED",
        };
      }
  
      throw new Error(
        `Implementation stopped in unexpected state ${implementationResult.task.status}`,
      );
    }
  }