import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    BenchmarkFixtureManager,
  } from "./benchmark-fixture-manager.js";
  
  import {
    BenchmarkRunner,
  } from "./benchmark-runner.js";
  
  import type {
    BenchmarkStrategyExecutor,
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
  
  function passingExecution() {
    return {
      criterionResults:
        trackHireInterviewDateBenchmark
          .acceptanceCriteria
          .map(
            (criterion) => ({
              criterionId:
                criterion.id,
  
              passed: true,
  
              evidence: [
                "passed",
              ],
            }),
          ),
  
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      },
  
      humanInterventions: 0,
    };
  }
  
  function createClock() {
    return {
      isoNow:
        vi.fn()
          .mockReturnValueOnce(
            "2026-10-17T00:00:00.000Z",
          )
          .mockReturnValueOnce(
            "2026-10-17T00:00:01.000Z",
          ),
  
      now:
        vi.fn()
          .mockReturnValueOnce(
            1000,
          )
          .mockReturnValueOnce(
            2000,
          ),
    };
  }
  
  function createWorkspaceManager() {
    return {
      create:
        vi.fn(
          async () => ({
            scenarioId:
              "trackhire-interview-date",
  
            runId:
              "held-out-run",
  
            strategyId:
              "sequential",
  
            baselineRevision:
              "abc123",
  
            path:
              "/tmp/held-out-workspace",
  
            branch:
              "factory/held-out-run",
          }),
        ),
    } as unknown as
      BenchmarkWorkspaceManager;
  }
  
  describe(
    "BenchmarkRunner held-out fixture lifecycle",
    () => {
      it(
        "installs protected fixtures only after strategy execution",
        async () => {
          const lifecycle:
            string[] = [];
  
          const executor:
            BenchmarkStrategyExecutor = {
            async execute() {
              lifecycle.push(
                "execute",
              );
  
              return passingExecution();
            },
          };
  
          const fixtureManager = {
            async install(
              _workspace:
                unknown,
  
              fixtures:
                Array<{
                  path: string;
                  content: string;
                }>,
            ) {
              lifecycle.push(
                "install",
              );
  
              return fixtures;
            },
  
            async assertUnchanged() {
              lifecycle.push(
                "assert",
              );
            },
          } as unknown as
            BenchmarkFixtureManager;
  
          const validator:
            Validator = {
            async validate() {
              lifecycle.push(
                "validate",
              );
  
              return {
                passed: true,
  
                checks: [],
  
                failedChecks: [],
  
                durationMs: 0,
              };
            },
          };
  
          const runner =
            new BenchmarkRunner(
              createWorkspaceManager(),
              undefined,
              createClock(),
              fixtureManager,
            );
  
          await runner.run({
            runId:
              "held-out-run",
  
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
  
            fixtures: [
              {
                path:
                  "test/protected_test.dart",
  
                content:
                  "protected",
              },
            ],
          });
  
          expect(
            lifecycle,
          ).toEqual([
            "execute",
            "install",
            "validate",
            "assert",
          ]);
        },
      );
  
      it(
        "does not install fixtures when a benchmark has none",
        async () => {
          const lifecycle:
            string[] = [];
  
          const fixtureManager = {
            install:
              vi.fn(),
  
            assertUnchanged:
              vi.fn(),
          } as unknown as
            BenchmarkFixtureManager;
  
          const executor:
            BenchmarkStrategyExecutor = {
            async execute() {
              lifecycle.push(
                "execute",
              );
  
              return passingExecution();
            },
          };
  
          const validator:
            Validator = {
            async validate() {
              lifecycle.push(
                "validate",
              );
  
              return {
                passed: true,
  
                checks: [],
  
                failedChecks: [],
  
                durationMs: 0,
              };
            },
          };
  
          const runner =
            new BenchmarkRunner(
              createWorkspaceManager(),
              undefined,
              createClock(),
              fixtureManager,
            );
  
          await runner.run({
            runId:
              "held-out-run",
  
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
            lifecycle,
          ).toEqual([
            "execute",
            "validate",
          ]);
  
          expect(
            fixtureManager.install,
          ).not.toHaveBeenCalled();
  
          expect(
            fixtureManager.assertUnchanged,
          ).not.toHaveBeenCalled();
        },
      );
  
      it(
        "does not expose fixture installation to the strategy executor",
        async () => {
          let installed =
            false;
  
          let installedDuringExecution:
            boolean | undefined;
  
          const fixtureManager = {
            async install(
              _workspace:
                unknown,
  
              fixtures:
                Array<{
                  path: string;
                  content: string;
                }>,
            ) {
              installed =
                true;
  
              return fixtures;
            },
  
            async assertUnchanged() {},
          } as unknown as
            BenchmarkFixtureManager;
  
          const executor:
            BenchmarkStrategyExecutor = {
            async execute() {
              installedDuringExecution =
                installed;
  
              return passingExecution();
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
  
          const runner =
            new BenchmarkRunner(
              createWorkspaceManager(),
              undefined,
              createClock(),
              fixtureManager,
            );
  
          await runner.run({
            runId:
              "held-out-run",
  
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
  
            fixtures: [
              {
                path:
                  "test/protected_test.dart",
  
                content:
                  "protected",
              },
            ],
          });
  
          expect(
            installedDuringExecution,
          ).toBe(false);
  
          expect(
            installed,
          ).toBe(true);
        },
      );
  
      it(
        "checks fixture integrity after deterministic validation",
        async () => {
          const lifecycle:
            string[] = [];
  
          const fixtureManager = {
            async install(
              _workspace:
                unknown,
  
              fixtures:
                Array<{
                  path: string;
                  content: string;
                }>,
            ) {
              lifecycle.push(
                "install",
              );
  
              return fixtures;
            },
  
            async assertUnchanged() {
              lifecycle.push(
                "assert",
              );
            },
          } as unknown as
            BenchmarkFixtureManager;
  
          const validator:
            Validator = {
            async validate() {
              lifecycle.push(
                "validate",
              );
  
              return {
                passed: true,
  
                checks: [],
  
                failedChecks: [],
  
                durationMs: 0,
              };
            },
          };
  
          const runner =
            new BenchmarkRunner(
              createWorkspaceManager(),
              undefined,
              createClock(),
              fixtureManager,
            );
  
          await runner.run({
            runId:
              "held-out-run",
  
            scenario:
              trackHireInterviewDateBenchmark,
  
            strategy:
              "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
  
            executor: {
              async execute() {
                lifecycle.push(
                  "execute",
                );
  
                return passingExecution();
              },
            },
  
            validator,
  
            fixtures: [
              {
                path:
                  "test/protected_test.dart",
  
                content:
                  "protected",
              },
            ],
          });
  
          expect(
            lifecycle,
          ).toEqual([
            "execute",
            "install",
            "validate",
            "assert",
          ]);
        },
      );
    },
  );