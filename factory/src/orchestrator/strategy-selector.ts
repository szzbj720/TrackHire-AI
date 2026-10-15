import type {
    ExecutionStrategy,
    TaskAnalysis,
  } from "../schemas/task.js";
  
  export const STRATEGY_CONFIDENCE_THRESHOLD = 0.7;
  
  export function selectExecutionStrategy(
    analysis: TaskAnalysis,
  ): ExecutionStrategy | null {
    if (
      analysis.requiresHumanInput ||
      analysis.confidence < STRATEGY_CONFIDENCE_THRESHOLD
    ) {
      return null;
    }
  
    if (analysis.complexity === "high" || analysis.risk === "high") {
      return {
        mode: "parallel",
        reasoning:
          "The task has high complexity or risk and warrants a decomposed execution strategy.",
      };
    }
  
    if (analysis.complexity === "medium" || analysis.risk === "medium") {
      return {
        mode: "sequential",
        reasoning:
          "The task has medium complexity or risk and warrants planning, implementation, validation, and independent review.",
      };
    }
  
    return {
      mode: "single-agent",
      reasoning:
        "The task has low complexity and low risk, so a lightweight single-agent execution strategy is sufficient.",
    };
  }