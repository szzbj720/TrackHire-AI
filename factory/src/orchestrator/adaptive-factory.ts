import type { EngineeringTask } from "../schemas/task.js";
import type { WorkGraph } from "../schemas/work-graph.js";
import { Orchestrator } from "./orchestrator.js";
import type {
  SequentialFactoryResult,
  SequentialFactoryRun,
} from "./sequential-factory.js";
import type {
  LightweightWorkflow,
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
import type {
  ParallelPlanningWorkflow,
} from "./parallel-planning-workflow.js";
import {
  routeTask,
  type AdaptiveRoutingDecision,
} from "./adaptive-routing.js";

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

export type AdaptiveFactoryStopReason =
  | "PLAN_APPROVAL_REQUIRED"
  | "LIGHTWEIGHT_EXECUTION_REQUIRED"
  | "PARALLEL_APPROVAL_REQUIRED"
  | "FINAL_APPROVAL_REQUIRED"
  | "HUMAN_INPUT_REQUIRED"
  | "COMPLETE"
  | "FAILED";

export interface AdaptiveFactoryResult {
  run: SequentialFactoryRun;
  route?: AdaptiveRoutingDecision;
  workGraph?: WorkGraph;
  stopReason: AdaptiveFactoryStopReason;
}

export class AdaptiveFactory {
  constructor(
    private readonly sequentialFactory: SequentialFactoryAdapter,
    private readonly lightweightWorkflow?: LightweightWorkflow,
    private readonly parallelPlanningWorkflow?: ParallelPlanningWorkflow,
  ) {}

  async start(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<AdaptiveFactoryResult> {
    const result = await this.sequentialFactory.start(
      task,
      repositoryRoot,
    );

    if (
      result.stopReason === "HUMAN_INPUT_REQUIRED" ||
      result.stopReason === "FAILED"
    ) {
      return {
        run: result.run,
        stopReason: result.stopReason,
      };
    }

    if (
      result.stopReason !== "PLAN_APPROVAL_REQUIRED"
    ) {
      throw new Error(
        `Adaptive routing cannot start from sequential stop reason ${result.stopReason}.`,
      );
    }

    const route = routeTask(result.run.task);

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
          stopReason: "PLAN_APPROVAL_REQUIRED",
        };

      case "HUMAN_ESCALATION":
        return {
          run: result.run,
          route,
          stopReason: "HUMAN_INPUT_REQUIRED",
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

      case "HUMAN_ESCALATION":
        return this.prepareParallelExecution(
          result,
        );
    }
  }

  async resumeAfterFinalApproval(
    result: AdaptiveFactoryResult,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !== "FINAL_APPROVAL_REQUIRED"
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
        return this.approveLightweightFinalResult(
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
          stopReason: sequentialResult.stopReason,
        };
      }

      case "HUMAN_ESCALATION":
        throw new Error(
          "Cannot approve final result for a parallel route before parallel execution is implemented.",
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
      result.route?.route !== "LIGHTWEIGHT"
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

    const run = this.mergeLightweightResult(
      result.run,
      lightweightResult,
    );

    switch (lightweightResult.task.status) {
      case "AWAITING_FINAL_APPROVAL":
        return {
          run,
          route: result.route,
          stopReason: "FINAL_APPROVAL_REQUIRED",
        };

      case "NEEDS_HUMAN":
        return {
          run,
          route: result.route,
          stopReason: "HUMAN_INPUT_REQUIRED",
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
      result.stopReason !== "HUMAN_INPUT_REQUIRED"
    ) {
      throw new Error(
        `Cannot prepare parallel execution from stop reason ${result.stopReason}.`,
      );
    }

    if (
      result.run.task.strategy?.mode !== "parallel"
    ) {
      throw new Error(
        "Parallel preparation requires a parallel execution strategy.",
      );
    }

    if (!this.parallelPlanningWorkflow) {
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
      workGraph: parallelResult.workGraph,
      stopReason: "PARALLEL_APPROVAL_REQUIRED",
    };
  }

  private async resumeSequentialAfterPlanApproval(
    result: AdaptiveFactoryResult,
    repositoryRoot: string,
    baseBranch: string,
  ): Promise<AdaptiveFactoryResult> {
    if (
      result.stopReason !== "PLAN_APPROVAL_REQUIRED"
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
        ? { route: result.route }
        : {}),
      stopReason: sequentialResult.stopReason,
    };
  }

  private approveLightweightFinalResult(
    result: AdaptiveFactoryResult,
  ): AdaptiveFactoryResult {
    const orchestrator = new Orchestrator(
      result.run.task,
    );

    orchestrator.approveFinal();

    return {
      run: {
        ...result.run,
        task: orchestrator.getTask(),
      },
      route: result.route!,
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
      implementation: result.implementation,
      ...(result.validation
        ? { validation: result.validation }
        : {}),
    };
  }
}