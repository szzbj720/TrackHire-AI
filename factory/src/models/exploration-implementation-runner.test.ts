import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Builder,
    BuilderInput,
  } from "../agents/builder.js";
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    ExplorationWorkspace,
  } from "./exploration-workspace-manager.js";
  import {
    ExplorationImplementationRunner,
  } from "./exploration-implementation-runner.js";
  
  class RecordingBuilder
    implements Builder
  {
    inputs: BuilderInput[] = [];
  
    constructor(
      private readonly result:
        ImplementationResult,
    ) {}
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.inputs.push(input);
  
      return this.result;
    }
  }
  
  class FailingBuilder
    implements Builder
  {
    async implement(
      _input: BuilderInput,
    ): Promise<ImplementationResult> {
      throw new Error(
        "Implementation failed",
      );
    }
  }
  
  function createTask(): EngineeringTask {
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
  
  function createCandidate(
    overrides:
      Partial<ExplorationCandidate> = {},
  ): ExplorationCandidate {
    return {
      candidateId: "candidate-a",
      targetId: "explorer-a",
      model: "model-a",
  
      summary:
        "Add interview date support.",
  
      approach:
        "Extend the application model while preserving backward compatibility.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add an optional interviewDate field.",
        "Preserve existing serialization behavior.",
      ],
  
      validationSteps: [
        "Run flutter test.",
      ],
  
      advantages: [
        "Small implementation scope.",
      ],
  
      risks: [
        "Persisted data must remain compatible.",
      ],
  
      assumptions: [
        "Missing dates deserialize as null.",
      ],
  
      requiresHumanInput: false,
      confidence: 0.9,
  
      ...overrides,
    };
  }
  
  function createWorkspace(
    candidate:
      ExplorationCandidate,
  ): ExplorationWorkspace {
    return {
      candidateId:
        candidate.candidateId,
      targetId:
        candidate.targetId,
      model: candidate.model,
      worktree: {
        path:
          `/tmp/${candidate.candidateId}`,
        branch:
          `factory/${candidate.candidateId}`,
      },
    };
  }
  
  function createImplementation(
    summary: string,
  ): ImplementationResult {
    return {
      summary,
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interview date.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  describe(
    "ExplorationImplementationRunner",
    () => {
      it("implements a candidate inside its isolated workspace", async () => {
        const candidate =
          createCandidate();
  
        const builder =
          new RecordingBuilder(
            createImplementation(
              "Implemented candidate A.",
            ),
          );
  
        const runner =
          new ExplorationImplementationRunner();
  
        const result =
          await runner.run(
            createTask(),
            [
              {
                candidate,
                workspace:
                  createWorkspace(
                    candidate,
                  ),
                builder,
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          status: "success",
          implementation: {
            summary:
              "Implemented candidate A.",
          },
        });
  
        expect(
          builder.inputs,
        ).toHaveLength(1);
  
        expect(
          builder.inputs[0]
            ?.worktreePath,
        ).toBe(
          "/tmp/candidate-a",
        );
      });
  
      it("converts the exploration candidate into an implementation plan", async () => {
        const candidate =
          createCandidate();
  
        const builder =
          new RecordingBuilder(
            createImplementation(
              "Implemented.",
            ),
          );
  
        const runner =
          new ExplorationImplementationRunner();
  
        await runner.run(
          createTask(),
          [
            {
              candidate,
              workspace:
                createWorkspace(
                  candidate,
                ),
              builder,
            },
          ],
        );
  
        expect(
          builder.inputs[0]?.plan,
        ).toEqual({
          summary:
            "Add interview date support.",
  
          steps: [
            {
              order: 1,
              description:
                "Add an optional interviewDate field.",
              files: [
                "lib/models/job_application.dart",
              ],
              rationale:
                "Extend the application model while preserving backward compatibility.",
            },
            {
              order: 2,
              description:
                "Preserve existing serialization behavior.",
              files: [
                "lib/models/job_application.dart",
              ],
              rationale:
                "Extend the application model while preserving backward compatibility.",
            },
          ],
  
          affectedFiles: [
            "lib/models/job_application.dart",
          ],
  
          validationSteps: [
            "Run flutter test.",
          ],
  
          risks: [
            "Persisted data must remain compatible.",
          ],
  
          assumptions: [
            "Missing dates deserialize as null.",
          ],
  
          requiresHumanInput: false,
        });
      });
  
      it("runs competing implementations independently", async () => {
        const candidateA =
          createCandidate();
  
        const candidateB =
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
          });
  
        const builderA =
          new RecordingBuilder(
            createImplementation(
              "Implementation A.",
            ),
          );
  
        const builderB =
          new RecordingBuilder(
            createImplementation(
              "Implementation B.",
            ),
          );
  
        const runner =
          new ExplorationImplementationRunner();
  
        const result =
          await runner.run(
            createTask(),
            [
              {
                candidate:
                  candidateA,
                workspace:
                  createWorkspace(
                    candidateA,
                  ),
                builder: builderA,
              },
              {
                candidate:
                  candidateB,
                workspace:
                  createWorkspace(
                    candidateB,
                  ),
                builder: builderB,
              },
            ],
          );
  
        expect(
          result.results,
        ).toHaveLength(2);
  
        expect(
          builderA.inputs[0]
            ?.worktreePath,
        ).toBe(
          "/tmp/candidate-a",
        );
  
        expect(
          builderB.inputs[0]
            ?.worktreePath,
        ).toBe(
          "/tmp/candidate-b",
        );
      });
  
      it("preserves a successful implementation when another candidate fails", async () => {
        const candidateA =
          createCandidate();
  
        const candidateB =
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
          });
  
        const runner =
          new ExplorationImplementationRunner();
  
        const result =
          await runner.run(
            createTask(),
            [
              {
                candidate:
                  candidateA,
                workspace:
                  createWorkspace(
                    candidateA,
                  ),
                builder:
                  new RecordingBuilder(
                    createImplementation(
                      "Implementation A.",
                    ),
                  ),
              },
              {
                candidate:
                  candidateB,
                workspace:
                  createWorkspace(
                    candidateB,
                  ),
                builder:
                  new FailingBuilder(),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          status: "success",
        });
  
        expect(
          result.results[1],
        ).toEqual({
          candidateId:
            "candidate-b",
          targetId: "explorer-b",
          model: "model-b",
          status: "error",
          error:
            "Implementation failed",
        });
      });
  
      it("rejects a workspace belonging to another candidate", async () => {
        const candidate =
          createCandidate();
  
        const wrongCandidate =
          createCandidate({
            candidateId:
              "candidate-b",
          });
  
        const runner =
          new ExplorationImplementationRunner();
  
        const result =
          await runner.run(
            createTask(),
            [
              {
                candidate,
                workspace:
                  createWorkspace(
                    wrongCandidate,
                  ),
                builder:
                  new RecordingBuilder(
                    createImplementation(
                      "Should not run.",
                    ),
                  ),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toEqual({
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          status: "error",
          error:
            "Exploration workspace candidate mismatch: expected candidate-a, received candidate-b",
        });
      });
  
      it("rejects duplicate candidate implementations before execution", async () => {
        const candidate =
          createCandidate();
  
        const builder =
          new RecordingBuilder(
            createImplementation(
              "Implemented.",
            ),
          );
  
        const runner =
          new ExplorationImplementationRunner();
  
        await expect(
          runner.run(
            createTask(),
            [
              {
                candidate,
                workspace:
                  createWorkspace(
                    candidate,
                  ),
                builder,
              },
              {
                candidate,
                workspace:
                  createWorkspace(
                    candidate,
                  ),
                builder,
              },
            ],
          ),
        ).rejects.toThrow(
          "Duplicate exploration implementation candidate: candidate-a",
        );
  
        expect(
          builder.inputs,
        ).toHaveLength(0);
      });
    },
  );