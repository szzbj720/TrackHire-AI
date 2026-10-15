import type {
    ExecutionMode,
    ExecutionStrategy,
  } from "../schemas/task.js";
  
  export type ExecutionDisposition =
    | "SUPPORTED_LIGHTWEIGHT"
    | "SUPPORTED_SEQUENTIAL"
    | "UNSUPPORTED_REQUIRES_HUMAN";
  
  export interface ExecutionPolicyDecision {
    mode: ExecutionMode;
    disposition: ExecutionDisposition;
    reasoning: string;
  }
  
  export function evaluateExecutionPolicy(
    strategy: ExecutionStrategy,
  ): ExecutionPolicyDecision {
    switch (strategy.mode) {
      case "single-agent":
        return {
          mode: strategy.mode,
          disposition: "SUPPORTED_LIGHTWEIGHT",
          reasoning:
            "The selected single-agent strategy is supported by the lightweight execution path.",
        };
  
      case "sequential":
        return {
          mode: strategy.mode,
          disposition: "SUPPORTED_SEQUENTIAL",
          reasoning:
            "The selected sequential strategy is supported by the reviewed sequential factory.",
        };
  
      case "parallel":
        return {
          mode: strategy.mode,
          disposition: "UNSUPPORTED_REQUIRES_HUMAN",
          reasoning:
            "The selected parallel strategy is not implemented yet and requires human escalation.",
        };
    }
  }