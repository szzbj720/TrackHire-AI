import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import { trackHireSearchWhitespaceBenchmark } from "./trackhire-search-whitespace.js";
import { TrackHireSearchWhitespaceVerifier } from "./trackhire-search-whitespace-verifier.js";
import type {
  BenchmarkCommandResult,
  BenchmarkCommandRunner,
} from "./trackhire-interview-date-verifier.js";

class FakeCommandRunner
  implements BenchmarkCommandRunner
{
  readonly calls: Array<{
    command: string;
    args: string[];
    cwd: string;
  }> = [];

  constructor(
    private readonly results: BenchmarkCommandResult[],
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
      this.results[this.calls.length - 1];

    if (!result) {
      throw new Error(
        `No fake command result configured for call ${this.calls.length}.`,
      );
    }

    return result;
  }
}

function commandResult(
  exitCode: number,
  stdout = "",
  stderr = "",
): BenchmarkCommandResult {
  return {
    command: "fake",
    args: [],
    exitCode,
    stdout,
    stderr,
  };
}

const workspace: BenchmarkWorkspace = {
  scenarioId: "trackhire-search-whitespace",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path: "/tmp/factorybench-search-whitespace",
  branch: "benchmark-search-whitespace",
};

const task: EngineeringTask = {
  id: "task-test-run",
  request:
    trackHireSearchWhitespaceBenchmark.task,
  status: "TASK_CREATED",
  requirements: [],
  acceptanceCriteria: [],
  constraints: [],
  repairAttempts: 0,
  createdAt: "2026-10-30T00:00:00.000Z",
  updatedAt: "2026-10-30T00:00:00.000Z",
};

function passingResults(): BenchmarkCommandResult[] {
  return Array.from(
    { length: 7 },
    () => commandResult(0),
  );
}

describe(
  "TrackHireSearchWhitespaceVerifier",
  () => {
    it("returns criteria in scenario order when everything passes", async () => {
      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          new FakeCommandRunner(
            passingResults(),
          ),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSearchWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.map(
          (criterion) =>
            criterion.criterionId,
        ),
      ).toEqual([
        "trim-search-whitespace",
        "case-insensitive-search",
        "searchable-fields",
        "combined-filters",
        "clear-search",
        "regression",
      ]);

      expect(
        result.every(
          (criterion) =>
            criterion.passed,
        ),
      ).toBe(true);
    });

    it("runs each held-out fixture group separately", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireSearchWhitespaceBenchmark,
        task,
        workspace,
      });

      expect(
        runner.calls.slice(0, 5),
      ).toEqual([
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_search_whitespace_test.dart",
            "--plain-name",
            "trim-search-whitespace",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_search_whitespace_test.dart",
            "--plain-name",
            "case-insensitive-search",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_search_whitespace_test.dart",
            "--plain-name",
            "searchable-fields",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_search_whitespace_test.dart",
            "--plain-name",
            "combined-filters",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_search_whitespace_test.dart",
            "--plain-name",
            "clear-search",
          ],
          cwd: workspace.path,
        },
      ]);
    });

    it("reports whitespace normalization failure independently", async () => {
      const results =
        passingResults();

      results[0] =
        commandResult(
          1,
          "",
          "whitespace search failed",
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSearchWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "trim-search-whitespace",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "case-insensitive-search",
        )?.passed,
      ).toBe(true);
    });

    it("reports combined-filter failure independently", async () => {
      const results =
        passingResults();

      results[3] =
        commandResult(
          1,
          "",
          "combined filtering failed",
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSearchWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "combined-filters",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "clear-search",
        )?.passed,
      ).toBe(true);
    });

    it("runs Flutter analysis and existing tests as regression checks", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireSearchWhitespaceBenchmark,
        task,
        workspace,
      });

      expect(
        runner.calls[5],
      ).toEqual({
        command: "flutter",
        args: [
          "analyze",
          "lib",
        ],
        cwd: workspace.path,
      });

      expect(
        runner.calls[6],
      ).toEqual({
        command: "flutter",
        args: [
          "test",
          "test/job_application_test.dart",
        ],
        cwd: workspace.path,
      });
    });

    it("fails regression when Flutter analysis fails", async () => {
      const results =
        passingResults();

      results[5] =
        commandResult(
          1,
          "",
          "analysis failed",
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSearchWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "regression",
        )?.passed,
      ).toBe(false);
    });

    it("fails regression when existing tests fail", async () => {
      const results =
        passingResults();

      results[6] =
        commandResult(
          1,
          "",
          "existing test failed",
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSearchWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "regression",
        )?.passed,
      ).toBe(false);
    });

    it("rejects the wrong scenario without running commands", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireSearchWhitespaceVerifier(
          runner,
        );

      await expect(
        verifier.verify({
          scenario: {
            ...trackHireSearchWhitespaceBenchmark,
            id: "wrong-scenario",
          },
          task,
          workspace,
        }),
      ).rejects.toThrow(
        "TrackHireSearchWhitespaceVerifier cannot verify scenario wrong-scenario.",
      );

      expect(
        runner.calls,
      ).toHaveLength(0);
    });
  },
);
