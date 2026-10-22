import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    BenchmarkCommandResult,
    BenchmarkCommandRunner,
  } from "./trackhire-interview-date-verifier.js";
  
  import {
    TrackHireStatusSummaryVerifier,
  } from "./trackhire-status-summary-verifier.js";
  
  import {
    trackHireStatusSummaryBenchmark,
  } from "./trackhire-status-summary.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  class FakeCommandRunner
    implements BenchmarkCommandRunner {
    readonly calls: {
      command: string;
      args: string[];
      cwd: string;
    }[] = [];
  
    constructor(
      private readonly results:
        BenchmarkCommandResult[],
    ) {}
  
    async run(
      command: string,
      args: string[],
      cwd: string,
    ): Promise<BenchmarkCommandResult> {
      this.calls.push({
        command,
        args,
        cwd,
      });
  
      const result =
        this.results[
          this.calls.length - 1
        ];
  
      if (!result) {
        throw new Error(
          "No fake command result configured.",
        );
      }
  
      return result;
    }
  }
  
  function commandResult(
    command: string,
    args: string[],
    exitCode = 0,
  ): BenchmarkCommandResult {
    return {
      command,
      args,
      exitCode,
  
      stdout:
        exitCode === 0
          ? "passed"
          : "",
  
      stderr:
        exitCode === 0
          ? ""
          : "failed",
    };
  }
  
  const workspace:
    BenchmarkWorkspace = {
      scenarioId:
        "trackhire-status-summary",
  
      runId:
        "run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path:
        "/tmp/trackhire-status-summary",
  
      branch:
        "factory/benchmark-status-summary-run-001",
    };
  
  const task:
    EngineeringTask = {
      id:
        "trackhire-status-summary-run-001",
  
      request:
        trackHireStatusSummaryBenchmark.task,
  
      status:
        "TASK_CREATED",
  
      requirements:
        [],
  
      acceptanceCriteria:
        [],
  
      constraints:
        [],
  
      repairAttempts: 0,
  
      createdAt:
        "2026-10-22T00:00:00.000Z",
  
      updatedAt:
        "2026-10-22T00:00:00.000Z",
    };
  
  function passingResults():
    BenchmarkCommandResult[] {
    const benchmarkPath =
      "test/factory_benchmark_status_summary_test.dart";
  
    return [
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "counts-statuses",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "zero-counts",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "updates-summary",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "all-statuses",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "analyze",
          "lib",
          "backend",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          "test/job_application_test.dart",
        ],
      ),
    ];
  }
  
  describe(
    "TrackHireStatusSummaryVerifier",
    () => {
      it(
        "runs each feature criterion independently",
        async () => {
          const runner =
            new FakeCommandRunner(
              passingResults(),
            );
  
          const verifier =
            new TrackHireStatusSummaryVerifier(
              runner,
            );
  
          const results =
            await verifier.verify({
              scenario:
                trackHireStatusSummaryBenchmark,
  
              workspace,
  
              task,
            });
  
          expect(
            results.map(
              (result) =>
                result.criterionId,
            ),
          ).toEqual([
            "counts-statuses",
            "zero-counts",
            "updates-summary",
            "all-statuses",
            "regression",
          ]);
  
          expect(
            results.every(
              (result) =>
                result.passed,
            ),
          ).toBe(true);
  
          expect(
            runner.calls,
          ).toHaveLength(6);
        },
      );
  
      it(
        "uses the protected fixture for every feature criterion",
        async () => {
          const runner =
            new FakeCommandRunner(
              passingResults(),
            );
  
          const verifier =
            new TrackHireStatusSummaryVerifier(
              runner,
            );
  
          await verifier.verify({
            scenario:
              trackHireStatusSummaryBenchmark,
  
            workspace,
  
            task,
          });
  
          const featureCalls =
            runner.calls.slice(
              0,
              4,
            );
  
          for (
            const call
            of featureCalls
          ) {
            expect(
              call.command,
            ).toBe(
              "flutter",
            );
  
            expect(
              call.args[0],
            ).toBe(
              "test",
            );
  
            expect(
              call.args[1],
            ).toBe(
              "test/factory_benchmark_status_summary_test.dart",
            );
  
            expect(
              call.args[2],
            ).toBe(
              "--plain-name",
            );
  
            expect(
              call.cwd,
            ).toBe(
              workspace.path,
            );
          }
        },
      );
  
      it(
        "maps a feature failure only to its own criterion",
        async () => {
          const results =
            passingResults();
  
          results[2] =
            commandResult(
              "flutter",
              [
                "test",
                "test/factory_benchmark_status_summary_test.dart",
                "--plain-name",
                "updates-summary",
              ],
              1,
            );
  
          const runner =
            new FakeCommandRunner(
              results,
            );
  
          const verifier =
            new TrackHireStatusSummaryVerifier(
              runner,
            );
  
          const verification =
            await verifier.verify({
              scenario:
                trackHireStatusSummaryBenchmark,
  
              workspace,
  
              task,
            });
  
          expect(
            verification,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                criterionId:
                  "counts-statuses",
  
                passed: true,
              }),
  
              expect.objectContaining({
                criterionId:
                  "zero-counts",
  
                passed: true,
              }),
  
              expect.objectContaining({
                criterionId:
                  "updates-summary",
  
                passed: false,
              }),
  
              expect.objectContaining({
                criterionId:
                  "all-statuses",
  
                passed: true,
              }),
            ]),
          );
        },
      );
  
      it(
        "keeps regression analysis separate from the protected fixture",
        async () => {
          const runner =
            new FakeCommandRunner(
              passingResults(),
            );
  
          const verifier =
            new TrackHireStatusSummaryVerifier(
              runner,
            );
  
          const verification =
            await verifier.verify({
              scenario:
                trackHireStatusSummaryBenchmark,
  
              workspace,
  
              task,
            });
  
          const regression =
            verification.find(
              (result) =>
                result.criterionId ===
                "regression",
            );
  
          expect(
            regression?.passed,
          ).toBe(true);
  
          expect(
            runner.calls[4],
          ).toEqual({
            command:
              "flutter",
  
            args: [
              "analyze",
              "lib",
              "backend",
            ],
  
            cwd:
              workspace.path,
          });
  
          expect(
            runner.calls[5],
          ).toEqual({
            command:
              "flutter",
  
            args: [
              "test",
              "test/job_application_test.dart",
            ],
  
            cwd:
              workspace.path,
          });
        },
      );
  
      it(
        "rejects a different benchmark scenario",
        async () => {
          const runner =
            new FakeCommandRunner(
              passingResults(),
            );
  
          const verifier =
            new TrackHireStatusSummaryVerifier(
              runner,
            );
  
          await expect(
            verifier.verify({
              scenario: {
                ...trackHireStatusSummaryBenchmark,
  
                id:
                  "different-scenario",
              },
  
              workspace,
  
              task,
            }),
          ).rejects.toThrow(
            "TrackHire status-summary verifier cannot verify scenario: different-scenario",
          );
  
          expect(
            runner.calls,
          ).toHaveLength(0);
        },
      );
    },
  );