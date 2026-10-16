import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    Builder,
    BuilderInput,
  } from "../agents/builder.js";
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import {
    ExplorationWorkflow,
  } from "./exploration-workflow.js";
  
  vi.mock(
    "../tools/git-worktree.js",
    () => ({
      createTaskWorktree:
        vi.fn(
          async ({
            taskId,
          }: {
            taskId: string;
          }) => ({
            path: `/tmp/${taskId}`,
            branch:
              `factory/${taskId.toLowerCase()}`,
          }),
        ),
    }),
  );
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  class CandidateProvider
    implements ModelProvider
  {
    constructor(
      private readonly candidateId:
        string,
      private readonly model: string,
      private readonly confidence:
        number,
    ) {}
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return {
        model: this.model,
        content: JSON.stringify({
          candidateId:
            this.candidateId,
  
          summary:
            `Implement ${this.candidateId}.`,
  
          approach:
            `Approach for ${this.candidateId}.`,
  
          affectedFiles: [
            "lib/models/job_application.dart",
          ],
  
          implementationSteps: [
            `Implement ${this.candidateId}.`,
          ],
  
          validationSteps: [
            "Run flutter test.",
          ],
  
          advantages: [],
  
          risks: [],
  
          assumptions: [],
  
          requiresHumanInput: false,
  
          confidence:
            this.confidence,
        }),
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          estimatedCostUsd: 0.01,
        },
      };
    }
  }
  
  class RecordingBuilder
    implements Builder
  {
    inputs: BuilderInput[] = [];
  
    constructor(
      private readonly summary:
        string,
    ) {}
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.inputs.push(input);
  
      return {
        summary: this.summary,
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
            changeType: "modified",
            summary:
              "Updated application model.",
          },
        ],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      };
    }
  }
  
  class PathAwareValidator
    implements Validator
  {
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      const passes =
        worktreePath.includes(
          "candidate-b",
        );
  
      return {
        passed: passes,
        checks: [
          {
            name: "flutter test",
            command: "flutter",
            args: ["test"],
            exitCode:
              passes ? 0 : 1,
            stdout:
              passes
                ? "All tests passed."
                : "",
            stderr:
              passes
                ? ""
                : "Tests failed.",
            durationMs: 100,
            passed: passes,
          },
        ],
        failedChecks:
          passes
            ? []
            : ["flutter test"],
        durationMs: 100,
      };
    }
  }
  
  class AlwaysPassingValidator
    implements Validator
  {
    async validate(
      _worktreePath: string,
    ): Promise<ValidationResult> {
      return {
        passed: true,
        checks: [
          {
            name: "flutter test",
            command: "flutter",
            args: ["test"],
            exitCode: 0,
            stdout:
              "All tests passed.",
            stderr: "",
            durationMs: 100,
            passed: true,
          },
        ],
        failedChecks: [],
        durationMs: 100,
      };
    }
  }
  
  function createTask():
    EngineeringTask {
    return {
      id: "TH-001",
      request:
        "Add optional interview date support.",
      status: "IMPLEMENTING",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications still load.",
      ],
      constraints: [],
      repairAttempts: 0,
      createdAt:
        "2026-10-16T00:00:00.000Z",
      updatedAt:
        "2026-10-16T00:00:00.000Z",
    };
  }
  
  function createAnalysis(
    overrides:
      Partial<TaskAnalysis> = {},
  ): TaskAnalysis {
    return {
      complexity: "high",
      risk: "medium",
      affectedAreas: [
        "application model",
      ],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: [],
      assumptions: [],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning:
        "Cross-cutting application change.",
      ...overrides,
    };
  }
  
  const request: ModelRequest = {
    systemPrompt:
      "Propose an independent solution.",
    userPrompt:
      "Add interview date support.",
  };
  
  describe(
    "ExplorationWorkflow",
    () => {
      it("does not explore when policy says exploration is unnecessary", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis({
                complexity: "low",
                risk: "low",
              }),
            request,
            generationTargets: [],
            builderTargets: [],
            validator:
              new PathAwareValidator(),
            repositoryRoot:
              "/repo",
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
            baseBranch: "main",
          });
  
        expect(result).toEqual({
          explored: false,
          reasoning:
            "Low-complexity work does not justify the additional exploration cost.",
          candidates: [],
          requiresHumanInput: false,
        });
      });
  
      it("requires human input when fewer than two candidates are generated", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis(),
            request,
            generationTargets: [
              {
                id: "explorer-a",
                provider:
                  new CandidateProvider(
                    "candidate-a",
                    "model-a",
                    0.9,
                  ),
              },
            ],
            builderTargets: [],
            validator:
              new PathAwareValidator(),
            repositoryRoot:
              "/repo",
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
            baseBranch: "main",
          });
  
        expect(
          result.explored,
        ).toBe(true);
  
        expect(
          result.requiresHumanInput,
        ).toBe(true);
  
        expect(
          result.candidates,
        ).toHaveLength(1);
  
        expect(
          result.evidence,
        ).toBeUndefined();
      });
  
      it("selects the implementation that passes deterministic validation", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis(),
            request,
  
            generationTargets: [
              {
                id: "explorer-a",
                provider:
                  new CandidateProvider(
                    "candidate-a",
                    "model-a",
                    0.99,
                  ),
              },
              {
                id: "explorer-b",
                provider:
                  new CandidateProvider(
                    "candidate-b",
                    "model-b",
                    0.5,
                  ),
              },
            ],
  
            builderTargets: [
              {
                targetId:
                  "explorer-a",
                builder:
                  new RecordingBuilder(
                    "Implementation A",
                  ),
              },
              {
                targetId:
                  "explorer-b",
                builder:
                  new RecordingBuilder(
                    "Implementation B",
                  ),
              },
            ],
  
            validator:
              new PathAwareValidator(),
  
            repositoryRoot:
              "/repo",
  
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
  
            baseBranch: "main",
          });
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.requiresHumanInput,
        ).toBe(false);
  
        expect(
          result.metrics,
        ).toMatchObject({
          candidateCount: 2,
          implementationSuccesses: 2,
          validationPasses: 1,
          validationFailures: 1,
          selectedCandidateId:
            "candidate-b",
          requiredHumanSelection:
            false,
        });
      });
  
      it("does not let higher model confidence override failing code", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis(),
            request,
  
            generationTargets: [
              {
                id: "explorer-a",
                provider:
                  new CandidateProvider(
                    "candidate-a",
                    "model-a",
                    1,
                  ),
              },
              {
                id: "explorer-b",
                provider:
                  new CandidateProvider(
                    "candidate-b",
                    "model-b",
                    0.1,
                  ),
              },
            ],
  
            builderTargets: [
              {
                targetId:
                  "explorer-a",
                builder:
                  new RecordingBuilder(
                    "A",
                  ),
              },
              {
                targetId:
                  "explorer-b",
                builder:
                  new RecordingBuilder(
                    "B",
                  ),
              },
            ],
  
            validator:
              new PathAwareValidator(),
  
            repositoryRoot:
              "/repo",
  
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
  
            baseBranch: "main",
          });
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.requiresHumanInput,
        ).toBe(false);
      });
  
      it("emits complete exploration evidence for an automatic winner", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis(),
            request,
  
            generationTargets: [
              {
                id: "explorer-a",
                provider:
                  new CandidateProvider(
                    "candidate-a",
                    "model-a",
                    0.99,
                  ),
              },
              {
                id: "explorer-b",
                provider:
                  new CandidateProvider(
                    "candidate-b",
                    "model-b",
                    0.5,
                  ),
              },
            ],
  
            builderTargets: [
              {
                targetId:
                  "explorer-a",
                builder:
                  new RecordingBuilder(
                    "Implementation A",
                  ),
              },
              {
                targetId:
                  "explorer-b",
                builder:
                  new RecordingBuilder(
                    "Implementation B",
                  ),
              },
            ],
  
            validator:
              new PathAwareValidator(),
  
            repositoryRoot:
              "/repo",
  
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
  
            baseBranch: "main",
          });
  
        expect(
          result.evidence,
        ).toBeDefined();
  
        expect(
          result.evidence?.candidates,
        ).toHaveLength(2);
  
        expect(
          result.evidence
            ?.implementations,
        ).toHaveLength(2);
  
        expect(
          result.evidence
            ?.validations,
        ).toHaveLength(2);
  
        expect(
          result.evidence
            ?.selection
            .selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.evidence
            ?.metrics
            .selectedCandidateId,
        ).toBe("candidate-b");
      });
  
      it("emits evidence when competing implementations require human selection", async () => {
        const workflow =
          new ExplorationWorkflow();
  
        const result =
          await workflow.run({
            task: createTask(),
            analysis:
              createAnalysis(),
            request,
  
            generationTargets: [
              {
                id: "explorer-a",
                provider:
                  new CandidateProvider(
                    "candidate-a",
                    "model-a",
                    0.8,
                  ),
              },
              {
                id: "explorer-b",
                provider:
                  new CandidateProvider(
                    "candidate-b",
                    "model-b",
                    0.8,
                  ),
              },
            ],
  
            builderTargets: [
              {
                targetId:
                  "explorer-a",
                builder:
                  new RecordingBuilder(
                    "Implementation A",
                  ),
              },
              {
                targetId:
                  "explorer-b",
                builder:
                  new RecordingBuilder(
                    "Implementation B",
                  ),
              },
            ],
  
            validator:
              new AlwaysPassingValidator(),
  
            repositoryRoot:
              "/repo",
  
            repositoryFiles: [
              "lib/models/job_application.dart",
            ],
  
            baseBranch: "main",
          });
  
        expect(
          result.requiresHumanInput,
        ).toBe(true);
  
        expect(
          result.selectedCandidateId,
        ).toBeUndefined();
  
        expect(
          result.evidence,
        ).toBeDefined();
  
        expect(
          result.evidence
            ?.selection
            .requiresHumanSelection,
        ).toBe(true);
  
        expect(
          result.evidence
            ?.selection
            .tiedCandidateIds,
        ).toEqual([
          "candidate-a",
          "candidate-b",
        ]);
  
        expect(
          result.evidence
            ?.metrics
            .requiredHumanSelection,
        ).toBe(true);
      });
    },
  );