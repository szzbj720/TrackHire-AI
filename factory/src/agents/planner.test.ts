import { describe, expect, it } from "vitest";

import type { RepositoryContext } from "../context/context-builder.js";
import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from "../models/provider.js";
import type { EngineeringTask, TaskAnalysis } from "../schemas/task.js";
import { ModelPlanner } from "./planner.js";

const now = new Date().toISOString();

const task: EngineeringTask = {
  id: "TH-001",
  request:
    "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  status: "PLANNING",
  requirements: [
    "Allow an interview date to be stored for an application.",
    "Display applications with upcoming interviews.",
  ],
  acceptanceCriteria: [
    "Applications can exist without an interview date.",
    "Applications with future interview dates can be displayed as upcoming.",
  ],
  constraints: [
    "Existing applications without interview dates must continue to work.",
  ],
  repairAttempts: 0,
  createdAt: now,
  updatedAt: now,
};

const analysis: TaskAnalysis = {
  complexity: "medium",
  risk: "medium",
  affectedAreas: ["application model", "application UI"],
  relevantFiles: [
    "lib/models/job_application.dart",
    "lib/providers/application_provider.dart",
  ],
  ambiguities: [],
  assumptions: ["Interview date is optional."],
  confidence: 0.9,
  requiresHumanInput: false,
  reasoning:
    "The task changes application data and presentation behavior.",
};

const context: RepositoryContext = {
  snapshot: {
    root: "/repo",
    files: [
      {
        path: "lib/models/job_application.dart",
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
      path: "lib/models/job_application.dart",
      score: 1,
      matchedTerms: ["application"],
    },
  ],
  fileContents: [
    {
      path: "lib/models/job_application.dart",
      content: "class JobApplication {}",
      truncated: false,
    },
  ],
};

class FakeProvider implements ModelProvider {
  constructor(private readonly content: string) {}

  async generate(
    _request: ModelRequest,
  ): Promise<ModelResponse> {
    return {
      content: this.content,
      model: "fake-model",
    };
  }
}

class CapturingProvider implements ModelProvider {
  request?: ModelRequest;

  async generate(
    request: ModelRequest,
  ): Promise<ModelResponse> {
    this.request = request;

    return {
      content: JSON.stringify({
        summary: "Add optional interview date support.",
        steps: [
          {
            order: 1,
            description:
              "Update the application model.",
            files: [
              "lib/models/job_application.dart",
            ],
            rationale:
              "The model must represent the interview date.",
          },
        ],
        affectedFiles: [
          "lib/models/job_application.dart",
        ],
        validationSteps: [
          "Run Flutter tests.",
        ],
        risks: [
          "Existing applications have no interview date.",
        ],
        assumptions: [
          "Interview date is optional.",
        ],
        requiresHumanInput: false,
      }),
      model: "fake-model",
    };
  }
}

describe("ModelPlanner", () => {
  it("returns a validated implementation plan", async () => {
    const provider = new FakeProvider(
      JSON.stringify({
        summary: "Add optional interview date support.",
        steps: [
          {
            order: 1,
            description:
              "Update the application model.",
            files: [
              "lib/models/job_application.dart",
            ],
            rationale:
              "The model must represent the interview date.",
          },
        ],
        affectedFiles: [
          "lib/models/job_application.dart",
        ],
        validationSteps: [
          "Run Flutter tests.",
        ],
        risks: [],
        assumptions: [],
        requiresHumanInput: false,
      }),
    );

    const planner = new ModelPlanner(provider);

    const result = await planner.plan(
      task,
      analysis,
      context,
    );

    expect(result.summary).toBe(
      "Add optional interview date support.",
    );
    expect(result.steps).toHaveLength(1);
    expect(result.requiresHumanInput).toBe(false);
  });

  it("rejects invalid model output", async () => {
    const provider = new FakeProvider(
      JSON.stringify({
        summary: "Invalid plan",
        steps: [],
        affectedFiles: [],
        validationSteps: [],
        risks: [],
        assumptions: [],
        requiresHumanInput: false,
      }),
    );

    const planner = new ModelPlanner(provider);

    await expect(
      planner.plan(task, analysis, context),
    ).rejects.toThrow();
  });

  it("sends task analysis and repository context to the model", async () => {
    const provider = new CapturingProvider();
    const planner = new ModelPlanner(provider);

    await planner.plan(task, analysis, context);

    expect(provider.request).toBeDefined();

    const prompt = provider.request?.userPrompt ?? "";

    expect(prompt).toContain(
      "Add an optional interview date",
    );
    expect(prompt).toContain(
      "The task changes application data",
    );
    expect(prompt).toContain(
      "lib/models/job_application.dart",
    );
    expect(prompt).toContain(
      "class JobApplication {}",
    );
  });
});