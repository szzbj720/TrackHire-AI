import type {
    BenchmarkAggregate,
  } from "./benchmark-result-aggregator.js";
  
  export interface BenchmarkComparisonRow {
    targetId: string;
  
    strategy: string;
  
    trials: number;
  
    successRate: number;
  
    validationPassRate: number;
  
    acceptancePassRate: number;
  
    criterionPassRate: number;
  
    averageDurationSeconds: number;
  
    averageInputTokens: number;
  
    averageOutputTokens: number;
  
    averageTotalTokens: number;
  
    averageEstimatedCostUsd: number;
  
    averageHumanInterventions: number;
  }
  
  export interface BenchmarkComparisonReport {
    rows: BenchmarkComparisonRow[];
  }
  
  function round(
    value: number,
    digits = 2,
  ): number {
    const factor =
      10 ** digits;
  
    return (
      Math.round(
        value * factor,
      ) / factor
    );
  }
  
  function toPercent(
    value: number,
  ): number {
    return round(
      value * 100,
      1,
    );
  }
  
  export class BenchmarkComparisonReporter {
    create(
      aggregates: BenchmarkAggregate[],
    ): BenchmarkComparisonReport {
      const rows =
        aggregates.map(
          (
            aggregate,
          ): BenchmarkComparisonRow => {
            const averageTotalTokens =
              aggregate.averageInputTokens +
              aggregate.averageOutputTokens;
  
            return {
              targetId:
                aggregate.targetId,
  
              strategy:
                aggregate.strategy,
  
              trials:
                aggregate.trialCount,
  
              successRate:
                toPercent(
                  aggregate.successRate,
                ),
  
              validationPassRate:
                toPercent(
                  aggregate.validationPassRate,
                ),
  
              acceptancePassRate:
                toPercent(
                  aggregate.acceptancePassRate,
                ),
  
              criterionPassRate:
                toPercent(
                  aggregate.criterionPassRate,
                ),
  
              averageDurationSeconds:
                round(
                  aggregate.averageDurationMs /
                    1000,
                  1,
                ),
  
              averageInputTokens:
                round(
                  aggregate.averageInputTokens,
                ),
  
              averageOutputTokens:
                round(
                  aggregate.averageOutputTokens,
                ),
  
              averageTotalTokens:
                round(
                  averageTotalTokens,
                ),
  
              averageEstimatedCostUsd:
                round(
                  aggregate.averageEstimatedCostUsd,
                  4,
                ),
  
              averageHumanInterventions:
                round(
                  aggregate.averageHumanInterventions,
                ),
            };
          },
        );
  
      return {
        rows,
      };
    }
  
    format(
      report: BenchmarkComparisonReport,
    ): string {
      if (
        report.rows.length === 0
      ) {
        return "No benchmark results.";
      }
  
      const header = [
        "Target",
        "Strategy",
        "Trials",
        "Success",
        "Validation",
        "Acceptance",
        "Criteria",
        "Avg Time",
        "Avg Tokens",
        "Avg Cost",
        "Avg Human",
      ].join("\t");
  
      const rows =
        report.rows.map(
          (row) =>
            [
              row.targetId,
              row.strategy,
              row.trials,
              `${row.successRate}%`,
              `${row.validationPassRate}%`,
              `${row.acceptancePassRate}%`,
              `${row.criterionPassRate}%`,
              `${row.averageDurationSeconds}s`,
              row.averageTotalTokens,
              `$${row.averageEstimatedCostUsd.toFixed(
                4,
              )}`,
              row.averageHumanInterventions,
            ].join("\t"),
        );
  
      return [
        header,
        ...rows,
      ].join("\n");
    }
  }