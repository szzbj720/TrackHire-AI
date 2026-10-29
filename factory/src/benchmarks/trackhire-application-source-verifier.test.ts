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
    TrackHireApplicationSourceVerifier,
  } from "./trackhire-application-source-verifier.js";
  
  import {
    trackHireApplicationSourceBenchmark,
  } from "./trackhire-application-source.js";
  
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
        "trackhire-application-source",
  
      runId:
        "run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path:
        "/tmp/trackhire-application-source",
  
      branch:
        "factory/benchmark-application-source-run-001",
    };
  
  const task:
    EngineeringTask = {
      id:
        "trackhire-application-source-run-001",
  
      request:
        trackHireApplicationSourceBenchmark.task,
  
      status:
        "TASK_CREATED",
  
      requirements: [],
  
      acceptanceCriteria: [],
  
      constraints: [],
  
      repairAttempts: 0,
  
      createdAt:
        "2026-10-29T00:00:00.000Z",
  
      updatedAt:
        "2026-10-29T00:00:00.000Z",
    };
  
  function passingResults():
    BenchmarkCommandResult[] {
    return [
      commandResult(
        "flutter",
        [
          "test",
          "test/factory_benchmark_application_source_test.dart",
          "--plain-name",
          "optional-source",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          "test/factory_benchmark_application_source_test.dart",
          "--plain-name",
          "serialize-source",
        ],
      ),
  
      commandResult(
        "node",
        [
          "backend/factory_benchmark_application_source_test.js",
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
    "TrackHireApplicationSourceVerifier",
    () => {
      it("returns every acceptance criterion in scenario order", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        const results =
          await verifier.verify({
            scenario:
              trackHireApplicationSourceBenchmark,
            workspace,
            task,
          });
  
        expect(
          results.map(
            (result) =>
              result.criterionId,
          ),
        ).toEqual([
          "optional-source",
          "serialize-source",
          "create-source",
          "update-source",
          "reload-source",
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
        ).toHaveLength(5);
      });
  
      it("uses the protected Dart fixture for model criteria", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        await verifier.verify({
          scenario:
            trackHireApplicationSourceBenchmark,
          workspace,
          task,
        });
  
        expect(
          runner.calls[0],
        ).toEqual({
          command:
            "flutter",
  
          args: [
            "test",
            "test/factory_benchmark_application_source_test.dart",
            "--plain-name",
            "optional-source",
          ],
  
          cwd:
            workspace.path,
        });
  
        expect(
          runner.calls[1],
        ).toEqual({
          command:
            "flutter",
  
          args: [
            "test",
            "test/factory_benchmark_application_source_test.dart",
            "--plain-name",
            "serialize-source",
          ],
  
          cwd:
            workspace.path,
        });
      });
  
      it("uses the protected backend fixture for persistence criteria", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        await verifier.verify({
          scenario:
            trackHireApplicationSourceBenchmark,
          workspace,
          task,
        });
  
        expect(
          runner.calls[2],
        ).toEqual({
          command:
            "node",
  
          args: [
            "backend/factory_benchmark_application_source_test.js",
          ],
  
          cwd:
            workspace.path,
        });
      });
  
      it("maps a backend failure to all backend persistence criteria", async () => {
        const results =
          passingResults();
  
        results[2] =
          commandResult(
            "node",
            [
              "backend/factory_benchmark_application_source_test.js",
            ],
            1,
          );
  
        const runner =
          new FakeCommandRunner(
            results,
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        const verification =
          await verifier.verify({
            scenario:
              trackHireApplicationSourceBenchmark,
            workspace,
            task,
          });
  
        expect(
          verification,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              criterionId:
                "optional-source",
              passed: true,
            }),
  
            expect.objectContaining({
              criterionId:
                "serialize-source",
              passed: true,
            }),
  
            expect.objectContaining({
              criterionId:
                "create-source",
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "update-source",
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "reload-source",
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "regression",
              passed: true,
            }),
          ]),
        );
      });
  
      it("keeps regression checks separate", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        await verifier.verify({
          scenario:
            trackHireApplicationSourceBenchmark,
          workspace,
          task,
        });
  
        expect(
          runner.calls[3],
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
          runner.calls[4],
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
      });
  
      it("rejects a different benchmark scenario", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireApplicationSourceVerifier(
            runner,
          );
  
        await expect(
          verifier.verify({
            scenario: {
              ...trackHireApplicationSourceBenchmark,
              id:
                "different-scenario",
            },
  
            workspace,
            task,
          }),
        ).rejects.toThrow(
          "TrackHire application-source verifier cannot verify scenario: different-scenario",
        );
  
        expect(
          runner.calls,
        ).toHaveLength(0);
      });
    },
  );