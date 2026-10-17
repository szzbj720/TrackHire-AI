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
    TrackHireInterviewDateVerifier,
  } from "./trackhire-interview-date-verifier.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
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
        "trackhire-interview-date",
  
      runId:
        "run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path:
        "/tmp/trackhire-benchmark",
  
      branch:
        "factory/benchmark-run-001",
    };
  
  const task:
    EngineeringTask = {
      id:
        "trackhire-interview-date-run-001",
  
      request:
        trackHireInterviewDateBenchmark.task,
  
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
        "2026-10-17T00:00:00.000Z",
  
      updatedAt:
        "2026-10-17T00:00:00.000Z",
    };
  
  function passingResults():
    BenchmarkCommandResult[] {
    const benchmarkPath =
      "test/factory_benchmark_interview_date_test.dart";
  
    return [
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "optional-date",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "persist-date",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "upcoming-interviews",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
          benchmarkPath,
          "--plain-name",
          "edit-date",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "analyze",
        ],
      ),
  
      commandResult(
        "flutter",
        [
          "test",
        ],
      ),
    ];
  }
  
  describe(
    "TrackHireInterviewDateVerifier",
    () => {
      it("runs each feature criterion independently", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        const results =
          await verifier.verify({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace,
  
            task,
          });
  
        expect(
          results.map(
            (result) =>
              result.criterionId,
          ),
        ).toEqual([
          "optional-date",
          "persist-date",
          "upcoming-interviews",
          "edit-date",
          "regression",
        ]);
  
        expect(
          runner.calls,
        ).toHaveLength(6);
      });
  
      it("uses the protected fixture for every feature criterion", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        await verifier.verify({
          scenario:
            trackHireInterviewDateBenchmark,
  
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
            "test/factory_benchmark_interview_date_test.dart",
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
      });
  
      it("maps a feature failure only to its own criterion", async () => {
        const results =
          passingResults();
  
        results[2] =
          commandResult(
            "flutter",
            [
              "test",
              "test/factory_benchmark_interview_date_test.dart",
              "--plain-name",
              "upcoming-interviews",
            ],
            1,
          );
  
        const runner =
          new FakeCommandRunner(
            results,
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        const verification =
          await verifier.verify({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace,
  
            task,
          });
  
        expect(
          verification,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              criterionId:
                "optional-date",
  
              passed: true,
            }),
  
            expect.objectContaining({
              criterionId:
                "persist-date",
  
              passed: true,
            }),
  
            expect.objectContaining({
              criterionId:
                "upcoming-interviews",
  
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "edit-date",
  
              passed: true,
            }),
          ]),
        );
      });
  
      it("requires both analyze and the full test suite for regression", async () => {
        const results =
          passingResults();
  
        results[4] =
          commandResult(
            "flutter",
            [
              "analyze",
            ],
            1,
          );
  
        const runner =
          new FakeCommandRunner(
            results,
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        const verification =
          await verifier.verify({
            scenario:
              trackHireInterviewDateBenchmark,
  
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
        ).toBe(false);
  
        expect(
          runner.calls[5],
        ).toEqual({
          command:
            "flutter",
  
          args: [
            "test",
          ],
  
          cwd:
            workspace.path,
        });
      });
  
      it("records command evidence for a failed criterion", async () => {
        const results =
          passingResults();
  
        results[0] = {
          command:
            "flutter",
  
          args: [
            "test",
            "test/factory_benchmark_interview_date_test.dart",
            "--plain-name",
            "optional-date",
          ],
  
          exitCode: 1,
  
          stdout: "",
  
          stderr:
            "interviewDate is not defined",
        };
  
        const runner =
          new FakeCommandRunner(
            results,
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        const verification =
          await verifier.verify({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace,
  
            task,
          });
  
        const optionalDate =
          verification.find(
            (result) =>
              result.criterionId ===
              "optional-date",
          );
  
        expect(
          optionalDate?.passed,
        ).toBe(false);
  
        expect(
          optionalDate?.evidence,
        ).toEqual(
          expect.arrayContaining([
            "Exit code: 1",
            "stderr: interviewDate is not defined",
          ]),
        );
      });
  
      it("rejects a different benchmark scenario", async () => {
        const runner =
          new FakeCommandRunner(
            passingResults(),
          );
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        await expect(
          verifier.verify({
            scenario: {
              ...trackHireInterviewDateBenchmark,
  
              id:
                "different-scenario",
            },
  
            workspace,
  
            task,
          }),
        ).rejects.toThrow(
          "TrackHire interview-date verifier cannot verify scenario: different-scenario",
        );
  
        expect(
          runner.calls,
        ).toHaveLength(0);
      });
    },
  );