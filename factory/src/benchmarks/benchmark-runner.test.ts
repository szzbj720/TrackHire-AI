import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    BenchmarkRunner,
    type BenchmarkClock,
    type BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import type {
    BenchmarkWorkspaceManager,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  function createClock():
    BenchmarkClock {
    const timestamps = [
      "2026-10-16T20:00:00.000Z",
      "2026-10-16T20:00:04.500Z",
    ];
  
    const milliseconds = [
      1000,
      5500,
    ];
  
    return {
      isoNow() {
        const value =
          timestamps.shift();
  
        if (!value) {
          throw new Error(
            "No timestamp available.",
          );
        }
  
        return value;
      },
  
      now() {
        const value =
          milliseconds.shift();
  
        if (
          value === undefined
        ) {
          throw new Error(
            "No clock value available.",
          );
        }
  
        return value;
      },
    };
  }
  
  function createWorkspaceManager() {
    return {
      create: vi.fn(
        async () => ({
          scenarioId:
            "trackhire-interview-date",
  
          runId:
            "run-001",
  
          strategyId:
            "sequential",
  
          baselineRevision:
            "abc123def456",
  
          path:
            "/tmp/benchmark-worktree",
  
          branch:
            "factory/benchmark-trackhire-interview-date-run-001-sequential",
        }),
      ),
    } as unknown as
      BenchmarkWorkspaceManager;
  }
  
  function createExecutor(
    overrides?: {
      failCriterion?: string;
    },
  ): BenchmarkStrategyExecutor {
    return {
      async execute() {
        return {
          criterionResults:
            trackHireInterviewDateBenchmark
              .acceptanceCriteria
              .map(
                (criterion) => ({
                  criterionId:
                    criterion.id,
  
                  passed:
                    criterion.id !==
                    overrides?.failCriterion,
  
                  evidence: [
                    criterion.id ===
                    overrides?.failCriterion
                      ? "Criterion failed."
                      : "Criterion passed.",
                  ],
                }),
              ),
  
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            estimatedCostUsd: 0,
          },
  
          humanInterventions: 0,
        };
      },
    };
  }
  
  function createValidator(
    passed = true,
  ): Validator {
    return {
      async validate() {
        return {
          passed,
  
          checks: [
            {
              name:
                "flutter analyze",
  
              command:
                "flutter",
  
              args: [
                "analyze",
              ],
  
              exitCode:
                passed ? 0 : 1,
  
              stdout: "",
              stderr: "",
  
              durationMs: 100,
  
              passed,
            },
  
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
  
              durationMs: 200,
  
              passed: true,
            },
          ],
  
          failedChecks:
            passed
              ? []
              : [
                  "flutter analyze",
                ],
  
          durationMs: 300,
        };
      },
    };
  }
  
  describe(
    "BenchmarkRunner",
    () => {
      it("runs a strategy in an isolated workspace and produces a successful benchmark result", async () => {
        const workspaceManager =
          createWorkspaceManager();
  
        const executor =
          createExecutor();
  
        const validator =
          createValidator();
  
        const runner =
          new BenchmarkRunner(
            workspaceManager,
            undefined,
            createClock(),
          );
  
        const result =
          await runner.run({
            runId:
              "run-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor,
            validator,
          });
  
        expect(
          workspaceManager.create,
        ).toHaveBeenCalledWith({
          scenario:
            trackHireInterviewDateBenchmark,
  
          runId:
            "run-001",
  
          strategyId:
            "sequential",
  
          repositoryRoot:
            "/repo/trackhire",
  
          baseRevision:
            "main",
        });
  
        expect(result.success).toBe(
          true,
        );
  
        expect(
          result.validation.passed,
        ).toBe(true);
  
        expect(
          result.acceptance.passed,
        ).toBe(true);
  
        expect(
          result.baselineRevision,
        ).toBe(
          "abc123def456",
        );
  
        expect(
          result.durationMs,
        ).toBe(4500);
      });
  
      it("fails the benchmark when deterministic validation fails", async () => {
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(),
            undefined,
            createClock(),
          );
  
        const result =
          await runner.run({
            runId:
              "run-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor:
              createExecutor(),
  
            validator:
              createValidator(false),
          });
  
        expect(result.success).toBe(
          false,
        );
  
        expect(
          result.validation.passed,
        ).toBe(false);
  
        expect(
          result.acceptance.passed,
        ).toBe(true);
  
        expect(
          result.validation.failedCommands,
        ).toEqual([
          "flutter analyze",
        ]);
      });
  
      it("fails the benchmark when acceptance criteria fail even if validation passes", async () => {
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(),
            undefined,
            createClock(),
          );
  
        const result =
          await runner.run({
            runId:
              "run-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor:
              createExecutor({
                failCriterion:
                  "upcoming-interviews",
              }),
  
            validator:
              createValidator(true),
          });
  
        expect(result.success).toBe(
          false,
        );
  
        expect(
          result.validation.passed,
        ).toBe(true);
  
        expect(
          result.acceptance.passed,
        ).toBe(false);
  
        expect(
          result.acceptance.failedCriteria,
        ).toBe(1);
      });
  
      it("preserves measured model usage without inventing cost", async () => {
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(),
            undefined,
            createClock(),
          );
  
        const result =
          await runner.run({
            runId:
              "run-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "exploration",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor:
              createExecutor(),
  
            validator:
              createValidator(),
          });
  
        expect(result.usage).toEqual({
          inputTokens: 100,
          outputTokens: 50,
          estimatedCostUsd: 0,
        });
      });
  
      it("records the deterministic commands that actually ran", async () => {
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(),
            undefined,
            createClock(),
          );
  
        const result =
          await runner.run({
            runId:
              "run-001",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "parallel",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor:
              createExecutor(),
  
            validator:
              createValidator(),
          });
  
        expect(
          result.validation.commandsRun,
        ).toEqual([
          "flutter analyze",
          "flutter test",
        ]);
      });
    },
  );