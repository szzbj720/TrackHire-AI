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
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import {
    BenchmarkExperiment,
    type BenchmarkRunnerAdapter,
  } from "./benchmark-experiment.js";
  
  import type {
    BenchmarkRunRequest,
    BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
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
  
          checks: [
            {
              name:
                "flutter test",
  
              command:
                "flutter",
  
              args: [
                "test",
              ],
  
              exitCode: 0,
  
              stdout: "",
              stderr: "",
  
              durationMs: 1,
  
              passed: true,
            },
          ],
  
          failedChecks: [],
  
          durationMs: 1,
        };
      },
    };
  
  function createResult(
    strategy:
      BenchmarkStrategy,
  
    success = true,
  
    baselineRevision =
      "abc123def456",
  ): BenchmarkResult {
    return {
      runId:
        `experiment-001-${strategy}`,
  
      scenarioId:
        "trackhire-interview-date",
  
      strategy,
  
      baselineRevision,
  
      workspacePath:
        `/tmp/${strategy}`,
  
      workspaceBranch:
        `factory/${strategy}`,
  
      validation: {
        passed:
          success,
  
        commandsRun: [
          "flutter test",
        ],
  
        failedCommands:
          success
            ? []
            : [
                "flutter test",
              ],
      },
  
      acceptance: {
        passed:
          success,
  
        passedCriteria:
          success ? 5 : 4,
  
        failedCriteria:
          success ? 0 : 1,
  
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
  
      durationMs:
        strategy ===
        "exploration"
          ? 2000
          : 1000,
  
      humanInterventions: 0,
  
      success,
  
      startedAt:
        "2026-10-16T20:00:00.000Z",
  
      completedAt:
        "2026-10-16T20:00:01.000Z",
    };
  }
  
  function createRunner(
    results:
      Partial<
        Record<
          BenchmarkStrategy,
          BenchmarkResult
        >
      >,
  ): BenchmarkRunnerAdapter {
    const run = vi.fn(
      async (
        request:
          BenchmarkRunRequest,
      ): Promise<BenchmarkResult> => {
        const result =
          results[
            request.strategy
          ];
  
        if (!result) {
          throw new Error(
            `Missing test result for ${request.strategy}.`,
          );
        }
  
        return result;
      },
    );
  
    return {
      run,
    };
  }
  
  describe(
    "BenchmarkExperiment",
    () => {
      it("runs multiple strategies against the same benchmark", async () => {
        const runner =
          createRunner({
            sequential:
              createResult(
                "sequential",
              ),
  
            exploration:
              createResult(
                "exploration",
              ),
          });
  
        const experiment =
          new BenchmarkExperiment(
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
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
  
              {
                strategy:
                  "exploration",
  
                executor,
                validator,
              },
            ],
          });
  
        expect(
          runner.run,
        ).toHaveBeenCalledTimes(
          2,
        );
  
        expect(
          result.results,
        ).toHaveLength(2);
  
        expect(
          result.baselineRevision,
        ).toBe(
          "abc123def456",
        );
  
        expect(
          result.successfulStrategies,
        ).toEqual([
          "sequential",
          "exploration",
        ]);
  
        expect(
          result.failedStrategies,
        ).toEqual([]);
      });
  
      it("records successful and failed strategies separately", async () => {
        const runner =
          createRunner({
            sequential:
              createResult(
                "sequential",
                false,
              ),
  
            exploration:
              createResult(
                "exploration",
                true,
              ),
          });
  
        const experiment =
          new BenchmarkExperiment(
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
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
  
              {
                strategy:
                  "exploration",
  
                executor,
                validator,
              },
            ],
          });
  
        expect(
          result.successfulStrategies,
        ).toEqual([
          "exploration",
        ]);
  
        expect(
          result.failedStrategies,
        ).toEqual([
          "sequential",
        ]);
      });
  
      it("rejects an experiment with fewer than two strategies", async () => {
        const experiment =
          new BenchmarkExperiment(
            createRunner({
              sequential:
                createResult(
                  "sequential",
                ),
            }),
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
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
            ],
          }),
        ).rejects.toThrow(
          "A benchmark experiment requires at least two strategy targets.",
        );
      });
  
      it("rejects duplicate strategy targets", async () => {
        const experiment =
          new BenchmarkExperiment(
            createRunner({
              sequential:
                createResult(
                  "sequential",
                ),
            }),
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
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
  
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
            ],
          }),
        ).rejects.toThrow(
          "Duplicate benchmark strategy target: sequential.",
        );
      });
  
      it("rejects results produced from different baseline revisions", async () => {
        const experiment =
          new BenchmarkExperiment(
            createRunner({
              sequential:
                createResult(
                  "sequential",
                  true,
                  "baseline-a",
                ),
  
              exploration:
                createResult(
                  "exploration",
                  true,
                  "baseline-b",
                ),
            }),
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
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
  
              {
                strategy:
                  "exploration",
  
                executor,
                validator,
              },
            ],
          }),
        ).rejects.toThrow(
          "Benchmark strategies did not execute from the same baseline revision.",
        );
      });
  
      it("rejects an empty experiment ID", async () => {
        const experiment =
          new BenchmarkExperiment(
            createRunner({
              sequential:
                createResult(
                  "sequential",
                ),
  
              exploration:
                createResult(
                  "exploration",
                ),
            }),
          );
  
        await expect(
          experiment.run({
            experimentId:
              "   ",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            targets: [
              {
                strategy:
                  "sequential",
  
                executor,
                validator,
              },
  
              {
                strategy:
                  "exploration",
  
                executor,
                validator,
              },
            ],
          }),
        ).rejects.toThrow(
          "Benchmark experiment ID cannot be empty.",
        );
      });
    },
  );