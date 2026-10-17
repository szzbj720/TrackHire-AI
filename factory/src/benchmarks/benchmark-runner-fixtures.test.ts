import {
    access,
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
  
  const fixturePath =
    "test/factory_benchmark_test.dart";
  
  const fixtureContent =
    "protected benchmark";
  
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
    } as unknown as
      BenchmarkWorkspaceManager;
  }
  
  function fixtures() {
    return [
      {
        path:
          fixturePath,
  
        content:
          fixtureContent,
      },
    ];
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
    "BenchmarkRunner held-out fixtures",
    () => {
      it(
        "keeps fixtures hidden during strategy execution and installs them before validation",
        async () => {
          const workspace =
            await createWorkspace();
  
          let visibleDuringExecution =
            true;
  
          let observedDuringValidation =
            "";
  
          const executor:
            BenchmarkStrategyExecutor = {
            async execute() {
              try {
                await access(
                  join(
                    workspace.path,
                    fixturePath,
                  ),
                );
              } catch {
                visibleDuringExecution =
                  false;
              }
  
              return passingExecution();
            },
          };
  
          const validator:
            Validator = {
            async validate():
              Promise<ValidationResult> {
              observedDuringValidation =
                await readFile(
                  join(
                    workspace.path,
                    fixturePath,
                  ),
                  "utf8",
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
  
              executor,
  
              validator,
  
              fixtures:
                fixtures(),
            });
  
          expect(
            visibleDuringExecution,
          ).toBe(false);
  
          expect(
            observedDuringValidation,
          ).toBe(
            fixtureContent,
          );
  
          expect(
            result.success,
          ).toBe(true);
        },
      );
  
      it(
        "overwrites a strategy-created file with the held-out fixture before validation",
        async () => {
          const workspace =
            await createWorkspace();
  
          const executor:
            BenchmarkStrategyExecutor = {
            async execute() {
              const {
                mkdir,
              } =
                await import(
                  "node:fs/promises"
                );
  
              const target =
                join(
                  workspace.path,
                  fixturePath,
                );
  
              await mkdir(
                join(
                  workspace.path,
                  "test",
                ),
                {
                  recursive: true,
                },
              );
  
              await writeFile(
                target,
                "strategy-created content",
                "utf8",
              );
  
              return passingExecution();
            },
          };
  
          let observedDuringValidation =
            "";
  
          const validator:
            Validator = {
            async validate():
              Promise<ValidationResult> {
              observedDuringValidation =
                await readFile(
                  join(
                    workspace.path,
                    fixturePath,
                  ),
                  "utf8",
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
  
            validator,
  
            fixtures:
              fixtures(),
          });
  
          expect(
            observedDuringValidation,
          ).toBe(
            fixtureContent,
          );
        },
      );
  
      it(
        "rejects validation that modifies the installed held-out fixture",
        async () => {
          const workspace =
            await createWorkspace();
  
          const validator:
            Validator = {
            async validate():
              Promise<ValidationResult> {
              await writeFile(
                join(
                  workspace.path,
                  fixturePath,
                ),
                "modified during validation",
                "utf8",
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
  
              executor: {
                async execute() {
                  return passingExecution();
                },
              },
  
              validator,
  
              fixtures:
                fixtures(),
            }),
          ).rejects.toThrow(
            "Protected benchmark fixture was modified: test/factory_benchmark_test.dart",
          );
        },
      );
  
      it(
        "rejects validation that deletes the installed held-out fixture",
        async () => {
          const workspace =
            await createWorkspace();
  
          const validator:
            Validator = {
            async validate():
              Promise<ValidationResult> {
              await rm(
                join(
                  workspace.path,
                  fixturePath,
                ),
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
  
              executor: {
                async execute() {
                  return passingExecution();
                },
              },
  
              validator,
  
              fixtures:
                fixtures(),
            }),
          ).rejects.toThrow(
            "Protected benchmark fixture is missing: test/factory_benchmark_test.dart",
          );
        },
      );
    },
  );