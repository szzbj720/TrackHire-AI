import { describe, expect, it } from "vitest";
import type { TaskAnalysis } from "../schemas/task.js";
import {
  selectExecutionStrategy,
  STRATEGY_CONFIDENCE_THRESHOLD,
} from "./strategy-selector.js";

function createAnalysis(
  overrides: Partial<TaskAnalysis> = {},
): TaskAnalysis {
  return {
    complexity: "low",
    risk: "low",
    affectedAreas: ["documentation"],
    relevantFiles: ["README.md"],
    ambiguities: [],
    assumptions: [],
    confidence: 0.9,
    requiresHumanInput: false,
    reasoning: "The task is small and well understood.",
    ...overrides,
  };
}

describe("selectExecutionStrategy", () => {
  it("selects single-agent for a low-complexity, low-risk task", () => {
    const strategy = selectExecutionStrategy(createAnalysis());

    expect(strategy).toEqual({
      mode: "single-agent",
      reasoning:
        "The task has low complexity and low risk, so a lightweight single-agent execution strategy is sufficient.",
    });
  });

  it("selects sequential when complexity is medium", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({ complexity: "medium" }),
    );

    expect(strategy?.mode).toBe("sequential");
  });

  it("selects sequential when risk is medium", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({ risk: "medium" }),
    );

    expect(strategy?.mode).toBe("sequential");
  });

  it("selects parallel when complexity is high", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({ complexity: "high" }),
    );

    expect(strategy?.mode).toBe("parallel");
  });

  it("selects parallel when risk is high", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({ risk: "high" }),
    );

    expect(strategy?.mode).toBe("parallel");
  });

  it("gives high risk precedence over medium complexity", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({
        complexity: "medium",
        risk: "high",
      }),
    );

    expect(strategy?.mode).toBe("parallel");
  });

  it("does not select a strategy when human input is required", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({ requiresHumanInput: true }),
    );

    expect(strategy).toBeNull();
  });

  it("does not select a strategy below the confidence threshold", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({
        confidence: STRATEGY_CONFIDENCE_THRESHOLD - 0.01,
      }),
    );

    expect(strategy).toBeNull();
  });

  it("allows strategy selection at the confidence threshold", () => {
    const strategy = selectExecutionStrategy(
      createAnalysis({
        confidence: STRATEGY_CONFIDENCE_THRESHOLD,
      }),
    );

    expect(strategy?.mode).toBe("single-agent");
  });
});