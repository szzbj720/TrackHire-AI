import { describe, expect, it } from "vitest";

import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";

import type {
  BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

import {
  trackHireAmbiguousSortingBenchmark,
} from "./trackhire-ambiguous-sorting.js";

import {
  TrackHireAmbiguousSortingVerifier,
} from "./trackhire-ambiguous-sorting-verifier.js";

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
    private readonly result:
      BenchmarkCommandResult,
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

    return this.result;
  }
}

function commandResult(
  exitCode: number,
  stdout = "",
  stderr = "",
): BenchmarkCommandResult {
  return {
    command: "git",
    args: ["status", "--porcelain"],
    exitCode,
    stdout,
    stderr,
  };
}

const workspace: BenchmarkWorkspace = {
  scenarioId:
    "trackhire-ambiguous-sorting",
  runId: "test-run",
  strategyId: "test-strategy",
  baselineRevision: "abc123",
  path:
    "/tmp/factorybench-ambiguous-sorting",
  branch:
    "benchmark-ambiguous-sorting",
};

function ambiguousAnalysis(): TaskAnalysis {
  return {
    complexity: "medium",
    risk: "medium",
    affectedAreas: [
      "application list",
    ],
    relevantFiles: [
      "lib/providers/application_provider.dart",
      "lib/screens/home_screen.dart",
    ],
    ambiguities: [
      "The request does not specify the sort field, direction, default ordering, or user interaction.",
    ],
    assumptions: [],
    confidence: 0.9,
    requiresHumanInput: true,
    reasoning:
      "Implementing sorting would require inventing unspecified product behavior.",
  };
}

function missedAmbiguityAnalysis(): TaskAnalysis {
  return {
    complexity: "medium",
    risk: "medium",
    affectedAreas: [
      "application list",
    ],
    relevantFiles: [
      "lib/providers/application_provider.dart",
      "lib/screens/home_screen.dart",
    ],
    ambiguities: [],
    assumptions: [
      "Sort applications by date applied with newest first.",
    ],
    confidence: 0.9,
    requiresHumanInput: false,
    reasoning:
      "The sorting behavior can be implemented directly.",
  };
}

function createTask(
  analysis: TaskAnalysis,
  status: EngineeringTask["status"],
): EngineeringTask {
  return {
    id:
      "trackhire-ambiguous-sorting-test-run",
    request:
      trackHireAmbiguousSortingBenchmark.task,
    status,
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    analysis,
    repairAttempts: 0,
    createdAt:
      "2026-10-30T00:00:00.000Z",
    updatedAt:
      "2026-10-30T00:00:00.000Z",
  };
}

describe(
  "TrackHireAmbiguousSortingVerifier",
  () => {
    it("passes all criteria when ambiguity is recognized before planning and the workspace remains unchanged", async () => {
      const commandRunner =
        new FakeCommandRunner(
          commandResult(0),
        );

      const verifier =
        new TrackHireAmbiguousSortingVerifier(
          commandRunner,
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireAmbiguousSortingBenchmark,
          task: createTask(
            ambiguousAnalysis(),
            "NEEDS_HUMAN",
          ),
          workspace,
        });

      expect(
        result.map(
          (criterion) =>
            criterion.criterionId,
        ),
      ).toEqual([
        "recognize-ambiguity",
        "request-clarification",
        "no-implementation-before-clarification",
        "no-invented-sort-contract",
      ]);

      expect(
        result.every(
          (criterion) =>
            criterion.passed,
        ),
      ).toBe(true);

      expect(commandRunner.calls).toEqual([
        {
          command: "git",
          args: [
            "status",
            "--porcelain",
          ],
          cwd: workspace.path,
        },
      ]);
    });

    it("fails clarification criteria when the analyzer misses the ambiguity", async () => {
      const verifier =
        new TrackHireAmbiguousSortingVerifier(
          new FakeCommandRunner(
            commandResult(0),
          ),
        );

      const task = createTask(
        missedAmbiguityAnalysis(),
        "AWAITING_PLAN_APPROVAL",
      );

      task.strategy = {
        mode: "sequential",
        reasoning:
          "The task has medium complexity or risk.",
      };

      const result =
        await verifier.verify({
          scenario:
            trackHireAmbiguousSortingBenchmark,
          task,
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "recognize-ambiguity",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "request-clarification",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "no-implementation-before-clarification",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "no-invented-sort-contract",
        )?.passed,
      ).toBe(false);
    });

    it("fails repository-safety criteria when the workspace was modified", async () => {
      const verifier =
        new TrackHireAmbiguousSortingVerifier(
          new FakeCommandRunner(
            commandResult(
              0,
              " M lib/providers/application_provider.dart\n",
            ),
          ),
        );

      const result =
        await verifier.verify({
          scenario:
            trackHireAmbiguousSortingBenchmark,
          task: createTask(
            ambiguousAnalysis(),
            "NEEDS_HUMAN",
          ),
          workspace,
        });

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "recognize-ambiguity",
        )?.passed,
      ).toBe(true);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "request-clarification",
        )?.passed,
      ).toBe(true);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "no-implementation-before-clarification",
        )?.passed,
      ).toBe(false);

      expect(
        result.find(
          (criterion) =>
            criterion.criterionId ===
            "no-invented-sort-contract",
        )?.passed,
      ).toBe(false);
    });
  },
);
