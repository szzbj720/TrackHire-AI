import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  
  export interface EvaluationSummary {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  
    successRate: number;
    firstPassSuccessRate: number;
  
    averageValidationFailures: number;
    averageRepairAttempts: number;
    averageHumanInterventions: number;
    averageReviewFindings: number;
  
    averageInputTokens: number;
    averageOutputTokens: number;
    averageEstimatedCostUsd: number;
  
    averagePlanningDurationMs: number;
    averageImplementationDurationMs: number;
    averageValidationDurationMs: number;
    averageReviewDurationMs: number;
    averageTotalDurationMs: number;
  }
  
  export function evaluateRuns(
    runs: FactoryRunMetrics[],
  ): EvaluationSummary {
    if (runs.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
  
        successRate: 0,
        firstPassSuccessRate: 0,
  
        averageValidationFailures: 0,
        averageRepairAttempts: 0,
        averageHumanInterventions: 0,
        averageReviewFindings: 0,
  
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageEstimatedCostUsd: 0,
  
        averagePlanningDurationMs: 0,
        averageImplementationDurationMs: 0,
        averageValidationDurationMs: 0,
        averageReviewDurationMs: 0,
        averageTotalDurationMs: 0,
      };
    }
  
    const successfulRuns =
      runs.filter(
        (run) => run.success,
      ).length;
  
    const firstPassRuns =
      runs.filter(
        (run) => run.firstPassSuccess,
      ).length;
  
    return {
      totalRuns: runs.length,
  
      successfulRuns,
  
      failedRuns:
        runs.length - successfulRuns,
  
      successRate:
        successfulRuns / runs.length,
  
      firstPassSuccessRate:
        firstPassRuns / runs.length,
  
      averageValidationFailures:
        average(
          runs.map(
            (run) =>
              run.validationFailures,
          ),
        ),
  
      averageRepairAttempts:
        average(
          runs.map(
            (run) =>
              run.repairAttempts,
          ),
        ),
  
      averageHumanInterventions:
        average(
          runs.map(
            (run) =>
              run.humanInterventions,
          ),
        ),
  
      averageReviewFindings:
        average(
          runs.map(
            (run) =>
              run.reviewFindings,
          ),
        ),
  
      averageInputTokens:
        average(
          runs.map(
            (run) =>
              run.inputTokens,
          ),
        ),
  
      averageOutputTokens:
        average(
          runs.map(
            (run) =>
              run.outputTokens,
          ),
        ),
  
      averageEstimatedCostUsd:
        average(
          runs.map(
            (run) =>
              run.estimatedCostUsd,
          ),
        ),
  
      averagePlanningDurationMs:
        average(
          runs.map(
            (run) =>
              run.planningDurationMs,
          ),
        ),
  
      averageImplementationDurationMs:
        average(
          runs.map(
            (run) =>
              run.implementationDurationMs,
          ),
        ),
  
      averageValidationDurationMs:
        average(
          runs.map(
            (run) =>
              run.validationDurationMs,
          ),
        ),
  
      averageReviewDurationMs:
        average(
          runs.map(
            (run) =>
              run.reviewDurationMs,
          ),
        ),
  
      averageTotalDurationMs:
        average(
          runs.map(
            (run) =>
              run.totalDurationMs,
          ),
        ),
    };
  }
  
  function average(
    values: number[],
  ): number {
    if (values.length === 0) {
      return 0;
    }
  
    return (
      values.reduce(
        (sum, value) =>
          sum + value,
        0,
      ) / values.length
    );
  }