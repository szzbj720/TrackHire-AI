import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import {
  TrackHireRequiredFieldWhitespaceVerifier,
} from "./trackhire-required-field-whitespace-verifier.js";
import { trackHireRequiredFieldWhitespaceBenchmark } from "./trackhire-required-field-whitespace.js";
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
    "trackhire-required-field-whitespace",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path: "/tmp/factorybench-required-fields",
  branch: "benchmark-required-fields",
};

const task: EngineeringTask = {
  id: "task-test-run",
  request:
    trackHireRequiredFieldWhitespaceBenchmark.task,
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
  "TrackHireRequiredFieldWhitespaceVerifier",
  () => {
    it("returns criteria in scenario order when everything passes", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireRequiredFieldWhitespaceVerifier(
          runner,
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.map(
          (criterion) =>
            criterion.criterionId,
        ),
      ).toEqual([
        "reject-whitespace-company",
        "reject-whitespace-role",
        "validation-message",
        "valid-input",
        "edit-behavior",
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
        new TrackHireRequiredFieldWhitespaceVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireRequiredFieldWhitespaceBenchmark,
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
            "test/factory_benchmark_required_field_whitespace_test.dart",
            "--plain-name",
            "reject-whitespace-company",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_required_field_whitespace_test.dart",
            "--plain-name",
            "reject-whitespace-role",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_required_field_whitespace_test.dart",
            "--plain-name",
            "validation-message",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_required_field_whitespace_test.dart",
            "--plain-name",
            "valid-input",
          ],
          cwd: workspace.path,
        },
        {
          command: "flutter",
          args: [
            "test",
            "test/factory_benchmark_required_field_whitespace_test.dart",
            "--plain-name",
            "edit-behavior",
          ],
          cwd: workspace.path,
        },
      ]);
    });

    it("reports company whitespace failure independently", async () => {
      const results =
        passingResults();

      results[0] =
        commandResult(
          1,
          "",
          "company validation failed",
        );

      const verifier =
        new TrackHireRequiredFieldWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "reject-whitespace-company",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "reject-whitespace-role",
        )?.passed,
      ).toBe(true);
    });

    it("reports role whitespace failure independently", async () => {
      const results =
        passingResults();

      results[1] =
        commandResult(
          1,
          "",
          "role validation failed",
        );

      const verifier =
        new TrackHireRequiredFieldWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "reject-whitespace-role",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "validation-message",
        )?.passed,
      ).toBe(true);
    });

    it("keeps valid input and edit behavior independent", async () => {
      const results =
        passingResults();

      results[3] =
        commandResult(
          1,
          "",
          "valid input failed",
        );

      const verifier =
        new TrackHireRequiredFieldWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "valid-input",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "edit-behavior",
        )?.passed,
      ).toBe(true);
    });

    it("runs Flutter analysis and existing tests as regression checks", async () => {
      const runner =
        new FakeCommandRunner(
          passingResults(),
        );

      const verifier =
        new TrackHireRequiredFieldWhitespaceVerifier(
          runner,
        );

      await verifier.verify({
        scenario:
          trackHireRequiredFieldWhitespaceBenchmark,
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
        new TrackHireRequiredFieldWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
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
        new TrackHireRequiredFieldWhitespaceVerifier(
          new FakeCommandRunner(results),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireRequiredFieldWhitespaceBenchmark,
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
        new TrackHireRequiredFieldWhitespaceVerifier(
          runner,
        );

      await expect(
        verifier.verify({
          scenario: {
            ...trackHireRequiredFieldWhitespaceBenchmark,
            id: "wrong-scenario",
          },
          task,
          workspace,
        }),
      ).rejects.toThrow(
        "TrackHireRequiredFieldWhitespaceVerifier cannot verify scenario wrong-scenario.",
      );

      expect(
        runner.calls,
      ).toHaveLength(0);
    });
  },
);
