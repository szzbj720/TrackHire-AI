import type {
  BenchmarkResult,
  BenchmarkStrategy,
} from "../schemas/benchmark-result.js";

export interface FactoryBenchScenarioSummary {
  scenarioId: string;
  strategy: BenchmarkStrategy;
  success: boolean;
  validationPassed: boolean;
  acceptancePassed: boolean;
  passedCriteria: number;
  failedCriteria: number;
  totalCriteria: number;
}

export interface FactoryBenchSuiteSummary {
  scenarioCount: number;
  successfulScenarios: number;
  scenarioSuccessRate: number;
  validationPassRate: number;
  acceptancePassRate: number;
  passedCriteria: number;
  failedCriteria: number;
  totalCriteria: number;
  criterionPassRate: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCostUsd: number;
  totalDurationMs: number;
  totalHumanInterventions: number;
  scenarios: FactoryBenchScenarioSummary[];
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

export class FactoryBenchSuiteSummarizer {
  summarize(
    results: BenchmarkResult[],
  ): FactoryBenchSuiteSummary {
    if (results.length === 0) {
      throw new Error(
        "Cannot summarize an empty FactoryBench result set.",
      );
    }

    const scenarioIds =
      results.map(
        (result) => result.scenarioId,
      );

    if (
      new Set(scenarioIds).size !==
      scenarioIds.length
    ) {
      throw new Error(
        "FactoryBench suite summary requires one result per scenario.",
      );
    }

    const successfulScenarios =
      results.filter(
        (result) => result.success,
      ).length;

    const validationPasses =
      results.filter(
        (result) =>
          result.validation.passed,
      ).length;

    const acceptancePasses =
      results.filter(
        (result) =>
          result.acceptance.passed,
      ).length;

    const passedCriteria =
      results.reduce(
        (sum, result) =>
          sum +
          result.acceptance
            .passedCriteria,
        0,
      );

    const failedCriteria =
      results.reduce(
        (sum, result) =>
          sum +
          result.acceptance
            .failedCriteria,
        0,
      );

    const totalCriteria =
      results.reduce(
        (sum, result) =>
          sum +
          result.acceptance
            .totalCriteria,
        0,
      );

    const totalInputTokens =
      results.reduce(
        (sum, result) =>
          sum +
          result.usage.inputTokens,
        0,
      );

    const totalOutputTokens =
      results.reduce(
        (sum, result) =>
          sum +
          result.usage.outputTokens,
        0,
      );

    const totalEstimatedCostUsd =
      results.reduce(
        (sum, result) =>
          sum +
          result.usage
            .estimatedCostUsd,
        0,
      );

    const totalDurationMs =
      results.reduce(
        (sum, result) =>
          sum + result.durationMs,
        0,
      );

    const totalHumanInterventions =
      results.reduce(
        (sum, result) =>
          sum +
          result.humanInterventions,
        0,
      );

    const scenarios =
      results.map(
        (
          result,
        ): FactoryBenchScenarioSummary => ({
          scenarioId:
            result.scenarioId,
          strategy:
            result.strategy,
          success:
            result.success,
          validationPassed:
            result.validation.passed,
          acceptancePassed:
            result.acceptance.passed,
          passedCriteria:
            result.acceptance
              .passedCriteria,
          failedCriteria:
            result.acceptance
              .failedCriteria,
          totalCriteria:
            result.acceptance
              .totalCriteria,
        }),
      );

    return {
      scenarioCount:
        results.length,
      successfulScenarios,
      scenarioSuccessRate:
        rate(
          successfulScenarios,
          results.length,
        ),
      validationPassRate:
        rate(
          validationPasses,
          results.length,
        ),
      acceptancePassRate:
        rate(
          acceptancePasses,
          results.length,
        ),
      passedCriteria,
      failedCriteria,
      totalCriteria,
      criterionPassRate:
        rate(
          passedCriteria,
          totalCriteria,
        ),
      totalInputTokens,
      totalOutputTokens,
      totalTokens:
        totalInputTokens +
        totalOutputTokens,
      totalEstimatedCostUsd,
      totalDurationMs,
      totalHumanInterventions,
      scenarios,
    };
  }
}
