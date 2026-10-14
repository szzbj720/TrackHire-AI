import { describe, expect, it } from "vitest";

import type { RepositoryContext } from "../context/context-builder.js";
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
        relevantFiles: ["lib/models/application.dart"],
        ambiguities: [],
        assumptions: [],
        confidence: 0.9,
        requiresHumanInput: false,
        reasoning:
          "The task affects application data and user-facing behavior.",
      }),
    };
  },
};

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-001",
    request:
      "Add an optional interview date to an application.",
    status: "TASK_CREATED",
    requirements: [
      "Store an interview date for an application.",
    ],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createContext(): RepositoryContext {
  return {
    snapshot: {
      root: "/test/repository",
      files: [
        {
          path: "lib/models/application.dart",
        },
      ],
    },

    summary: {
      totalFiles: 1,
      topLevelAreas: ["lib"],
      fileExtensions: {
        ".dart": 1,
      },
      importantFiles: [],
    },

    relevantFiles: [
      {
        path: "lib/models/application.dart",
        score: 1,
        matchedTerms: ["application"],
      },
    ],

    fileContents: [
      {
        path: "lib/models/application.dart",
        content: "class Application {}",
        truncated: false,
      },
    ],
  };
}

describe("ModelTaskAnalyzer", () => {
  it("returns structured task analysis using repository context", async () => {
    const analyzer = new ModelTaskAnalyzer(fakeProvider);

    const analysis = await analyzer.analyze(
      createTask(),
      createContext(),
    );

    expect(analysis.complexity).toBe("medium");
    expect(analysis.risk).toBe("medium");
    expect(analysis.confidence).toBe(0.9);
    expect(analysis.requiresHumanInput).toBe(false);

    expect(analysis.relevantFiles).toContain(
      "lib/models/application.dart",
    );
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

    await expect(
      analyzer.analyze(
        createTask(),
        createContext(),
      ),
    ).rejects.toThrow();
  });

  it("includes repository context in the model request", async () => {
    let capturedUserPrompt = "";

    const capturingProvider: ModelProvider = {
      async generate(request) {
        capturedUserPrompt = request.userPrompt;

        return {
          model: "fake-model",
          content: JSON.stringify({
            complexity: "low",
            risk: "low",
            affectedAreas: ["frontend"],
            relevantFiles: [
              "lib/models/application.dart",
            ],
            ambiguities: [],
            assumptions: [],
            confidence: 0.95,
            requiresHumanInput: false,
            reasoning:
              "Repository context was provided.",
          }),
        };
      },
    };

    const analyzer = new ModelTaskAnalyzer(
      capturingProvider,
    );

    await analyzer.analyze(
      createTask(),
      createContext(),
    );

    expect(capturedUserPrompt).toContain(
      "lib/models/application.dart",
    );

    expect(capturedUserPrompt).toContain(
      "class Application {}",
    );

    expect(capturedUserPrompt).toContain(
      "Store an interview date for an application.",
    );
  });
});