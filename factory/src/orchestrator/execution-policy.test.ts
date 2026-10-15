import { describe, expect, it } from "vitest";
import type { ExecutionStrategy } from "../schemas/task.js";
import { evaluateExecutionPolicy } from "./execution-policy.js";

function createStrategy(
  mode: ExecutionStrategy["mode"],
): ExecutionStrategy {
  return {
    mode,
    reasoning: `Selected ${mode} for the task.`,
  };
}

describe("evaluateExecutionPolicy", () => {
  it("supports single-agent through the lightweight path", () => {
    expect(
      evaluateExecutionPolicy(
        createStrategy("single-agent"),
      ),
    ).toEqual({
      mode: "single-agent",
      disposition: "SUPPORTED_LIGHTWEIGHT",
      reasoning:
        "The selected single-agent strategy is supported by the lightweight execution path.",
    });
  });

  it("supports sequential through the reviewed sequential factory", () => {
    expect(
      evaluateExecutionPolicy(
        createStrategy("sequential"),
      ),
    ).toEqual({
      mode: "sequential",
      disposition: "SUPPORTED_SEQUENTIAL",
      reasoning:
        "The selected sequential strategy is supported by the reviewed sequential factory.",
    });
  });

  it("supports parallel through controlled decomposition and approval", () => {
    expect(
      evaluateExecutionPolicy(
        createStrategy("parallel"),
      ),
    ).toEqual({
      mode: "parallel",
      disposition: "SUPPORTED_PARALLEL",
      reasoning:
        "The selected parallel strategy is supported through controlled decomposition and human approval before parallel execution.",
    });
  });
});