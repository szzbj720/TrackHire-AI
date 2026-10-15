import type { EngineeringTask } from "../schemas/task.js";
import {
  evaluateExecutionPolicy,
  type ExecutionPolicyDecision,
} from "./execution-policy.js";

export type AdaptiveRoute =
  | "LIGHTWEIGHT"
  | "SEQUENTIAL"
  | "PARALLEL";

export interface AdaptiveRoutingDecision {
  route: AdaptiveRoute;
  policy: ExecutionPolicyDecision;
}

export function routeTask(
  task: EngineeringTask,
): AdaptiveRoutingDecision {
  if (!task.strategy) {
    throw new Error(
      "Cannot route task without an execution strategy.",
    );
  }

  const policy = evaluateExecutionPolicy(
    task.strategy,
  );

  switch (policy.disposition) {
    case "SUPPORTED_LIGHTWEIGHT":
      return {
        route: "LIGHTWEIGHT",
        policy,
      };

    case "SUPPORTED_SEQUENTIAL":
      return {
        route: "SEQUENTIAL",
        policy,
      };

    case "SUPPORTED_PARALLEL":
      return {
        route: "PARALLEL",
        policy,
      };
  }
}