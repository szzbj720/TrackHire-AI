import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  BenchmarkResult,
  BenchmarkStrategy,
} from "../schemas/benchmark-result.js";

import {
  FactoryBenchSuiteSummarizer,
} from "./factory-bench-suite-summary.js";

function makeResult(
  overrides: {
    scenarioId?: string;
    strategy?: BenchmarkStrategy;
    success?: boolean;
    validationPassed?: boolean;
    acceptancePassed?: boolean;
    passedCriteria?: number;
    totalCriteria?: number;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
    durationMs?: number;
    humanInterventions?: number;
  } = {},
): BenchmarkResult {
  const passedCriteria =
    overrides.passedCriteria ?? 5;

  const totalCriteria =
    overrides.totalCriteria ?? 5;

  return {
    runId: `run-${overrides.scenarioId ?? "scenario-1"}`,
    scenarioId:
      overrides.scenarioId ??
      "scenario-1",
    strategy:
      overrides.strategy ??
      "sequential",
    baselineRevision: "abc123",
    workspacePath: "/tmp/workspace",
    workspaceBranch: "benchmark/run-1",
    validation: {
      passed:
        overrides.validationPassed ??
        true,
      commandsRun: [
        "flutter analyze",
        "flutter test",
      ],
      failedCommands:
        overrides.validationPassed ===
        false
          ? ["flutter test"]
          : [],
    },
    acceptance: {
      passed:
        overrides.acceptancePassed ??
        true,
      passedCriteria,
      failedCriteria:
        totalCriteria -
        passedCriteria,
      totalCriteria,
      scores: [],
      missingCriterionIds: [],
      unexpectedCriterionIds: [],
    },
    usage: {
      inputTokens:
        overrides.inputTokens ??
        100,
      outputTokens:
        overrides.outputTokens ??
        50,
      estimatedCostUsd:
        overrides.estimatedCostUsd ??
        0.01,
    },
    durationMs:
      overrides.durationMs ??
      1_000,
    humanInterventions:
      overrides.humanInterventions ??
      0,
    success:
      overrides.success ??
      true,
    startedAt:
      "2026-10-31T00:00:00.000Z",
    completedAt:
      "2026-10-31T00:00:01.000Z",
  };
}

describe(
  "FactoryBenchSuiteSummarizer",
  () => {
    it(
      "summarizes pass rates across different scenarios",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        const summary =
          summarizer.summarize([
            makeResult({
              scenarioId: "scenario-1",
            }),
            makeResult({
              scenarioId: "scenario-2",
              success: false,
              acceptancePassed: false,
              passedCriteria: 3,
              totalCriteria: 5,
            }),
            makeResult({
              scenarioId: "scenario-3",
              success: false,
              validationPassed: false,
              acceptancePassed: true,
            }),
            makeResult({
              scenarioId: "scenario-4",
            }),
          ]);

        expect(
          summary.scenarioCount,
        ).toBe(4);

        expect(
          summary.successfulScenarios,
        ).toBe(2);

        expect(
          summary.scenarioSuccessRate,
        ).toBe(0.5);

        expect(
          summary.validationPassRate,
        ).toBe(0.75);

        expect(
          summary.acceptancePassRate,
        ).toBe(0.75);
      },
    );

    it(
      "weights criterion pass rate by total criteria across the suite",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        const summary =
          summarizer.summarize([
            makeResult({
              scenarioId: "scenario-1",
              passedCriteria: 1,
              totalCriteria: 1,
            }),
            makeResult({
              scenarioId: "scenario-2",
              passedCriteria: 5,
              totalCriteria: 9,
            }),
          ]);

        expect(
          summary.passedCriteria,
        ).toBe(6);

        expect(
          summary.failedCriteria,
        ).toBe(4);

        expect(
          summary.totalCriteria,
        ).toBe(10);

        expect(
          summary.criterionPassRate,
        ).toBe(0.6);
      },
    );

    it(
      "totals usage, cost, duration, and human interventions",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        const summary =
          summarizer.summarize([
            makeResult({
              scenarioId: "scenario-1",
              inputTokens: 100,
              outputTokens: 40,
              estimatedCostUsd: 0.01,
              durationMs: 1_000,
              humanInterventions: 0,
            }),
            makeResult({
              scenarioId: "scenario-2",
              inputTokens: 300,
              outputTokens: 60,
              estimatedCostUsd: 0.03,
              durationMs: 3_000,
              humanInterventions: 2,
            }),
          ]);

        expect(
          summary.totalInputTokens,
        ).toBe(400);

        expect(
          summary.totalOutputTokens,
        ).toBe(100);

        expect(
          summary.totalTokens,
        ).toBe(500);

        expect(
          summary.totalEstimatedCostUsd,
        ).toBeCloseTo(0.04);

        expect(
          summary.totalDurationMs,
        ).toBe(4_000);

        expect(
          summary.totalHumanInterventions,
        ).toBe(2);
      },
    );

    it(
      "preserves per-scenario results for diagnosis",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        const summary =
          summarizer.summarize([
            makeResult({
              scenarioId: "scenario-a",
              strategy: "lightweight",
              success: false,
            }),
            makeResult({
              scenarioId: "scenario-b",
              strategy: "exploration",
              success: true,
            }),
          ]);

        expect(
          summary.scenarios,
        ).toEqual([
          {
            scenarioId: "scenario-a",
            strategy: "lightweight",
            success: false,
            validationPassed: true,
            acceptancePassed: true,
            passedCriteria: 5,
            failedCriteria: 0,
            totalCriteria: 5,
          },
          {
            scenarioId: "scenario-b",
            strategy: "exploration",
            success: true,
            validationPassed: true,
            acceptancePassed: true,
            passedCriteria: 5,
            failedCriteria: 0,
            totalCriteria: 5,
          },
        ]);
      },
    );

    it(
      "rejects duplicate scenario results",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        expect(
          () =>
            summarizer.summarize([
              makeResult({
                scenarioId: "scenario-1",
              }),
              makeResult({
                scenarioId: "scenario-1",
              }),
            ]),
        ).toThrow(
          "FactoryBench suite summary requires one result per scenario.",
        );
      },
    );

    it(
      "rejects an empty result set",
      () => {
        const summarizer =
          new FactoryBenchSuiteSummarizer();

        expect(
          () =>
            summarizer.summarize([]),
        ).toThrow(
          "Cannot summarize an empty FactoryBench result set.",
        );
      },
    );
  },
);
