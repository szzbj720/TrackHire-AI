import type { EngineeringTask } from "../schemas/task.js";
import type {
  SequentialFactoryResult,
  SequentialFactoryRun,
} from "./sequential-factory.js";
import type {
  LightweightWorkflow,
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
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
}

export type AdaptiveFactoryStopReason =
  | "PLAN_APPROVAL_REQUIRED"
  | "LIGHTWEIGHT_EXECUTION_REQUIRED"
  | "FINAL_APPROVAL_REQUIRED"
  | "HUMAN_INPUT_REQUIRED"
  | "COMPLETE"
  | "FAILED";

export interface AdaptiveFactoryResult {
  run: SequentialFactoryRun;
  route?: AdaptiveRoutingDecision;
  stopReason: AdaptiveFactoryStopReason;
}

export class AdaptiveFactory {
  constructor(
    private readonly sequentialFactory: SequentialFactoryAdapter,
    private readonly lightweightWorkflow?: LightweightWorkflow,
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
          stopReason: "LIGHTWEIGHT_EXECUTION_REQUIRED",
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
        throw new Error(
          "Cannot resume a task that requires human escalation.",
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