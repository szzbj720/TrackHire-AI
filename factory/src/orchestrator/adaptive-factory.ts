import type {
  FailureDiagnosis,
} from "../schemas/diagnosis.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  WorkGraph,
} from "../schemas/work-graph.js";
import type {
  DiagnosisWorkflowInput,
  DiagnosisWorkflowResult,
} from "./diagnosis-workflow.js";
import type {
  LightweightWorkflow,
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
import { Orchestrator } from "./orchestrator.js";
import type {
  ParallelExecutionInput,
  ParallelExecutionResult,
} from "./parallel-execution-workflow.js";
import type {
  ParallelPlanningWorkflow,
} from "./parallel-planning-workflow.js";
import type {
  ParallelValidationResult,
} from "./parallel-validation-workflow.js";
import type {
  RepairWorkflowInput,
  RepairWorkflowResult,
} from "./repair-workflow.js";
import type {
  ReviewWorkflowInput,
  ReviewWorkflowResult,
} from "./review-workflow.js";
import {
  routeTask,
  type AdaptiveRoutingDecision,
} from "./adaptive-routing.js";
import type {
  SequentialFactoryResult,
  SequentialFactoryRun,
} from "./sequential-factory.js";

export interface SequentialFactoryAdapter {
  start(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<SequentialFactoryResult>;

  resumeAfterPlanApproval(
    run: SequentialFactoryRun,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<SequentialFactoryResult>;

  resumeAfterFinalApproval(
    run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult>;
}

export interface ParallelExecutionWorkflowAdapter {
  run(
    input: ParallelExecutionInput,
  ): Promise<ParallelExecutionResult>;
}

export interface ParallelValidationWorkflowAdapter {
  run(
    execution: ParallelExecutionResult,
  ): Promise<ParallelValidationResult>;
}

export interface DiagnosisWorkflowAdapter {
  run(
    input: DiagnosisWorkflowInput,
  ): Promise<DiagnosisWorkflowResult>;
}

export interface RepairWorkflowAdapter {
  run(
    input: RepairWorkflowInput,
  ): Promise<RepairWorkflowResult>;
}

export interface ReviewWorkflowAdapter {
  run(
    input: ReviewWorkflowInput,
  ): Promise<ReviewWorkflowResult>;
}

export type AdaptiveFactoryStopReason =
  | "PLAN_APPROVAL_REQUIRED"
  | "LIGHTWEIGHT_EXECUTION_REQUIRED"
  | "PARALLEL_APPROVAL_REQUIRED"
  | "PARALLEL_VALIDATION_REQUIRED"
  | "PARALLEL_DIAGNOSIS_REQUIRED"
  | "PARALLEL_REPAIR_REQUIRED"
  | "PARALLEL_REVIEW_REQUIRED"
  | "TRUST_RETRY_REQUIRED"
  | "FINAL_APPROVAL_REQUIRED"
  | "HUMAN_INPUT_REQUIRED"
  | "COMPLETE"
  | "FAILED";

export interface AdaptiveFactoryResult {
  run: SequentialFactoryRun;
  route?: AdaptiveRoutingDecision;
  workGraph?: WorkGraph;
  parallelExecution?: ParallelExecutionResult;
  parallelValidation?: ParallelValidationResult;
  diagnosis?: FailureDiagnosis;
  stopReason: AdaptiveFactoryStopReason;
}

export class AdaptiveFactory {
  constructor(
    private readonly sequentialFactory:
      SequentialFactoryAdapter,
    private readonly lightweightWorkflow?:
      LightweightWorkflow,
    private readonly parallelPlanningWorkflow?:
      ParallelPlanningWorkflow,
    private readonly parallelExecutionWorkflow?:
      ParallelExecutionWorkflowAdapter,
    private readonly parallelValidationWorkflow?:
      ParallelValidationWorkflowAdapter,
    private readonly diagnosisWorkflow?:
      DiagnosisWorkflowAdapter,
    private readonly repairWorkflow?:
      RepairWorkflowAdapter,
    private readonly reviewWorkflow?:
      ReviewWorkflowAdapter,
  ) {}

  async start(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<AdaptiveFactoryResult> {
    const result =
      await this.sequentialFactory.start(
        task,
        repositoryRoot,
      );

    if (
      result.stopReason ===
        "HUMAN_INPUT_REQUIRED" ||
      result.stopReason === "FAILED"
    ) {
      return {
        run: result.run,
        stopReason: result.stopReason,
      };
    }

    if (
      result.stopReason !==
      "PLAN_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Adaptive routing cannot start from sequential stop reason ${result.stopReason}.`,
      );
    }

    const route =
      routeTask(result.run.task);

    switch (route.route) {
      case "LIGHTWEIGHT":
        return {
          run: result.run,
          route,
          stopReason:
            "LIGHTWEIGHT_EXECUTION_REQUIRED",
        };

      case "SEQUENTIAL":
        return {
          run: result.run,
          route,
          stopReason:
            "PLAN_APPROVAL_REQUIRED",
        };

      case "PARALLEL":
        return {
          run: result.run,
          route,
          stopReason:
            "PLAN_APPROVAL_REQUIRED",
        };
    }
  }

  async resumeAfterPlanApproval(
    result: AdaptiveFactoryResult,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<AdaptiveFactoryResult> {
    if (!result.route) {
      throw new Error(
        "Cannot resume adaptive execution without a routing decision.",
      );
    }

    switch (result.route.route) {
      case "LIGHTWEIGHT":
        return this.resumeLightweightAfterPlanApproval(
          result,
          repositoryRoot,
          baseBranch,
        );

      case "SEQUENTIAL":
        return this.resumeSequentialAfterPlanApproval(
          result,
          repositoryRoot,
          baseBranch,
        );

      case "PARALLEL":
        return this.prepareParallelExecution(
          result,
        );
    }
  }

  async resumeAfterParallelApproval(
    result: AdaptiveFactoryResult,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PARALLEL_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume parallel execution from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "PARALLEL"
    ) {
      throw new Error(
        "Cannot resume parallel execution without a parallel route.",
      );
    }

    if (!result.workGraph) {
      throw new Error(
        "Cannot resume parallel execution without a work graph.",
      );
    }

    if (
      !this.parallelExecutionWorkflow
    ) {
      throw new Error(
        "Cannot resume parallel execution without a parallel execution workflow.",
      );
    }

    const parallelExecution =
      await this.parallelExecutionWorkflow.run({
        task: result.run.task,
        graph: result.workGraph,
        repositoryRoot,
        baseBranch,
      });

    const run: SequentialFactoryRun = {
      ...result.run,
      task: parallelExecution.task,
      worktree:
        parallelExecution.integrationWorktree,
    };

    switch (
      parallelExecution.task.status
    ) {
      case "VALIDATING":
        return {
          run,
          route: result.route,
          workGraph: result.workGraph,
          parallelExecution,
          stopReason:
            "PARALLEL_VALIDATION_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          run,
          route: result.route,
          workGraph: result.workGraph,
          parallelExecution,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      default:
        throw new Error(
          `Parallel execution stopped in unexpected state ${parallelExecution.task.status}.`,
        );
    }
  }

  async resumeAfterParallelValidation(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PARALLEL_VALIDATION_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume parallel validation from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "PARALLEL"
    ) {
      throw new Error(
        "Cannot resume parallel validation without a parallel route.",
      );
    }

    if (!result.parallelExecution) {
      throw new Error(
        "Cannot resume parallel validation without parallel execution evidence.",
      );
    }

    if (
      !this.parallelValidationWorkflow
    ) {
      throw new Error(
        "Cannot resume parallel validation without a parallel validation workflow.",
      );
    }

    const parallelValidation =
      await this.parallelValidationWorkflow.run(
        result.parallelExecution,
      );

    const run: SequentialFactoryRun = {
      ...result.run,
      task: parallelValidation.task,
      implementation:
        parallelValidation.implementation,
      validation:
        parallelValidation.validation,
      ...(parallelValidation.review?.review
        ? {
            review:
              parallelValidation.review.review,
          }
        : {}),
      ...(parallelValidation.review
        ? {
            changeEvidence:
              parallelValidation.review
                .changeEvidence,
          }
        : {}),
    };

    switch (
      parallelValidation.task.status
    ) {
      case "AWAITING_FINAL_APPROVAL":
        return {
          run,
          route: result.route,
          ...(result.workGraph
            ? {
                workGraph:
                  result.workGraph,
              }
            : {}),
          parallelExecution:
            result.parallelExecution,
          parallelValidation,
          stopReason:
            "FINAL_APPROVAL_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          run,
          route: result.route,
          ...(result.workGraph
            ? {
                workGraph:
                  result.workGraph,
              }
            : {}),
          parallelExecution:
            result.parallelExecution,
          parallelValidation,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      case "DIAGNOSING_FAILURE":
        return {
          run,
          route: result.route,
          ...(result.workGraph
            ? {
                workGraph:
                  result.workGraph,
              }
            : {}),
          parallelExecution:
            result.parallelExecution,
          parallelValidation,
          stopReason:
            "PARALLEL_DIAGNOSIS_REQUIRED",
        };

      default:
        throw new Error(
          `Parallel validation stopped in unexpected state ${parallelValidation.task.status}.`,
        );
    }
  }

  async resumeAfterParallelDiagnosis(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PARALLEL_DIAGNOSIS_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume parallel diagnosis from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "PARALLEL"
    ) {
      throw new Error(
        "Cannot resume parallel diagnosis without a parallel route.",
      );
    }

    if (
      !result.run.implementation ||
      !result.run.validation ||
      !result.run.worktree
    ) {
      throw new Error(
        "Cannot resume parallel diagnosis without implementation, validation, and worktree evidence.",
      );
    }

    if (!this.diagnosisWorkflow) {
      throw new Error(
        "Cannot resume parallel diagnosis without a diagnosis workflow.",
      );
    }

    const diagnosisResult =
      await this.diagnosisWorkflow.run({
        task: result.run.task,
        implementation:
          result.run.implementation,
        validation:
          result.run.validation,
        worktreePath:
          result.run.worktree.path,
      });

    const run: SequentialFactoryRun = {
      ...result.run,
      task: diagnosisResult.task,
      diagnosis:
        diagnosisResult.diagnosis,
    };

    switch (
      diagnosisResult.task.status
    ) {
      case "REPAIRING":
        return {
          ...result,
          run,
          diagnosis:
            diagnosisResult.diagnosis,
          stopReason:
            "PARALLEL_REPAIR_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          ...result,
          run,
          diagnosis:
            diagnosisResult.diagnosis,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      default:
        throw new Error(
          `Parallel diagnosis stopped in unexpected state ${diagnosisResult.task.status}.`,
        );
    }
  }

  async resumeAfterParallelRepair(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PARALLEL_REPAIR_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume parallel repair from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "PARALLEL"
    ) {
      throw new Error(
        "Cannot resume parallel repair without a parallel route.",
      );
    }

    if (
      !result.run.implementation ||
      !result.run.validation ||
      !result.run.worktree
    ) {
      throw new Error(
        "Cannot resume parallel repair without implementation, validation, and worktree evidence.",
      );
    }

    const diagnosis =
      result.diagnosis ??
      result.run.diagnosis;

    if (!diagnosis) {
      throw new Error(
        "Cannot resume parallel repair without a failure diagnosis.",
      );
    }

    if (!this.repairWorkflow) {
      throw new Error(
        "Cannot resume parallel repair without a repair workflow.",
      );
    }

    const repairResult =
      await this.repairWorkflow.run({
        task: result.run.task,
        implementation:
          result.run.implementation,
        validation:
          result.run.validation,
        diagnosis,
        worktreePath:
          result.run.worktree.path,
      });

    const repairs = [
      ...result.run.repairs,
      ...(repairResult.repair
        ? [repairResult.repair]
        : []),
    ];

    const run: SequentialFactoryRun = {
      ...result.run,
      task: repairResult.task,
      validation:
        repairResult.validation,
      repairs,
    };

    switch (
      repairResult.task.status
    ) {
      case "REVIEWING":
        return {
          ...result,
          run,
          diagnosis,
          stopReason:
            "PARALLEL_REVIEW_REQUIRED",
        };

      case "DIAGNOSING_FAILURE":
        return {
          ...result,
          run,
          diagnosis,
          stopReason:
            "PARALLEL_DIAGNOSIS_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          ...result,
          run,
          diagnosis,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      default:
        throw new Error(
          `Parallel repair stopped in unexpected state ${repairResult.task.status}.`,
        );
    }
  }

  async resumeAfterParallelReview(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PARALLEL_REVIEW_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume parallel review from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "PARALLEL"
    ) {
      throw new Error(
        "Cannot resume parallel review without a parallel route.",
      );
    }

    if (
      !result.parallelExecution
    ) {
      throw new Error(
        "Cannot resume parallel review without parallel execution evidence.",
      );
    }

    if (
      !result.run.implementation ||
      !result.run.validation ||
      !result.run.worktree
    ) {
      throw new Error(
        "Cannot resume parallel review without implementation, validation, and worktree evidence.",
      );
    }

    if (!this.reviewWorkflow) {
      throw new Error(
        "Cannot resume parallel review without a review workflow.",
      );
    }

    const reviewResult =
      await this.reviewWorkflow.run({
        task: result.run.task,
        implementation:
          result.run.implementation,
        validation:
          result.run.validation,
        worktreePath:
          result.run.worktree.path,
        baseRef:
          result.parallelExecution.baseCommit,
      });

    const run: SequentialFactoryRun = {
      ...result.run,
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

    switch (reviewResult.task.status) {
      case "AWAITING_FINAL_APPROVAL":
        return {
          ...result,
          run,
          stopReason:
            "FINAL_APPROVAL_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          ...result,
          run,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      default:
        throw new Error(
          `Parallel review stopped in unexpected state ${reviewResult.task.status}.`,
        );
    }
  }

  async resumeAfterFinalApproval(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "FINAL_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Cannot approve final result from stop reason ${result.stopReason}.`,
      );
    }

    if (!result.route) {
      throw new Error(
        "Cannot approve final result without a routing decision.",
      );
    }

    switch (result.route.route) {
      case "LIGHTWEIGHT":
        return this.approveFinalResult(
          result,
        );

      case "SEQUENTIAL": {
        const sequentialResult =
          await this.sequentialFactory.resumeAfterFinalApproval(
            result.run,
          );

        return {
          run: sequentialResult.run,
          route: result.route,
          stopReason:
            sequentialResult.stopReason,
        };
      }

      case "PARALLEL":
        return this.approveFinalResult(
          result,
        );
    }
  }

  async resumeLightweightAfterPlanApproval(
    result: AdaptiveFactoryResult,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "LIGHTWEIGHT_EXECUTION_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume lightweight execution from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.route?.route !==
      "LIGHTWEIGHT"
    ) {
      throw new Error(
        "Cannot resume lightweight execution without a lightweight route.",
      );
    }

    if (!this.lightweightWorkflow) {
      throw new Error(
        "Cannot resume lightweight execution without a lightweight workflow.",
      );
    }

    const lightweightResult =
      await this.lightweightWorkflow.run(
        result.run.task,
        repositoryRoot,
        baseBranch,
      );

    const run =
      this.mergeLightweightResult(
        result.run,
        lightweightResult,
      );

    switch (
      lightweightResult.task.status
    ) {
      case "AWAITING_FINAL_APPROVAL":
        return {
          run,
          route: result.route,
          stopReason:
            "FINAL_APPROVAL_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          run,
          route: result.route,
          stopReason:
            "HUMAN_INPUT_REQUIRED",
        };

      default:
        throw new Error(
          `Lightweight execution stopped in unexpected state ${lightweightResult.task.status}.`,
        );
    }
  }

  private async prepareParallelExecution(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PLAN_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Cannot prepare parallel execution from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.run.task.strategy?.mode !==
      "parallel"
    ) {
      throw new Error(
        "Parallel preparation requires a parallel execution strategy.",
      );
    }

    if (
      !this.parallelPlanningWorkflow
    ) {
      throw new Error(
        "Cannot prepare parallel execution without a parallel planning workflow.",
      );
    }

    const parallelResult =
      await this.parallelPlanningWorkflow.run(
        result.run.task,
      );

    return {
      run: {
        ...result.run,
        task: parallelResult.task,
      },
      route: result.route!,
      workGraph:
        parallelResult.workGraph,
      stopReason:
        "PARALLEL_APPROVAL_REQUIRED",
    };
  }

  private async resumeSequentialAfterPlanApproval(
    result: AdaptiveFactoryResult,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !==
      "PLAN_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Cannot resume sequential execution from stop reason ${result.stopReason}.`,
      );
    }

    const sequentialResult =
      await this.sequentialFactory.resumeAfterPlanApproval(
        result.run,
        repositoryRoot,
        baseBranch,
      );

    return {
      run: sequentialResult.run,
      ...(result.route
        ? {
            route: result.route,
          }
        : {}),
      stopReason:
        sequentialResult.stopReason,
    };
  }

  private approveFinalResult(
    result: AdaptiveFactoryResult,
  ): AdaptiveFactoryResult {
    const orchestrator =
      new Orchestrator(
        result.run.task,
      );

    orchestrator.approveFinal();

    return {
      ...result,
      run: {
        ...result.run,
        task: orchestrator.getTask(),
      },
      stopReason: "COMPLETE",
    };
  }

  private mergeLightweightResult(
    run: SequentialFactoryRun,
    result: LightweightWorkflowResult,
  ): SequentialFactoryRun {
    return {
      ...run,
      task: result.task,
      worktree: result.worktree,
      implementation:
        result.implementation,
      ...(result.validation
        ? {
            validation:
              result.validation,
          }
        : {}),
    };
  }
}