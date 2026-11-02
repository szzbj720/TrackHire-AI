import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import type {
  TaskAnalyzer,
} from "../agents/analyzer.js";

import type {
  RepositoryContext,
} from "../context/context-builder.js";

import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";

import type {
  BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

import {
  ClarificationBenchmarkExecutor,
  type ClarificationBenchmarkAcceptanceCollector,
} from "./clarification-benchmark-executor.js";

import {
  trackHireAmbiguousSortingBenchmark,
} from "./trackhire-ambiguous-sorting.js";

function createAnalysis(
  requiresHumanInput: boolean,
): TaskAnalysis {
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
    ambiguities:
      requiresHumanInput
        ? [
            "The sorting field and direction are unspecified.",
          ]
        : [],
    assumptions:
      requiresHumanInput
        ? []
        : [
            "Sort by date applied with newest first.",
          ],
    confidence: 0.9,
    requiresHumanInput,
    reasoning:
      requiresHumanInput
        ? "The request requires product clarification."
        : "The request can be implemented directly.",
  };
}

class RecordingAnalyzer
  implements TaskAnalyzer
{
  calls = 0;

  tasks: EngineeringTask[] = [];

  constructor(
    private readonly analysis:
      TaskAnalysis,
  ) {}

  async analyze(
    task: EngineeringTask,
    _context: RepositoryContext,
  ): Promise<TaskAnalysis> {
    this.calls += 1;
    this.tasks.push(task);

    return this.analysis;
  }
}

class RecordingAcceptanceCollector
  implements ClarificationBenchmarkAcceptanceCollector
{
  tasks: EngineeringTask[] = [];

  async collect(
    input: Parameters<
      ClarificationBenchmarkAcceptanceCollector["collect"]
    >[0],
  ) {
    this.tasks.push(input.task);

    const cleanClarification =
      input.task.status ===
        "NEEDS_HUMAN" &&
      input.task.analysis
        ?.requiresHumanInput === true &&
      input.task.strategy ===
        undefined &&
      input.task.plan ===
        undefined;

    return input.scenario
      .acceptanceCriteria
      .map((criterion) => ({
        criterionId:
          criterion.id,
        passed:
          cleanClarification,
        evidence: [
          cleanClarification
            ? "Clarification requested before planning."
            : "Clarification was not requested before planning.",
        ],
      }));
  }
}

describe(
  "ClarificationBenchmarkExecutor",
  () => {
    let workspacePath: string;
    let workspace: BenchmarkWorkspace;

    beforeEach(async () => {
      workspacePath =
        await mkdtemp(
          join(
            tmpdir(),
            "factorybench-ambiguous-sorting-",
          ),
        );

      workspace = {
        scenarioId:
          "trackhire-ambiguous-sorting",
        runId: "test-run",
        strategyId: "test-strategy",
        baselineRevision: "abc123",
        path: workspacePath,
        branch:
          "benchmark-ambiguous-sorting",
      };
    });

    afterEach(async () => {
      await rm(
        workspacePath,
        {
          recursive: true,
          force: true,
        },
      );
    });

    it("stops before planning when analysis requires human input", async () => {
      const analyzer =
        new RecordingAnalyzer(
          createAnalysis(true),
        );

      const collector =
        new RecordingAcceptanceCollector();

      const executor =
        new ClarificationBenchmarkExecutor({
          runId: "test-run",
          analyzer,
          acceptanceCollector:
            collector,
        });

      const result =
        await executor.execute({
          scenario:
            trackHireAmbiguousSortingBenchmark,
          workspace,
        });

      expect(analyzer.calls).toBe(1);

      expect(
        collector.tasks,
      ).toHaveLength(1);

      const finalTask =
        collector.tasks[0];

      expect(
        finalTask?.status,
      ).toBe("NEEDS_HUMAN");

      expect(
        finalTask?.strategy,
      ).toBeUndefined();

      expect(
        finalTask?.plan,
      ).toBeUndefined();

      expect(
        result.criterionResults.every(
          (criterion) =>
            criterion.passed,
        ),
      ).toBe(true);

      expect(
        result.humanInterventions,
      ).toBe(1);

      expect(result.usage).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
      });
    });

    it("fails clarification when analysis proceeds to planning", async () => {
      const analyzer =
        new RecordingAnalyzer(
          createAnalysis(false),
        );

      const collector =
        new RecordingAcceptanceCollector();

      const executor =
        new ClarificationBenchmarkExecutor({
          runId: "test-run",
          analyzer,
          acceptanceCollector:
            collector,
        });

      const result =
        await executor.execute({
          scenario:
            trackHireAmbiguousSortingBenchmark,
          workspace,
        });

      const finalTask =
        collector.tasks[0];

      expect(
        finalTask?.status,
      ).toBe(
        "AWAITING_PLAN_APPROVAL",
      );

      expect(
        finalTask?.strategy?.mode,
      ).toBe("sequential");

      expect(
        finalTask?.plan,
      ).toBeDefined();

      expect(
        result.criterionResults.every(
          (criterion) =>
            !criterion.passed,
        ),
      ).toBe(true);

      expect(
        result.humanInterventions,
      ).toBe(0);
    });

    it("does not leak benchmark acceptance criteria into the analyzer-facing task", async () => {
      const analyzer =
        new RecordingAnalyzer(
          createAnalysis(true),
        );

      const executor =
        new ClarificationBenchmarkExecutor({
          runId: "test-run",
          analyzer,
          acceptanceCollector:
            new RecordingAcceptanceCollector(),
        });

      await executor.execute({
        scenario:
          trackHireAmbiguousSortingBenchmark,
        workspace,
      });

      const analyzerTask =
        analyzer.tasks[0];

      expect(
        analyzerTask?.request,
      ).toBe(
        "Add sorting to the TrackHire application list.",
      );

      expect(
        analyzerTask?.requirements,
      ).toEqual([]);

      expect(
        analyzerTask?.acceptanceCriteria,
      ).toEqual([]);

      expect(
        analyzerTask?.constraints,
      ).toEqual([
        "Repository scope: lib/providers/application_provider.dart, lib/screens/home_screen.dart, lib/models/job_application.dart",
      ]);

      const serializedTask =
        JSON.stringify(
          analyzerTask,
        );

      expect(
        serializedTask,
      ).not.toContain(
        "materially underspecified",
      );

      expect(
        serializedTask,
      ).not.toContain(
        "requires clarification",
      );

      expect(
        serializedTask,
      ).not.toContain(
        "no-invented-sort-contract",
      );
    });
  },
);
