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
    EngineeringTask,
  } from "../schemas/task.js";
  
  class FakeCommandRunner
    implements BenchmarkCommandRunner {
    calls: Array<{
      command: string;
      args: string[];
      cwd: string;
    }> = [];
  
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
        this.results.shift();
  
      if (!result) {
        throw new Error(
          "No fake command result available.",
        );
      }
  
      return result;
    }
  }
  
  function passingResult(
    args: string[],
  ): BenchmarkCommandResult {
    return {
      command:
        "flutter",
  
      args,
  
      exitCode: 0,
  
      stdout:
        "Passed.",
  
      stderr: "",
    };
  }
  
  function failingResult(
    args: string[],
  ): BenchmarkCommandResult {
    return {
      command:
        "flutter",
  
      args,
  
      exitCode: 1,
  
      stdout: "",
  
      stderr:
        "Deterministic failure.",
    };
  }
  
  function createTask():
    EngineeringTask {
    return {
      id:
        "trackhire-interview-date-run-001",
  
      request:
        trackHireInterviewDateBenchmark
          .task,
  
      status:
        "REVIEWING",
  
      requirements:
        trackHireInterviewDateBenchmark
          .acceptanceCriteria
          .map(
            (criterion) =>
              criterion.description,
          ),
  
      acceptanceCriteria:
        trackHireInterviewDateBenchmark
          .acceptanceCriteria
          .map(
            (criterion) =>
              criterion.verification,
          ),
  
      constraints: [],
  
      repairAttempts: 0,
  
      createdAt:
        "2026-10-16T21:00:00.000Z",
  
      updatedAt:
        "2026-10-16T21:00:00.000Z",
    };
  }
  
  function createInput() {
    return {
      scenario:
        trackHireInterviewDateBenchmark,
  
      workspace: {
        scenarioId:
          "trackhire-interview-date",
  
        runId:
          "benchmark-run-001",
  
        strategyId:
          "sequential",
  
        baselineRevision:
          "abc123",
  
        path:
          "/tmp/trackhire-benchmark",
  
        branch:
          "factory/benchmark-sequential",
      },
  
      task:
        createTask(),
    };
  }
  
  describe(
    "TrackHireInterviewDateVerifier",
    () => {
      it("runs benchmark behavior, analysis, and full regression tests in the benchmark workspace", async () => {
        const runner =
          new FakeCommandRunner([
            passingResult([
              "test",
              "test/benchmark_interview_date_test.dart",
            ]),
  
            passingResult([
              "analyze",
            ]),
  
            passingResult([
              "test",
            ]),
          ]);
  
        const verifier =
          new TrackHireInterviewDateVerifier(
            runner,
          );
  
        await verifier.verify(
          createInput(),
        );
  
        expect(
          runner.calls,
        ).toEqual([
          {
            command:
              "flutter",
  
            args: [
              "test",
              "test/benchmark_interview_date_test.dart",
            ],
  
            cwd:
              "/tmp/trackhire-benchmark",
          },
  
          {
            command:
              "flutter",
  
            args: [
              "analyze",
            ],
  
            cwd:
              "/tmp/trackhire-benchmark",
          },
  
          {
            command:
              "flutter",
  
            args: [
              "test",
            ],
  
            cwd:
              "/tmp/trackhire-benchmark",
          },
        ]);
      });
  
      it("passes all criteria when deterministic behavior and regression checks pass", async () => {
        const verifier =
          new TrackHireInterviewDateVerifier(
            new FakeCommandRunner([
              passingResult([
                "test",
                "test/benchmark_interview_date_test.dart",
              ]),
  
              passingResult([
                "analyze",
              ]),
  
              passingResult([
                "test",
              ]),
            ]),
          );
  
        const results =
          await verifier.verify(
            createInput(),
          );
  
        expect(
          results.map(
            (result) => ({
              criterionId:
                result.criterionId,
  
              passed:
                result.passed,
            }),
          ),
        ).toEqual([
          {
            criterionId:
              "optional-date",
  
            passed: true,
          },
  
          {
            criterionId:
              "persist-date",
  
            passed: true,
          },
  
          {
            criterionId:
              "edit-date",
  
            passed: true,
          },
  
          {
            criterionId:
              "upcoming-interviews",
  
            passed: true,
          },
  
          {
            criterionId:
              "regression",
  
            passed: true,
          },
        ]);
      });
  
      it("fails feature criteria when the dedicated benchmark behavior test fails", async () => {
        const verifier =
          new TrackHireInterviewDateVerifier(
            new FakeCommandRunner([
              failingResult([
                "test",
                "test/benchmark_interview_date_test.dart",
              ]),
  
              passingResult([
                "analyze",
              ]),
  
              passingResult([
                "test",
              ]),
            ]),
          );
  
        const results =
          await verifier.verify(
            createInput(),
          );
  
        expect(
          results
            .slice(0, 4)
            .every(
              (result) =>
                !result.passed,
            ),
        ).toBe(true);
  
        expect(
          results[4]?.passed,
        ).toBe(true);
      });
  
      it("fails regression when flutter analyze fails", async () => {
        const verifier =
          new TrackHireInterviewDateVerifier(
            new FakeCommandRunner([
              passingResult([
                "test",
                "test/benchmark_interview_date_test.dart",
              ]),
  
              failingResult([
                "analyze",
              ]),
  
              passingResult([
                "test",
              ]),
            ]),
          );
  
        const results =
          await verifier.verify(
            createInput(),
          );
  
        const regression =
          results.find(
            (result) =>
              result.criterionId ===
              "regression",
          );
  
        expect(
          regression?.passed,
        ).toBe(false);
  
        expect(
          regression?.evidence.some(
            (evidence) =>
              evidence.includes(
                "flutter analyze failed",
              ),
          ),
        ).toBe(true);
      });
  
      it("fails regression when the full Flutter test suite fails", async () => {
        const verifier =
          new TrackHireInterviewDateVerifier(
            new FakeCommandRunner([
              passingResult([
                "test",
                "test/benchmark_interview_date_test.dart",
              ]),
  
              passingResult([
                "analyze",
              ]),
  
              failingResult([
                "test",
              ]),
            ]),
          );
  
        const results =
          await verifier.verify(
            createInput(),
          );
  
        const regression =
          results.find(
            (result) =>
              result.criterionId ===
              "regression",
          );
  
        expect(
          regression?.passed,
        ).toBe(false);
      });
  
      it("rejects use with a different benchmark scenario", async () => {
        const verifier =
          new TrackHireInterviewDateVerifier(
            new FakeCommandRunner([]),
          );
  
        await expect(
          verifier.verify({
            ...createInput(),
  
            scenario: {
              ...trackHireInterviewDateBenchmark,
  
              id:
                "different-scenario",
            },
          }),
        ).rejects.toThrow(
          "TrackHireInterviewDateVerifier cannot verify scenario different-scenario.",
        );
      });
    },
  );