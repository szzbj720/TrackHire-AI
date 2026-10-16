import type {
    TaskAnalysis,
  } from "../schemas/task.js";
  
  export interface ExplorationPolicyDecision {
    explore: boolean;
    reasoning: string;
  }
  
  export class ExplorationPolicy {
    decide(
      analysis: TaskAnalysis,
    ): ExplorationPolicyDecision {
      if (analysis.requiresHumanInput) {
        return {
          explore: false,
          reasoning:
            "Exploration is disabled while the task requires human clarification.",
        };
      }
  
      if (analysis.complexity === "low") {
        return {
          explore: false,
          reasoning:
            "Low-complexity work does not justify the additional exploration cost.",
        };
      }
  
      if (
        analysis.complexity === "high" ||
        analysis.risk === "high"
      ) {
        return {
          explore: true,
          reasoning:
            "High-complexity or high-risk work benefits from independent solution exploration.",
        };
      }
  
      if (
        analysis.complexity === "medium" &&
        analysis.confidence < 0.8
      ) {
        return {
          explore: true,
          reasoning:
            "Medium-complexity work with lower analysis confidence benefits from independent solution exploration.",
        };
      }
  
      return {
        explore: false,
        reasoning:
          "The expected benefit of competing solutions does not justify the additional cost.",
      };
    }
  }