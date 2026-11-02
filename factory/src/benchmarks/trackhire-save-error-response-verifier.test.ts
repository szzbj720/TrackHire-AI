import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";

import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";

import { trackHireSaveErrorResponseBenchmark } from "./trackhire-save-error-response.js";

import { TrackHireSaveErrorResponseVerifier } from "./trackhire-save-error-response-verifier.js";

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
  scenarioId:
    "trackhire-save-error-response",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path: "/tmp/factorybench-save-error-response",
  branch:
    "benchmark-save-error-response",
};

const task: EngineeringTask = {
  id: "task-test-run",
  request:
    trackHireSaveErrorResponseBenchmark.task,
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
    { length: 6 },
    () => commandResult(0),
  );
}

describe(
  "TrackHireSaveErrorResponseVerifier",
  () => {
    it("returns criteria in scenario order when everything passes", async () => {
      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          new FakeCommandRunner(
            passingResults(),
          ),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSaveErrorResponseBenchmark,
          task,
          workspace,
        });

      expect(
        result.map(
          (criterion) =>
            criterion.criterionId,
        ),
      ).toEqual([
        "save-fetch-error-response",
        "save-success-contract",
        "save-not-found-contract",
        "regression",
      ]);

      expect(
        result.every(
          (criterion) =>
            criterion.passed,
        ),
      ).toBe(true);
    });

    it("scores backend contracts independently", async () => {
      const results = passingResults();

      results[0] = commandResult(
        1,
        "",
        "saved-status route references an invalid response identifier",
      );

      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSaveErrorResponseBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "save-fetch-error-response",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "save-success-contract",
        )?.passed,
      ).toBe(true);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "save-not-found-contract",
        )?.passed,
      ).toBe(true);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "regression",
        )?.passed,
      ).toBe(true);
    });

    it("runs each protected backend criterion separately", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireSaveErrorResponseBenchmark,
        task,
        workspace,
      });

      const backendCalls =
        runner.calls.filter(
          (call) =>
            call.command === "node" &&
            call.args[0] ===
              "backend/factory_benchmark_save_error_response_test.js",
        );

      expect(
        backendCalls.map(
          (call) => call.args[1],
        ),
      ).toEqual([
        "save-fetch-error-response",
        "save-success-contract",
        "save-not-found-contract",
      ]);
    });

    it("runs backend and Flutter regression checks", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireSaveErrorResponseBenchmark,
        task,
        workspace,
      });

      expect(
        runner.calls,
      ).toContainEqual({
        command: "node",
        args: [
          "--check",
          "backend/server.js",
        ],
        cwd: workspace.path,
      });

      expect(
        runner.calls,
      ).toContainEqual({
        command: "flutter",
        args: [
          "analyze",
          "lib",
        ],
        cwd: workspace.path,
      });

      expect(
        runner.calls,
      ).toContainEqual({
        command: "flutter",
        args: [
          "test",
          "test/job_application_test.dart",
        ],
        cwd: workspace.path,
      });
    });

    it("fails regression when a regression command fails", async () => {
      const results = passingResults();

      results[3] = commandResult(
        1,
        "",
        "backend syntax failed",
      );

      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireSaveErrorResponseBenchmark,
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

    it("rejects a different benchmark scenario", async () => {
      const verifier =
        new TrackHireSaveErrorResponseVerifier(
          new FakeCommandRunner([]),
        );

      await expect(
        verifier.verify({
          scenario: {
            ...trackHireSaveErrorResponseBenchmark,
            id: "different-scenario",
          },
          task,
          workspace,
        }),
      ).rejects.toThrow(
        "TrackHireSaveErrorResponseVerifier cannot verify scenario different-scenario.",
      );
    });
  },
);
