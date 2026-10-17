import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    BenchmarkResult,
    BenchmarkStrategy,
  } from "../schemas/benchmark-result.js";
  
  import type {
    BenchmarkRunRequest,
  } from "./benchmark-runner.js";
  
  import {
    BenchmarkResultAggregator,
  } from "./benchmark-result-aggregator.js";
  
  import {
    ControlledBenchmarkExperiment,
  } from "./controlled-benchmark-experiment.js";
  
  function makeResult(input: {
    runId: string;
    strategy: BenchmarkStrategy;
    baselineRevision: string;
    success: boolean;
    validationPassed: boolean;
    acceptancePassed: boolean;
    passedCriteria: number;
    totalCriteria: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    durationMs: number;
    humanInterventions: number;
  }): BenchmarkResult {
    return {
      runId:
        input.runId,
  
      scenarioId:
        "trackhire-interview-date",
  
      strategy:
        input.strategy,
  
      baselineRevision:
        input.baselineRevision,
  
      workspacePath:
        `/tmp/${input.runId}`,
  
      workspaceBranch:
        `benchmark/${input.runId}`,
  
      validation: {
        passed:
          input.validationPassed,
  
        commandsRun: [
          "flutter analyze",
          "flutter test",
        ],
  
        failedCommands:
          input.validationPassed
            ? []
            : ["flutter test"],
      },
  
      acceptance: {
        passed:
          input.acceptancePassed,
  
        passedCriteria:
          input.passedCriteria,
  
        failedCriteria:
          input.totalCriteria -
          input.passedCriteria,
  
        totalCriteria:
          input.totalCriteria,
  
        scores: [],
  
        missingCriterionIds: [],
  
        unexpectedCriterionIds: [],
      },
  
      usage: {
        inputTokens:
          input.inputTokens,
  
        outputTokens:
          input.outputTokens,
  
        estimatedCostUsd:
          input.estimatedCostUsd,
      },
  
      durationMs:
        input.durationMs,
  
      humanInterventions:
        input.humanInterventions,
  
      success:
        input.success,
  
      startedAt:
        "2026-10-17T00:00:00.000Z",
  
      completedAt:
        "2026-10-17T00:00:01.000Z",
    };
  }
  
  describe(
    "controlled benchmark integration",
    () => {
      it(
        "runs repeated controlled targets and aggregates comparable results",
        async () => {
          const requests:
            BenchmarkRunRequest[] =
              [];
  
          const baselineRevision =
            "baseline-abc123";
  
          const runner = {
            async run(
              request: BenchmarkRunRequest,
            ): Promise<BenchmarkResult> {
              requests.push(
                request,
              );
  
              const isSequential =
                request.strategy ===
                "sequential";
  
              return makeResult({
                runId:
                  request.runId,
  
                strategy:
                  request.strategy,
  
                baselineRevision,
  
                success:
                  isSequential,
  
                validationPassed:
                  true,
  
                acceptancePassed:
                  isSequential,
  
                passedCriteria:
                  isSequential
                    ? 5
                    : 4,
  
                totalCriteria:
                  5,
  
                inputTokens:
                  isSequential
                    ? 100
                    : 200,
  
                outputTokens:
                  isSequential
                    ? 50
                    : 100,
  
                estimatedCostUsd:
                  isSequential
                    ? 0.01
                    : 0.02,
  
                durationMs:
                  isSequential
                    ? 1_000
                    : 2_000,
  
                humanInterventions:
                  isSequential
                    ? 0
                    : 1,
              });
            },
          };
  
          const experiment =
            new ControlledBenchmarkExperiment(
              runner,
            );
  
          const fakeExecutor = {
            async execute() {
              return {
                criterionResults: [],
                usage: {
                  inputTokens: 0,
                  outputTokens: 0,
                  estimatedCostUsd: 0,
                },
                humanInterventions: 0,
              };
            },
          };
  
          const fakeValidator = {
            async validate() {
              return {
                passed: true,
  
                checks: [],
  
                failedChecks: [],
  
                durationMs: 0,
              };
            },
          };
  
          const fixture = {
            path:
              "test/factory_benchmark_interview_date_test.dart",
  
            content:
              "void main() {}",
          };
  
          const result =
            await experiment.run({
              experimentId:
                "phase-6-final",
  
              scenario: {
                id:
                  "trackhire-interview-date",
  
                name:
                  "TrackHire interview date",
  
                description:
                  "Add an optional interview date and display upcoming interviews.",
  
                task:
                  "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  
                repositoryFiles: [
                  "lib/models/job_application.dart",
                  "lib/providers/application_provider.dart",
                  "lib/screens/add_edit_job_screen.dart",
                ],
  
                acceptanceCriteria: [
                  {
                    id:
                      "optional-date",
  
                    description:
                      "Interview date is optional.",
  
                    verification:
                      "Held-out acceptance test.",
                  },
                ],
  
                validationCommands: [
                  "flutter analyze",
                  "flutter test",
                ],
  
                expectedComplexity:
                  "high",
  
                expectedRisk:
                  "medium",
  
                requiresRealRepository:
                  true,
              },
  
              repositoryRoot:
                "/tmp/trackhire",
  
              baseRevision:
                baselineRevision,
  
              repetitions:
                2,
  
              fixtures: [
                fixture,
              ],
  
              targets: [
                {
                  targetId:
                    "sequential-target",
  
                  strategy:
                    "sequential",
  
                  executor:
                    fakeExecutor,
  
                  validator:
                    fakeValidator,
                },
  
                {
                  targetId:
                    "exploration-target",
  
                  strategy:
                    "exploration",
  
                  executor:
                    fakeExecutor,
  
                  validator:
                    fakeValidator,
                },
              ],
            });
  
          expect(
            result.trials,
          ).toHaveLength(4);
  
          expect(
            requests,
          ).toHaveLength(4);
  
          expect(
            new Set(
              requests.map(
                (request) =>
                  request.runId,
              ),
            ).size,
          ).toBe(4);
  
          for (
            const request
            of requests
          ) {
            expect(
              request.baseRevision,
            ).toBe(
              baselineRevision,
            );
  
            expect(
              request.fixtures,
            ).toEqual([
              fixture,
            ]);
          }
  
          expect(
            result.trials.every(
              (trial) =>
                trial.result
                  .baselineRevision ===
                baselineRevision,
            ),
          ).toBe(true);
  
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregates =
            result.targets.map(
              (target) =>
                aggregator.aggregate({
                  targetId:
                    target.targetId,
  
                  strategy:
                    target.strategy,
  
                  results:
                    target.trials.map(
                      (trial) =>
                        trial.result,
                    ),
                }),
            );
  
          const sequential =
            aggregates.find(
              (aggregate) =>
                aggregate.targetId ===
                "sequential-target",
            );
  
          const exploration =
            aggregates.find(
              (aggregate) =>
                aggregate.targetId ===
                "exploration-target",
            );
  
          expect(
            sequential,
          ).toBeDefined();
  
          expect(
            exploration,
          ).toBeDefined();
  
          expect(
            sequential?.trialCount,
          ).toBe(2);
  
          expect(
            exploration?.trialCount,
          ).toBe(2);
  
          expect(
            sequential?.successRate,
          ).toBe(1);
  
          expect(
            exploration?.successRate,
          ).toBe(0);
  
          expect(
            sequential
              ?.criterionPassRate,
          ).toBe(1);
  
          expect(
            exploration
              ?.criterionPassRate,
          ).toBe(0.8);
  
          expect(
            sequential
              ?.averageInputTokens,
          ).toBe(100);
  
          expect(
            exploration
              ?.averageInputTokens,
          ).toBe(200);
  
          expect(
            sequential
              ?.averageEstimatedCostUsd,
          ).toBeCloseTo(0.01);
  
          expect(
            exploration
              ?.averageEstimatedCostUsd,
          ).toBeCloseTo(0.02);
  
          expect(
            sequential
              ?.averageDurationMs,
          ).toBe(1_000);
  
          expect(
            exploration
              ?.averageDurationMs,
          ).toBe(2_000);
  
          expect(
            sequential
              ?.averageHumanInterventions,
          ).toBe(0);
  
          expect(
            exploration
              ?.averageHumanInterventions,
          ).toBe(1);
        },
      );
    },
  );