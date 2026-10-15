import type { EngineeringTask } from "../schemas/task.js";
import type {
  SequentialFactoryResult,
  SequentialFactoryRun,
} from "./sequential-factory.js";
import {
  routeTask,
  type AdaptiveRoutingDecision,
} from "./adaptive-routing.js";

export interface SequentialFactoryStarter {
  start(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<SequentialFactoryResult>;
}

export type AdaptiveFactoryStopReason =
  | "PLAN_APPROVAL_REQUIRED"
  | "LIGHTWEIGHT_EXECUTION_REQUIRED"
  | "HUMAN_INPUT_REQUIRED"
  | "FAILED";

export interface AdaptiveFactoryResult {
  run: SequentialFactoryRun;
  route?: AdaptiveRoutingDecision;
  stopReason: AdaptiveFactoryStopReason;
}

export class AdaptiveFactory {
  constructor(
    private readonly sequentialFactory: SequentialFactoryStarter,
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
}