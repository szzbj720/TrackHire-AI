import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import { trackHireApiBooleanNormalizationBenchmark } from "./trackhire-api-boolean-normalization.js";
import { TrackHireApiBooleanNormalizationVerifier } from "./trackhire-api-boolean-normalization-verifier.js";
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
    "trackhire-api-boolean-normalization",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path: "/tmp/factorybench-api-boolean-normalization",
  branch:
    "benchmark-api-boolean-normalization",
};

const task: EngineeringTask = {
  id: "task-test-run",
  request:
    trackHireApiBooleanNormalizationBenchmark.task,
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
  "TrackHireApiBooleanNormalizationVerifier",
  () => {
    it("returns criteria in scenario order when everything passes", async () => {
      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          new FakeCommandRunner(
            passingResults(),
          ),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireApiBooleanNormalizationBenchmark,
          task,
          workspace,
        });

      expect(
        result.map(
          (criterion) =>
            criterion.criterionId,
        ),
      ).toEqual([
        "integer-booleans",
        "native-booleans",
        "missing-booleans",
        "non-boolean-fields",
        "database-deserialization",
        "regression",
      ]);

      expect(
        result.every(
          (criterion) =>
            criterion.passed,
        ),
      ).toBe(true);
    });

    it("runs all five held-out fixture groups separately", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireApiBooleanNormalizationBenchmark,
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
            "test/factory_benchmark_api_boolean_normalization_test.dart",
            "--plain-name",
            "integer-booleans",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_api_boolean_normalization_test.dart",
            "--plain-name",
            "native-booleans",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_api_boolean_normalization_test.dart",
            "--plain-name",
            "missing-booleans",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_api_boolean_normalization_test.dart",
            "--plain-name",
            "non-boolean-fields",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_api_boolean_normalization_test.dart",
            "--plain-name",
            "database-deserialization",
          ],
          cwd: workspace.path,
        },
      ]);
    });

    it("reports integer boolean failure independently", async () => {
      const results =
        passingResults();

      results[0] =
        commandResult(
          1,
          "",
          "type 'int' is not a subtype of type 'bool'",
        );

      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireApiBooleanNormalizationBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "integer-booleans",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "native-booleans",
        )?.passed,
      ).toBe(true);
    });

    it("preserves independent database deserialization evidence", async () => {
      const results =
        passingResults();

      results[4] =
        commandResult(
          1,
          "",
          "database deserialization failed",
        );

      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireApiBooleanNormalizationBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "database-deserialization",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "integer-booleans",
        )?.passed,
      ).toBe(true);
    });

    it("runs Flutter analysis and existing model tests as regression checks", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireApiBooleanNormalizationBenchmark,
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
        new TrackHireApiBooleanNormalizationVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireApiBooleanNormalizationBenchmark,
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

    it("fails regression when existing model tests fail", async () => {
      const results =
        passingResults();

      results[6] =
        commandResult(
          1,
          "",
          "existing model test failed",
        );

      const verifier =
        new TrackHireApiBooleanNormalizationVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireApiBooleanNormalizationBenchmark,
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
        new TrackHireApiBooleanNormalizationVerifier(
          runner,
        );

      await expect(
        verifier.verify({
          scenario: {
            ...trackHireApiBooleanNormalizationBenchmark,
            id: "wrong-scenario",
          },
          task,
          workspace,
        }),
      ).rejects.toThrow(
        "TrackHireApiBooleanNormalizationVerifier cannot verify scenario wrong-scenario.",
      );

      expect(
        runner.calls,
      ).toHaveLength(0);
    });
  },
);
