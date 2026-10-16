import {
    mkdtemp,
    rm,
  } from "node:fs/promises";
  import {
    tmpdir,
  } from "node:os";
  import {
    join,
  } from "node:path";
  
  import {
    afterEach,
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
  import {
    ExplorationArtifactStore,
  } from "../artifact/exploration-artifact-store.js";
  import {
    RunArtifactStore,
  } from "../artifact/run-artifact-store.js";
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
    ExplorationLifecycle,
  } from "./exploration-lifecycle.js";
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
  
  const temporaryDirectories:
    string[] = [];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(
        (directory) =>
          rm(directory, {
            recursive: true,
            force: true,
          }),
      ),
    );
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
  
  async function createLifecycle(): Promise<{
    lifecycle: ExplorationLifecycle;
    artifactStore: ExplorationArtifactStore;
  }> {
    const root = await mkdtemp(
      join(
        tmpdir(),
        "factory-exploration-lifecycle-",
      ),
    );
  
    temporaryDirectories.push(root);
  
    const artifactStore =
      new ExplorationArtifactStore(
        new RunArtifactStore(root),
      );
  
    return {
      lifecycle:
        new ExplorationLifecycle(
          new ExplorationWorkflow(),
          artifactStore,
        ),
  
      artifactStore,
    };
  }
  
  describe(
    "ExplorationLifecycle",
    () => {
      it("runs competing implementations and persists complete exploration evidence", async () => {
        const {
          lifecycle,
          artifactStore,
        } = await createLifecycle();
  
        const result =
          await lifecycle.run({
            runId: "run-001",
  
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
  
        const evidence =
          await artifactStore.readEvidence(
            "run-001",
          );
  
        expect(
          evidence.candidates,
        ).toHaveLength(2);
  
        expect(
          evidence.implementations,
        ).toHaveLength(2);
  
        expect(
          evidence.validations,
        ).toHaveLength(2);
  
        expect(
          evidence.selection
            .selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          evidence.metrics,
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
  
      it("persists losing candidate evidence instead of only the winner", async () => {
        const {
          lifecycle,
          artifactStore,
        } = await createLifecycle();
  
        await lifecycle.run({
          runId: "run-002",
  
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
  
        const evidence =
          await artifactStore.readEvidence(
            "run-002",
          );
  
        const candidateAValidation =
          evidence.validations.find(
            (validation) =>
              validation.candidateId ===
              "candidate-a",
          );
  
        const candidateBValidation =
          evidence.validations.find(
            (validation) =>
              validation.candidateId ===
              "candidate-b",
          );
  
        expect(
          candidateAValidation,
        ).toMatchObject({
          status: "success",
  
          validation: {
            passed: false,
          },
        });
  
        expect(
          candidateBValidation,
        ).toMatchObject({
          status: "success",
  
          validation: {
            passed: true,
          },
        });
      });
  
      it("does not persist complete exploration evidence when exploration exits before implementation", async () => {
        const {
          lifecycle,
          artifactStore,
        } = await createLifecycle();
  
        const result =
          await lifecycle.run({
            runId: "run-003",
  
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
  
        expect(
          result.explored,
        ).toBe(false);
  
        expect(
          result.evidence,
        ).toBeUndefined();
  
        await expect(
          artifactStore.readEvidence(
            "run-003",
          ),
        ).rejects.toThrow();
      });
    },
  );