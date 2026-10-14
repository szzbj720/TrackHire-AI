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