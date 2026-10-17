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
    BenchmarkResultAggregator,
  } from "./benchmark-result-aggregator.js";
  
  function makeResult(
    overrides: {
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
      overrides.passedCriteria ??
      5;
  
    const totalCriteria =
      overrides.totalCriteria ??
      5;
  
    const strategy:
      BenchmarkStrategy =
        "sequential";
  
    return {
      runId:
        "run-1",
  
      scenarioId:
        "scenario-1",
  
      strategy,
  
      baselineRevision:
        "abc123",
  
      workspacePath:
        "/tmp/workspace",
  
      workspaceBranch:
        "benchmark/run-1",
  
      validation: {
        passed:
          overrides
            .validationPassed ??
          true,
  
        commandsRun: [
          "flutter analyze",
          "flutter test",
        ],
  
        failedCommands:
          overrides
            .validationPassed ===
          false
            ? ["flutter test"]
            : [],
      },
  
      acceptance: {
        passed:
          overrides
            .acceptancePassed ??
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
          overrides
            .estimatedCostUsd ??
          0.01,
      },
  
      durationMs:
        overrides.durationMs ??
        1_000,
  
      humanInterventions:
        overrides
          .humanInterventions ??
        0,
  
      success:
        overrides.success ??
        true,
  
      startedAt:
        "2026-10-17T00:00:00.000Z",
  
      completedAt:
        "2026-10-17T00:00:01.000Z",
    };
  }
  
  describe(
    "BenchmarkResultAggregator",
    () => {
      it(
        "aggregates success and pass rates",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "sequential-openai",
  
              strategy:
                "sequential",
  
              results: [
                makeResult(),
  
                makeResult({
                  success: false,
                  validationPassed:
                    false,
                  acceptancePassed:
                    true,
                }),
  
                makeResult({
                  success: false,
                  validationPassed:
                    true,
                  acceptancePassed:
                    false,
                }),
  
                makeResult(),
              ],
            });
  
          expect(
            aggregate.trialCount,
          ).toBe(4);
  
          expect(
            aggregate.successfulTrials,
          ).toBe(2);
  
          expect(
            aggregate.successRate,
          ).toBe(0.5);
  
          expect(
            aggregate
              .validationPassRate,
          ).toBe(0.75);
  
          expect(
            aggregate
              .acceptancePassRate,
          ).toBe(0.75);
        },
      );
  
      it(
        "aggregates criterion pass rate across trials",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "sequential-openai",
  
              strategy:
                "sequential",
  
              results: [
                makeResult({
                  passedCriteria: 5,
                  totalCriteria: 5,
                }),
  
                makeResult({
                  passedCriteria: 3,
                  totalCriteria: 5,
                }),
              ],
            });
  
          expect(
            aggregate
              .criterionPassRate,
          ).toBe(0.8);
        },
      );
  
      it(
        "averages token usage",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "sequential-openai",
  
              strategy:
                "sequential",
  
              results: [
                makeResult({
                  inputTokens: 100,
                  outputTokens: 40,
                }),
  
                makeResult({
                  inputTokens: 300,
                  outputTokens: 60,
                }),
              ],
            });
  
          expect(
            aggregate
              .averageInputTokens,
          ).toBe(200);
  
          expect(
            aggregate
              .averageOutputTokens,
          ).toBe(50);
        },
      );
  
      it(
        "averages cost, duration, and human interventions",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "sequential-openai",
  
              strategy:
                "sequential",
  
              results: [
                makeResult({
                  estimatedCostUsd:
                    0.01,
                  durationMs:
                    1_000,
                  humanInterventions:
                    0,
                }),
  
                makeResult({
                  estimatedCostUsd:
                    0.03,
                  durationMs:
                    3_000,
                  humanInterventions:
                    2,
                }),
              ],
            });
  
          expect(
            aggregate
              .averageEstimatedCostUsd,
          ).toBeCloseTo(0.02);
  
          expect(
            aggregate
              .averageDurationMs,
          ).toBe(2_000);
  
          expect(
            aggregate
              .averageHumanInterventions,
          ).toBe(1);
        },
      );
  
      it(
        "preserves target identity and strategy",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "anthropic-sequential",
  
              strategy:
                "sequential",
  
              results: [
                makeResult(),
              ],
            });
  
          expect(
            aggregate.targetId,
          ).toBe(
            "anthropic-sequential",
          );
  
          expect(
            aggregate.strategy,
          ).toBe(
            "sequential",
          );
        },
      );
  
      it(
        "weights criterion pass rate by total criteria",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "target-a",
  
              strategy:
                "sequential",
  
              results: [
                makeResult({
                  passedCriteria: 1,
                  totalCriteria: 1,
                }),
  
                makeResult({
                  passedCriteria: 5,
                  totalCriteria: 9,
                }),
              ],
            });
  
          expect(
            aggregate
              .criterionPassRate,
          ).toBe(0.6);
        },
      );
  
      it(
        "returns zero criterion pass rate when no criteria were measured",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          const aggregate =
            aggregator.aggregate({
              targetId:
                "target-a",
  
              strategy:
                "sequential",
  
              results: [
                makeResult({
                  passedCriteria: 0,
                  totalCriteria: 0,
                }),
              ],
            });
  
          expect(
            aggregate
              .criterionPassRate,
          ).toBe(0);
        },
      );
  
      it(
        "rejects an empty result set",
        () => {
          const aggregator =
            new BenchmarkResultAggregator();
  
          expect(
            () =>
              aggregator.aggregate({
                targetId:
                  "target-a",
  
                strategy:
                  "sequential",
  
                results: [],
              }),
          ).toThrow(
            "Cannot aggregate an empty benchmark result set.",
          );
        },
      );
    },
  );