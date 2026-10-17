import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    BenchmarkResult,
    BenchmarkStrategy,
  } from "../schemas/benchmark-result.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  import {
    ControlledBenchmarkExperiment,
    type ControlledBenchmarkRunner,
  } from "./controlled-benchmark-experiment.js";
  
  import type {
    BenchmarkRunRequest,
    BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  const executor:
    BenchmarkStrategyExecutor = {
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
  
  const validator:
    Validator = {
      async validate() {
        return {
          passed: true,
  
          checks: [],
  
          failedChecks: [],
  
          durationMs: 0,
        };
      },
    };
  
  function createResult(
    request:
      BenchmarkRunRequest,
  
    baselineRevision =
      "abc123",
  ): BenchmarkResult {
    return {
      runId:
        request.runId,
  
      scenarioId:
        request.scenario.id,
  
      strategy:
        request.strategy,
  
      baselineRevision,
  
      workspacePath:
        `/tmp/${request.runId}`,
  
      workspaceBranch:
        `factory/${request.runId}`,
  
      validation: {
        passed: true,
  
        commandsRun: [],
  
        failedCommands: [],
      },
  
      acceptance: {
        passed: true,
  
        passedCriteria: 5,
  
        failedCriteria: 0,
  
        totalCriteria: 5,
  
        scores: [],
  
        missingCriterionIds: [],
  
        unexpectedCriterionIds: [],
      },
  
      usage: {
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
  
      durationMs: 1000,
  
      humanInterventions: 0,
  
      success: true,
  
      startedAt:
        "2026-10-17T00:00:00.000Z",
  
      completedAt:
        "2026-10-17T00:00:01.000Z",
    };
  }
  
  function createRunner(
    baselineForRun?: (
      request:
        BenchmarkRunRequest,
    ) => string,
  ): ControlledBenchmarkRunner {
    return {
      run: vi.fn(
        async (
          request:
            BenchmarkRunRequest,
        ) =>
          createResult(
            request,
            baselineForRun
              ? baselineForRun(
                  request,
                )
              : "abc123",
          ),
      ),
    };
  }
  
  function target(
    targetId: string,
    strategy:
      BenchmarkStrategy,
  ) {
    return {
      targetId,
      strategy,
      executor,
      validator,
    };
  }
  
  describe(
    "ControlledBenchmarkExperiment",
    () => {
      it(
        "runs every target for the same number of repetitions",
        async () => {
          const runner =
            createRunner();
  
          const experiment =
            new ControlledBenchmarkExperiment(
              runner,
            );
  
          const result =
            await experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 3,
  
              targets: [
                target(
                  "sequential-model-a",
                  "sequential",
                ),
  
                target(
                  "exploration-model-a",
                  "exploration",
                ),
              ],
            });
  
          expect(
            runner.run,
          ).toHaveBeenCalledTimes(
            6,
          );
  
          expect(
            result.trials,
          ).toHaveLength(6);
  
          expect(
            result.targets,
          ).toHaveLength(2);
  
          expect(
            result.targets[0]
              ?.trials,
          ).toHaveLength(3);
  
          expect(
            result.targets[1]
              ?.trials,
          ).toHaveLength(3);
  
          expect(
            result.repetitions,
          ).toBe(3);
  
          expect(
            result.baselineRevision,
          ).toBe(
            "abc123",
          );
        },
      );
  
      it(
        "allows different targets to use the same strategy",
        async () => {
          const experiment =
            new ControlledBenchmarkExperiment(
              createRunner(),
            );
  
          const result =
            await experiment.run({
              experimentId:
                "model-comparison",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 2,
  
              targets: [
                target(
                  "openai-sequential",
                  "sequential",
                ),
  
                target(
                  "anthropic-sequential",
                  "sequential",
                ),
              ],
            });
  
          expect(
            result.targets.map(
              (entry) =>
                entry.strategy,
            ),
          ).toEqual([
            "sequential",
            "sequential",
          ]);
  
          expect(
            result.targets.map(
              (entry) =>
                entry.targetId,
            ),
          ).toEqual([
            "openai-sequential",
            "anthropic-sequential",
          ]);
        },
      );
  
      it(
        "creates a unique run ID for every trial",
        async () => {
          const experiment =
            new ControlledBenchmarkExperiment(
              createRunner(),
            );
  
          const result =
            await experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 2,
  
              targets: [
                target(
                  "target-a",
                  "sequential",
                ),
  
                target(
                  "target-b",
                  "exploration",
                ),
              ],
            });
  
          expect(
            result.trials.map(
              (trial) =>
                trial.runId,
            ),
          ).toEqual([
            "experiment-001-target-a-trial-1",
            "experiment-001-target-a-trial-2",
            "experiment-001-target-b-trial-1",
            "experiment-001-target-b-trial-2",
          ]);
        },
      );
  
      it(
        "passes held-out fixtures to every trial",
        async () => {
          const runner =
            createRunner();
  
          const experiment =
            new ControlledBenchmarkExperiment(
              runner,
            );
  
          await experiment.run({
            experimentId:
              "experiment-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            repetitions: 2,
  
            targets: [
              target(
                "target-a",
                "sequential",
              ),
  
              target(
                "target-b",
                "exploration",
              ),
            ],
  
            fixtures: [
              {
                path:
                  "test/protected_test.dart",
  
                content:
                  "protected",
              },
            ],
          });
  
          const calls =
            vi.mocked(
              runner.run,
            ).mock.calls;
  
          expect(
            calls,
          ).toHaveLength(4);
  
          for (
            const [request]
            of calls
          ) {
            expect(
              request.fixtures,
            ).toEqual([
              {
                path:
                  "test/protected_test.dart",
  
                content:
                  "protected",
              },
            ]);
          }
        },
      );
  
      it(
        "rejects trials that resolve to different baseline revisions",
        async () => {
          const runner =
            createRunner(
              (request) =>
                request.runId.includes(
                  "target-b",
                )
                  ? "baseline-b"
                  : "baseline-a",
            );
  
          const experiment =
            new ControlledBenchmarkExperiment(
              runner,
            );
  
          await expect(
            experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 2,
  
              targets: [
                target(
                  "target-a",
                  "sequential",
                ),
  
                target(
                  "target-b",
                  "exploration",
                ),
              ],
            }),
          ).rejects.toThrow(
            "Controlled benchmark trials did not execute from the same baseline revision.",
          );
        },
      );
  
      it(
        "rejects duplicate target IDs",
        async () => {
          const experiment =
            new ControlledBenchmarkExperiment(
              createRunner(),
            );
  
          await expect(
            experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 2,
  
              targets: [
                target(
                  "same-target",
                  "sequential",
                ),
  
                target(
                  "same-target",
                  "exploration",
                ),
              ],
            }),
          ).rejects.toThrow(
            "Duplicate benchmark target ID: same-target.",
          );
        },
      );
  
      it(
        "rejects invalid repetition counts",
        async () => {
          const experiment =
            new ControlledBenchmarkExperiment(
              createRunner(),
            );
  
          await expect(
            experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 0,
  
              targets: [
                target(
                  "target-a",
                  "sequential",
                ),
  
                target(
                  "target-b",
                  "exploration",
                ),
              ],
            }),
          ).rejects.toThrow(
            "Benchmark repetitions must be a positive integer.",
          );
        },
      );
  
      it(
        "requires at least two controlled targets",
        async () => {
          const experiment =
            new ControlledBenchmarkExperiment(
              createRunner(),
            );
  
          await expect(
            experiment.run({
              experimentId:
                "experiment-001",
  
              scenario:
                trackHireInterviewDateBenchmark,
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
  
              repetitions: 2,
  
              targets: [
                target(
                  "target-a",
                  "sequential",
                ),
              ],
            }),
          ).rejects.toThrow(
            "A controlled benchmark experiment requires at least two targets.",
          );
        },
      );
    },
  );