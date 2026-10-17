import type {
    BenchmarkResult,
    BenchmarkStrategy,
  } from "../schemas/benchmark-result.js";
  
  export interface BenchmarkAggregate {
    targetId: string;
  
    strategy: BenchmarkStrategy;
  
    trialCount: number;
  
    successfulTrials: number;
  
    successRate: number;
  
    validationPassRate: number;
  
    acceptancePassRate: number;
  
    criterionPassRate: number;
  
    averageInputTokens: number;
  
    averageOutputTokens: number;
  
    averageEstimatedCostUsd: number;
  
    averageDurationMs: number;
  
    averageHumanInterventions: number;
  }
  
  export interface BenchmarkAggregateInput {
    targetId: string;
  
    strategy: BenchmarkStrategy;
  
    results: BenchmarkResult[];
  }
  
  function average(
    values: number[],
  ): number {
    if (values.length === 0) {
      return 0;
    }
  
    const total =
      values.reduce(
        (sum, value) =>
          sum + value,
        0,
      );
  
    return total / values.length;
  }
  
  function rate(
    passed: number,
    total: number,
  ): number {
    if (total === 0) {
      return 0;
    }
  
    return passed / total;
  }
  
  export class BenchmarkResultAggregator {
    aggregate(
      input: BenchmarkAggregateInput,
    ): BenchmarkAggregate {
      if (input.results.length === 0) {
        throw new Error(
          "Cannot aggregate an empty benchmark result set.",
        );
      }
  
      const successfulTrials =
        input.results.filter(
          (result) =>
            result.success,
        ).length;
  
      const validationPasses =
        input.results.filter(
          (result) =>
            result.validation.passed,
        ).length;
  
      const acceptancePasses =
        input.results.filter(
          (result) =>
            result.acceptance.passed,
        ).length;
  
      const passedCriteria =
        input.results.reduce(
          (sum, result) =>
            sum +
            result.acceptance
              .passedCriteria,
          0,
        );
  
      const totalCriteria =
        input.results.reduce(
          (sum, result) =>
            sum +
            result.acceptance
              .totalCriteria,
          0,
        );
  
      return {
        targetId:
          input.targetId,
  
        strategy:
          input.strategy,
  
        trialCount:
          input.results.length,
  
        successfulTrials,
  
        successRate:
          rate(
            successfulTrials,
            input.results.length,
          ),
  
        validationPassRate:
          rate(
            validationPasses,
            input.results.length,
          ),
  
        acceptancePassRate:
          rate(
            acceptancePasses,
            input.results.length,
          ),
  
        criterionPassRate:
          rate(
            passedCriteria,
            totalCriteria,
          ),
  
        averageInputTokens:
          average(
            input.results.map(
              (result) =>
                result.usage
                  .inputTokens,
            ),
          ),
  
        averageOutputTokens:
          average(
            input.results.map(
              (result) =>
                result.usage
                  .outputTokens,
            ),
          ),
  
        averageEstimatedCostUsd:
          average(
            input.results.map(
              (result) =>
                result.usage
                  .estimatedCostUsd,
            ),
          ),
  
        averageDurationMs:
          average(
            input.results.map(
              (result) =>
                result.durationMs,
            ),
          ),
  
        averageHumanInterventions:
          average(
            input.results.map(
              (result) =>
                result
                  .humanInterventions,
            ),
          ),
      };
    }
  }