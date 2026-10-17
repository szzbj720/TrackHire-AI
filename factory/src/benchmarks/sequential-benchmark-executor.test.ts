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
    ImplementationResult,
  } from "../schemas/implementation.js";
  
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import type {
    BenchmarkAcceptanceCollector,
    BenchmarkModelEvidenceSource,
  } from "./sequential-benchmark-executor.js";
  
  import {
    SequentialBenchmarkExecutor,
  } from "./sequential-benchmark-executor.js";
  
  class RecordingBuilder
    implements Builder {
    worktreePaths: string[] = [];
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.worktreePaths.push(
        input.worktreePath,
      );
  
      return {
        summary:
          "Implemented the TrackHire benchmark.",
  
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
  
            changeType:
              "modified",
  
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
  }
  
  class PassingValidator
    implements Validator {
    worktreePaths: string[] = [];
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      this.worktreePaths.push(
        worktreePath,
      );
  
      return {
        passed: true,
  
        checks: [
          {
            name:
              "Flutter tests",
  
            command:
              "flutter",
  
            args: [
              "test",
            ],
  
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
  
  class RecordingAcceptanceCollector
    implements BenchmarkAcceptanceCollector {
    workspacePaths: string[] = [];
  
    async collect(input: Parameters<
      BenchmarkAcceptanceCollector["collect"]
    >[0]) {
      this.workspacePaths.push(
        input.workspace.path,
      );
  
      return input.scenario
        .acceptanceCriteria
        .map(
          (criterion) => ({
            criterionId:
              criterion.id,
  
            passed: true,
  
            evidence: [
              `Verified ${criterion.id} in ${input.workspace.path}`,
            ],
          }),
        );
    }
  }
  
  function createPlan():
    ImplementationPlan {
    return {
      summary:
        "Add optional interview date support and upcoming interviews.",
  
      steps: [
        {
          order: 1,
  
          description:
            "Update the application model.",
  
          files: [
            "lib/models/job_application.dart",
          ],
  
          rationale:
            "The model must store the optional interview date.",
        },
  
        {
          order: 2,
  
          description:
            "Update application provider behavior.",
  
          files: [
            "lib/providers/application_provider.dart",
          ],
  
          rationale:
            "The provider must expose upcoming interviews.",
        },
  
        {
          order: 3,
  
          description:
            "Update the add and edit application screen.",
  
          files: [
            "lib/screens/add_edit_job_screen.dart",
          ],
  
          rationale:
            "Users need to enter or edit an interview date.",
        },
  
        {
          order: 4,
  
          description:
            "Add model coverage.",
  
          files: [
            "test/job_application_test.dart",
          ],
  
          rationale:
            "The new behavior requires regression coverage.",
        },
      ],
  
      affectedFiles: [
        "lib/models/job_application.dart",
        "lib/providers/application_provider.dart",
        "lib/screens/add_edit_job_screen.dart",
        "test/job_application_test.dart",
      ],
  
      validationSteps: [
        "flutter analyze",
        "flutter test",
      ],
  
      risks: [
        "Existing serialized applications must remain compatible.",
      ],
  
      assumptions: [
        "Interview date remains optional.",
      ],
  
      requiresHumanInput: false,
    };
  }
  
  function createWorkspace() {
    return {
      scenarioId:
        "trackhire-interview-date",
  
      runId:
        "experiment-001-sequential",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path:
        "/tmp/benchmark-sequential",
  
      branch:
        "factory/benchmark-sequential",
    };
  }
  
  describe(
    "SequentialBenchmarkExecutor",
    () => {
      it(
        "executes the real implementation workflow inside the benchmark workspace",
        async () => {
          const builder =
            new RecordingBuilder();
  
          const validator =
            new PassingValidator();
  
          const acceptanceCollector =
            new RecordingAcceptanceCollector();
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "experiment-001-sequential",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                new ImplementationWorkflow(
                  builder,
                  validator,
                ),
  
              acceptanceCollector,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace:
                createWorkspace(),
            });
  
          expect(
            builder.worktreePaths,
          ).toEqual([
            "/tmp/benchmark-sequential",
          ]);
  
          expect(
            validator.worktreePaths,
          ).toEqual([
            "/tmp/benchmark-sequential",
          ]);
  
          expect(
            acceptanceCollector
              .workspacePaths,
          ).toEqual([
            "/tmp/benchmark-sequential",
          ]);
  
          expect(
            result.criterionResults,
          ).toHaveLength(
            trackHireInterviewDateBenchmark
              .acceptanceCriteria
              .length,
          );
  
          expect(
            result.humanInterventions,
          ).toBe(1);
        },
      );
  
      it(
        "does not invent model usage when model evidence is unavailable",
        async () => {
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "experiment-001-sequential",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                new ImplementationWorkflow(
                  new RecordingBuilder(),
                  new PassingValidator(),
                ),
  
              acceptanceCollector:
                new RecordingAcceptanceCollector(),
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace:
                createWorkspace(),
            });
  
          expect(
            result.usage,
          ).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
          });
        },
      );
  
      it(
        "reports measured model usage from model evidence",
        async () => {
          const modelEvidence:
            BenchmarkModelEvidenceSource = {
              snapshot() {
                return {
                  calls: [
                    {
                      callIndex: 0,
  
                      requestedAt:
                        "2026-10-17T00:00:00.000Z",
  
                      completedAt:
                        "2026-10-17T00:00:00.050Z",
  
                      durationMs: 50,
  
                      success: true,
  
                      model:
                        "fake-coder",
  
                      usage: {
                        inputTokens: 1200,
                        outputTokens: 450,
                        estimatedCostUsd: 0.012,
                      },
                    },
                  ],
  
                  successfulCalls: 1,
                  failedCalls: 0,
  
                  inputTokens: 1200,
                  outputTokens: 450,
  
                  estimatedCostUsd: 0.012,
  
                  totalDurationMs: 50,
                };
              },
            };
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "experiment-001-sequential",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                new ImplementationWorkflow(
                  new RecordingBuilder(),
                  new PassingValidator(),
                ),
  
              acceptanceCollector:
                new RecordingAcceptanceCollector(),
  
              modelEvidence,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace:
                createWorkspace(),
            });
  
          expect(
            result.usage,
          ).toEqual({
            inputTokens: 1200,
            outputTokens: 450,
            estimatedCostUsd: 0.012,
          });
        },
      );
  
      it(
        "uses aggregate evidence from multiple model calls",
        async () => {
          const modelEvidence:
            BenchmarkModelEvidenceSource = {
              snapshot() {
                return {
                  calls: [
                    {
                      callIndex: 0,
  
                      requestedAt:
                        "2026-10-17T00:00:00.000Z",
  
                      completedAt:
                        "2026-10-17T00:00:00.040Z",
  
                      durationMs: 40,
  
                      success: true,
  
                      model:
                        "fake-planner",
  
                      usage: {
                        inputTokens: 700,
                        outputTokens: 200,
                        estimatedCostUsd: 0.007,
                      },
                    },
  
                    {
                      callIndex: 1,
  
                      requestedAt:
                        "2026-10-17T00:00:01.000Z",
  
                      completedAt:
                        "2026-10-17T00:00:01.060Z",
  
                      durationMs: 60,
  
                      success: true,
  
                      model:
                        "fake-coder",
  
                      usage: {
                        inputTokens: 900,
                        outputTokens: 350,
                        estimatedCostUsd: 0.011,
                      },
                    },
                  ],
  
                  successfulCalls: 2,
                  failedCalls: 0,
  
                  inputTokens: 1600,
                  outputTokens: 550,
  
                  estimatedCostUsd: 0.018,
  
                  totalDurationMs: 100,
                };
              },
            };
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "experiment-001-sequential",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                new ImplementationWorkflow(
                  new RecordingBuilder(),
                  new PassingValidator(),
                ),
  
              acceptanceCollector:
                new RecordingAcceptanceCollector(),
  
              modelEvidence,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace:
                createWorkspace(),
            });
  
          expect(
            result.usage,
          ).toEqual({
            inputTokens: 1600,
            outputTokens: 550,
            estimatedCostUsd: 0.018,
          });
        },
      );
    },
  );