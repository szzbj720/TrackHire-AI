import { describe, expect, it } from "vitest";

import type { ModelProvider } from "../models/provider.js";
import type { EngineeringTask } from "../schemas/task.js";
import { ModelTaskAnalyzer } from "./analyzer.js";

const fakeProvider: ModelProvider = {
  async generate() {
    return {
      model: "fake-model",
      content: JSON.stringify({
        complexity: "medium",
        risk: "medium",
        affectedAreas: ["frontend", "backend"],
        relevantFiles: [],
        ambiguities: [],
        assumptions: [],
        confidence: 0.9,
        requiresHumanInput: false,
        reasoning: "The task affects multiple application layers.",
      }),
    };
  },
};

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-001",
    request: "Add optional interview date tracking.",
    status: "TASK_CREATED",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("ModelTaskAnalyzer", () => {
  it("returns structured task analysis from a model provider", async () => {
    const analyzer = new ModelTaskAnalyzer(fakeProvider);

    const analysis = await analyzer.analyze(createTask());

    expect(analysis.complexity).toBe("medium");
    expect(analysis.risk).toBe("medium");
    expect(analysis.confidence).toBe(0.9);
    expect(analysis.requiresHumanInput).toBe(false);
  });

  it("rejects invalid analysis returned by the model", async () => {
    const invalidProvider: ModelProvider = {
      async generate() {
        return {
          model: "fake-model",
          content: JSON.stringify({
            complexity: "super-hard",
            confidence: 42,
          }),
        };
      },
    };

    const analyzer = new ModelTaskAnalyzer(invalidProvider);

    await expect(analyzer.analyze(createTask())).rejects.toThrow();
  });
});