import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    BenchmarkAggregate,
  } from "./benchmark-result-aggregator.js";
  
  import {
    BenchmarkComparisonReporter,
  } from "./benchmark-comparison-reporter.js";
  
  describe(
    "BenchmarkComparisonReporter",
    () => {
      it(
        "creates human-readable comparison rows from benchmark aggregates",
        () => {
          const aggregates:
            BenchmarkAggregate[] = [
              {
                targetId:
                  "qwen-lightweight",
  
                strategy:
                  "lightweight",
  
                trialCount: 5,
  
                successfulTrials: 1,
  
                successRate: 0.2,
  
                validationPassRate: 0.4,
  
                acceptancePassRate: 0.2,
  
                criterionPassRate: 0.48,
  
                averageInputTokens:
                  5000,
  
                averageOutputTokens:
                  3200,
  
                averageEstimatedCostUsd:
                  0,
  
                averageDurationMs:
                  180250,
  
                averageHumanInterventions:
                  1,
              },
  
              {
                targetId:
                  "qwen-sequential",
  
                strategy:
                  "sequential",
  
                trialCount: 5,
  
                successfulTrials: 3,
  
                successRate: 0.6,
  
                validationPassRate: 0.8,
  
                acceptancePassRate: 0.6,
  
                criterionPassRate: 0.76,
  
                averageInputTokens:
                  11000,
  
                averageOutputTokens:
                  7500,
  
                averageEstimatedCostUsd:
                  0,
  
                averageDurationMs:
                  410400,
  
                averageHumanInterventions:
                  1.2,
              },
            ];
  
          const reporter =
            new BenchmarkComparisonReporter();
  
          const report =
            reporter.create(
              aggregates,
            );
  
          expect(
            report.rows,
          ).toEqual([
            {
              targetId:
                "qwen-lightweight",
  
              strategy:
                "lightweight",
  
              trials: 5,
  
              successRate: 20,
  
              validationPassRate: 40,
  
              acceptancePassRate: 20,
  
              criterionPassRate: 48,
  
              averageDurationSeconds:
                180.3,
  
              averageInputTokens:
                5000,
  
              averageOutputTokens:
                3200,
  
              averageTotalTokens:
                8200,
  
              averageEstimatedCostUsd:
                0,
  
              averageHumanInterventions:
                1,
            },
  
            {
              targetId:
                "qwen-sequential",
  
              strategy:
                "sequential",
  
              trials: 5,
  
              successRate: 60,
  
              validationPassRate: 80,
  
              acceptancePassRate: 60,
  
              criterionPassRate: 76,
  
              averageDurationSeconds:
                410.4,
  
              averageInputTokens:
                11000,
  
              averageOutputTokens:
                7500,
  
              averageTotalTokens:
                18500,
  
              averageEstimatedCostUsd:
                0,
  
              averageHumanInterventions:
                1.2,
            },
          ]);
        },
      );
  
      it(
        "formats comparison rows as a readable table",
        () => {
          const reporter =
            new BenchmarkComparisonReporter();
  
          const report =
            reporter.create([
              {
                targetId:
                  "qwen-sequential",
  
                strategy:
                  "sequential",
  
                trialCount: 2,
  
                successfulTrials: 1,
  
                successRate: 0.5,
  
                validationPassRate: 0.5,
  
                acceptancePassRate: 0.5,
  
                criterionPassRate: 0.7,
  
                averageInputTokens:
                  6000,
  
                averageOutputTokens:
                  4000,
  
                averageEstimatedCostUsd:
                  0,
  
                averageDurationMs:
                  300000,
  
                averageHumanInterventions:
                  1,
              },
            ]);
  
          const output =
            reporter.format(
              report,
            );
  
          expect(
            output,
          ).toContain(
            "qwen-sequential\tsequential\t2\t50%\t50%\t50%\t70%\t300s\t10000\t$0.0000\t1",
          );
        },
      );
  
      it(
        "reports an empty benchmark set clearly",
        () => {
          const reporter =
            new BenchmarkComparisonReporter();
  
          expect(
            reporter.format({
              rows: [],
            }),
          ).toBe(
            "No benchmark results.",
          );
        },
      );
    },
  );