import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import {
  TrackHireAiStaleStateVerifier,
} from "./trackhire-ai-stale-state-verifier.js";
import { trackHireAiStaleStateBenchmark } from "./trackhire-ai-stale-state.js";
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
  scenarioId: "trackhire-ai-stale-state",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path: "/tmp/factorybench-ai-stale-state",
  branch: "benchmark-ai-stale-state",
};

const task: EngineeringTask = {
  id: "task-test-run",
  request: trackHireAiStaleStateBenchmark.task,
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
    { length: 8 },
    () => commandResult(0),
  );
}

describe("TrackHireAiStaleStateVerifier", () => {
  it("returns criteria in scenario order when everything passes", async () => {
    const runner =
      new FakeCommandRunner(
        passingResults(),
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        runner,
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
        task,
        workspace,
      });

    expect(
      result.map(
        (criterion) =>
          criterion.criterionId,
      ),
    ).toEqual([
      "clear-stale-analysis",
      "analysis-validation",
      "clear-stale-resume",
      "resume-validation",
      "successful-results",
      "clear-analysis",
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
      new TrackHireAiStaleStateVerifier(
        runner,
      );

    await verifier.verify({
      scenario:
        trackHireAiStaleStateBenchmark,
      task,
      workspace,
    });

    expect(
      runner.calls.slice(0, 6),
    ).toEqual([
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "clear-stale-analysis",
        ],
        cwd: workspace.path,
      },
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "analysis-validation",
        ],
        cwd: workspace.path,
      },
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "clear-stale-resume",
        ],
        cwd: workspace.path,
      },
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "resume-validation",
        ],
        cwd: workspace.path,
      },
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "successful-results",
        ],
        cwd: workspace.path,
      },
      {
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_ai_stale_state_test.dart",
          "--plain-name",
          "clear-analysis",
        ],
        cwd: workspace.path,
      },
    ]);
  });

  it("reports only stale analysis failure when that group fails", async () => {
    const results =
      passingResults();

    results[0] =
      commandResult(
        1,
        "",
        "stale analysis remained",
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        new FakeCommandRunner(results),
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
        task,
        workspace,
      });

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "clear-stale-analysis",
      )?.passed,
    ).toBe(false);

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "analysis-validation",
      )?.passed,
    ).toBe(true);
  });

  it("reports only stale resume failure when that group fails", async () => {
    const results =
      passingResults();

    results[2] =
      commandResult(
        1,
        "",
        "stale resume bullets remained",
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        new FakeCommandRunner(results),
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
        task,
        workspace,
      });

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "clear-stale-resume",
      )?.passed,
    ).toBe(false);

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "resume-validation",
      )?.passed,
    ).toBe(true);
  });

  it("keeps the two validation criteria independent from stale-state clearing", async () => {
    const results =
      passingResults();

    results[1] =
      commandResult(
        1,
        "",
        "analysis validation failed",
      );

    results[3] =
      commandResult(
        1,
        "",
        "resume validation failed",
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        new FakeCommandRunner(results),
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
        task,
        workspace,
      });

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "analysis-validation",
      )?.passed,
    ).toBe(false);

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "resume-validation",
      )?.passed,
    ).toBe(false);

    expect(
      result.find(
        (criterion) =>
          criterion.criterionId ===
          "successful-results",
      )?.passed,
    ).toBe(true);
  });

  it("runs analysis and existing tests as separate regression checks", async () => {
    const runner =
      new FakeCommandRunner(
        passingResults(),
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        runner,
      );

    await verifier.verify({
      scenario:
        trackHireAiStaleStateBenchmark,
      task,
      workspace,
    });

    expect(
      runner.calls[6],
    ).toEqual({
      command: "flutter",
      args: [
        "analyze",
        "lib",
      ],
      cwd: workspace.path,
    });

    expect(
      runner.calls[7],
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

    results[6] =
      commandResult(
        1,
        "",
        "analysis failed",
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        new FakeCommandRunner(results),
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
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

  it("fails regression when existing TrackHire tests fail", async () => {
    const results =
      passingResults();

    results[7] =
      commandResult(
        1,
        "",
        "existing test failed",
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        new FakeCommandRunner(results),
      );

    const result =
      await verifier.verify({
        scenario:
          trackHireAiStaleStateBenchmark,
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

  it("rejects the wrong benchmark scenario without running commands", async () => {
    const runner =
      new FakeCommandRunner(
        passingResults(),
      );

    const verifier =
      new TrackHireAiStaleStateVerifier(
        runner,
      );

    await expect(
      verifier.verify({
        scenario: {
          ...trackHireAiStaleStateBenchmark,
          id: "wrong-scenario",
        },
        task,
        workspace,
      }),
    ).rejects.toThrow(
      "TrackHireAiStaleStateVerifier cannot verify scenario wrong-scenario.",
    );

    expect(runner.calls).toHaveLength(0);
  });
});