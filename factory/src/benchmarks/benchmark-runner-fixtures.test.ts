import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
  } from "node:fs/promises";
  
  import {
    join,
  } from "node:path";
  
  import {
    tmpdir,
  } from "node:os";
  
  import {
    afterEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    BenchmarkRunner,
    type BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  import type {
    BenchmarkWorkspace,
    BenchmarkWorkspaceManager,
  } from "./benchmark-workspace-manager.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  const temporaryDirectories:
    string[] = [];
  
  class PassingValidator
    implements Validator {
    async validate():
      Promise<ValidationResult> {
      return {
        passed: true,
  
        checks: [
          {
            name:
              "benchmark",
  
            command:
              "flutter",
  
            args: [
              "test",
            ],
  
            exitCode: 0,
  
            stdout:
              "passed",
  
            stderr: "",
  
            durationMs: 1,
  
            passed: true,
          },
        ],
  
        failedChecks: [],
  
        durationMs: 1,
      };
    }
  }
  
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
                "deterministic evidence",
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
  
  async function createWorkspace():
    Promise<BenchmarkWorkspace> {
    const path =
      await mkdtemp(
        join(
          tmpdir(),
          "benchmark-runner-fixture-",
        ),
      );
  
    temporaryDirectories.push(
      path,
    );
  
    return {
      scenarioId:
        "trackhire-interview-date",
  
      runId:
        "run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path,
  
      branch:
        "factory/benchmark-run-001",
    };
  }
  
  function createWorkspaceManager(
    workspace: BenchmarkWorkspace,
  ): BenchmarkWorkspaceManager {
    return {
      create:
        vi.fn().mockResolvedValue(
          workspace,
        ),
    } as unknown as BenchmarkWorkspaceManager;
  }
  
  function createExecutor():
    BenchmarkStrategyExecutor {
    return {
      async execute() {
        return passingExecution();
      },
    };
  }
  
  afterEach(
    async () => {
      for (
        const directory
        of temporaryDirectories.splice(
          0,
        )
      ) {
        await rm(
          directory,
          {
            recursive: true,
            force: true,
          },
        );
      }
    },
  );
  
  describe(
    "BenchmarkRunner protected fixtures",
    () => {
      it("installs fixtures before strategy execution", async () => {
        const workspace =
          await createWorkspace();
  
        let observedFixture = "";
  
        const executor:
          BenchmarkStrategyExecutor = {
            async execute() {
              observedFixture =
                await readFile(
                  join(
                    workspace.path,
                    "test/factory_benchmark_test.dart",
                  ),
                  "utf8",
                );
  
              return passingExecution();
            },
          };
  
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(
              workspace,
            ),
          );
  
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
  
          validator:
            new PassingValidator(),
  
          fixtures: [
            {
              path:
                "test/factory_benchmark_test.dart",
  
              content:
                "protected benchmark",
            },
          ],
        });
  
        expect(
          observedFixture,
        ).toBe(
          "protected benchmark",
        );
      });
  
      it("rejects a strategy that modifies a protected fixture", async () => {
        const workspace =
          await createWorkspace();
  
        const executor:
          BenchmarkStrategyExecutor = {
            async execute() {
              await writeFile(
                join(
                  workspace.path,
                  "test/factory_benchmark_test.dart",
                ),
                "weakened benchmark",
                "utf8",
              );
  
              return passingExecution();
            },
          };
  
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(
              workspace,
            ),
          );
  
        await expect(
          runner.run({
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
  
            validator:
              new PassingValidator(),
  
            fixtures: [
              {
                path:
                  "test/factory_benchmark_test.dart",
  
                content:
                  "protected benchmark",
              },
            ],
          }),
        ).rejects.toThrow(
          "Protected benchmark fixture was modified: test/factory_benchmark_test.dart",
        );
      });
  
      it("rejects a strategy that deletes a protected fixture", async () => {
        const workspace =
          await createWorkspace();
  
        const executor:
          BenchmarkStrategyExecutor = {
            async execute() {
              await rm(
                join(
                  workspace.path,
                  "test/factory_benchmark_test.dart",
                ),
              );
  
              return passingExecution();
            },
          };
  
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(
              workspace,
            ),
          );
  
        await expect(
          runner.run({
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
  
            validator:
              new PassingValidator(),
  
            fixtures: [
              {
                path:
                  "test/factory_benchmark_test.dart",
  
                content:
                  "protected benchmark",
              },
            ],
          }),
        ).rejects.toThrow(
          "Protected benchmark fixture is missing: test/factory_benchmark_test.dart",
        );
      });
  
      it("allows an unchanged protected fixture to reach validation", async () => {
        const workspace =
          await createWorkspace();
  
        const runner =
          new BenchmarkRunner(
            createWorkspaceManager(
              workspace,
            ),
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
              new PassingValidator(),
  
            fixtures: [
              {
                path:
                  "test/factory_benchmark_test.dart",
  
                content:
                  "protected benchmark",
              },
            ],
          });
  
        expect(
          result.validation.passed,
        ).toBe(true);
  
        expect(
          result.success,
        ).toBe(true);
      });
    },
  );