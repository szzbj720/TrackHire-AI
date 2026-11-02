import { describe, expect, it } from "vitest";

import type {
  BenchmarkCommandResult,
  BenchmarkCommandRunner,
} from "./trackhire-interview-date-verifier.js";
import { TrackHireCsvMaterialsReadyVerifier } from "./trackhire-csv-materials-ready-verifier.js";
import { trackHireCsvMaterialsReadyBenchmark } from "./trackhire-csv-materials-ready.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import type { EngineeringTask } from "../schemas/task.js";

class FakeCommandRunner implements BenchmarkCommandRunner {
  readonly calls: {
    command: string;
    args: string[];
    cwd: string;
  }[] = [];

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

    const result = this.results[this.calls.length - 1];

    if (!result) {
      throw new Error("No fake command result configured.");
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
    stdout: exitCode === 0 ? "passed" : "",
    stderr: exitCode === 0 ? "" : "failed",
  };
}

const workspace: BenchmarkWorkspace = {
  scenarioId: "trackhire-csv-materials-ready",
  runId: "run-001",
  strategyId: "sequential",
  baselineRevision: "abc123",
  path: "/tmp/trackhire-csv-materials-ready",
  branch: "factory/benchmark-csv-materials-ready-run-001",
};

const task: EngineeringTask = {
  id: "trackhire-csv-materials-ready-run-001",
  request: trackHireCsvMaterialsReadyBenchmark.task,
  status: "TASK_CREATED",
  requirements: [],
  acceptanceCriteria: [],
  constraints: [],
  repairAttempts: 0,
  createdAt: "2026-10-29T00:00:00.000Z",
  updatedAt: "2026-10-29T00:00:00.000Z",
};

function passingResults(): BenchmarkCommandResult[] {
  return [
    commandResult(
      "flutter",
      [
        "test",
        "test/factory_benchmark_csv_materials_ready_test.dart",
        "--plain-name",
        "materials-count",
      ],
    ),
    commandResult(
      "node",
      [
        "factory_benchmark_csv_materials_ready_test.js",
      ],
    ),
    commandResult(
      "flutter",
      [
        "analyze",
        "lib",
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
  "TrackHireCsvMaterialsReadyVerifier",
  () => {
    it("returns every acceptance criterion in scenario order", async () => {
      const runner = new FakeCommandRunner(
        passingResults(),
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      const results = await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(
        results.map(
          (result) => result.criterionId,
        ),
      ).toEqual([
        "materials-header",
        "materials-value",
        "materials-edge-cases",
        "preserve-columns",
        "regression",
      ]);

      expect(
        results.every(
          (result) => result.passed,
        ),
      ).toBe(true);

      expect(runner.calls).toHaveLength(4);
    });

    it("uses the protected model fixture for material-count behavior", async () => {
      const runner = new FakeCommandRunner(
        passingResults(),
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(runner.calls[0]).toEqual({
        command: "flutter",
        args: [
          "test",
          "test/factory_benchmark_csv_materials_ready_test.dart",
          "--plain-name",
          "materials-count",
        ],
        cwd: workspace.path,
      });
    });

    it("uses the protected CSV export contract fixture", async () => {
      const runner = new FakeCommandRunner(
        passingResults(),
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(runner.calls[1]).toEqual({
        command: "node",
        args: [
          "factory_benchmark_csv_materials_ready_test.js",
        ],
        cwd: workspace.path,
      });
    });

    it("maps an export failure to all export-dependent criteria", async () => {
      const results = passingResults();

      results[1] = commandResult(
        "node",
        [
          "factory_benchmark_csv_materials_ready_test.js",
        ],
        1,
      );

      const runner = new FakeCommandRunner(
        results,
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      const verification = await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(verification).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            criterionId: "materials-header",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "materials-value",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "materials-edge-cases",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "preserve-columns",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "regression",
            passed: true,
          }),
        ]),
      );
    });

    it("maps a model-count failure to value and edge-case criteria", async () => {
      const results = passingResults();

      results[0] = commandResult(
        "flutter",
        [
          "test",
          "test/factory_benchmark_csv_materials_ready_test.dart",
          "--plain-name",
          "materials-count",
        ],
        1,
      );

      const runner = new FakeCommandRunner(
        results,
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      const verification = await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(verification).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            criterionId: "materials-header",
            passed: true,
          }),
          expect.objectContaining({
            criterionId: "materials-value",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "materials-edge-cases",
            passed: false,
          }),
          expect.objectContaining({
            criterionId: "preserve-columns",
            passed: true,
          }),
          expect.objectContaining({
            criterionId: "regression",
            passed: true,
          }),
        ]),
      );
    });

    it("keeps regression checks separate", async () => {
      const runner = new FakeCommandRunner(
        passingResults(),
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(runner.calls[2]).toEqual({
        command: "flutter",
        args: [
          "analyze",
          "lib",
        ],
        cwd: workspace.path,
      });

      expect(runner.calls[3]).toEqual({
        command: "flutter",
        args: [
          "test",
          "test/job_application_test.dart",
        ],
        cwd: workspace.path,
      });
    });

    it("fails regression when analysis fails", async () => {
      const results = passingResults();

      results[2] = commandResult(
        "flutter",
        [
          "analyze",
          "lib",
        ],
        1,
      );

      const runner = new FakeCommandRunner(
        results,
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      const verification = await verifier.verify({
        scenario: trackHireCsvMaterialsReadyBenchmark,
        workspace,
        task,
      });

      expect(
        verification.find(
          (result) =>
            result.criterionId === "regression",
        ),
      ).toEqual(
        expect.objectContaining({
          passed: false,
        }),
      );
    });

    it("rejects a different benchmark scenario without running commands", async () => {
      const runner = new FakeCommandRunner(
        passingResults(),
      );

      const verifier =
        new TrackHireCsvMaterialsReadyVerifier(
          runner,
        );

      await expect(
        verifier.verify({
          scenario: {
            ...trackHireCsvMaterialsReadyBenchmark,
            id: "different-scenario",
          },
          workspace,
          task,
        }),
      ).rejects.toThrow(
        "TrackHireCsvMaterialsReadyVerifier cannot verify scenario different-scenario.",
      );

      expect(runner.calls).toHaveLength(0);
    });
  },
);