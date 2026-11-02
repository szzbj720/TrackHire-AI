import type { EngineeringTask } from "../schemas/task.js";
import {
  evaluateAutonomyPolicy,
  type AutonomyPolicyDecision,
} from "./autonomy-policy.js";
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
  autonomy?: AutonomyPolicyDecision;
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
  const autonomy = task.analysis
    ? evaluateAutonomyPolicy(task)
    : undefined;

  const withAutonomy = (
    decision: Omit<
      AdaptiveRoutingDecision,
      "autonomy"
    >,
  ): AdaptiveRoutingDecision => ({
    ...decision,
    ...(autonomy ? { autonomy } : {}),
  });

  switch (policy.disposition) {
    case "SUPPORTED_LIGHTWEIGHT":
      return withAutonomy({
        route: "LIGHTWEIGHT",
        policy,
      });

    case "SUPPORTED_SEQUENTIAL":
      return withAutonomy({
        route: "SEQUENTIAL",
        policy,
      });

    case "SUPPORTED_PARALLEL":
      return withAutonomy({
        route: "PARALLEL",
        policy,
      });
  }
}