import type {
    ParallelValidationResult,
  } from "../orchestrator/parallel-validation-workflow.js";
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  
  export interface ParallelRunMetricsInput {
    runId: string;
    run: ParallelValidationResult;
    repairAttempts?: number;
    startedAt: string;
    completedAt: string;
  }
  
  export function createParallelRunMetrics(
    input: ParallelRunMetricsInput,
  ): FactoryRunMetrics {
    const totalDurationMs =
      calculateDuration(
        input.startedAt,
        input.completedAt,
      );
  
    const repairAttempts =
      input.repairAttempts ?? 0;
  
    assertNonnegativeInteger(
      repairAttempts,
      "Repair attempt count",
    );
  
    const finalValidationFailed =
      !input.run.validation.passed;
  
    const validationFailures =
      repairAttempts +
      (finalValidationFailed ? 1 : 0);
  
    const reviewFindings =
      input.run.review?.review
        ?.findings.length ?? 0;
  
    const humanInterventions =
      input.run.task.status ===
      "NEEDS_HUMAN"
        ? 1
        : 0;
  
    const success =
      input.run.task.status ===
        "AWAITING_FINAL_APPROVAL" &&
      input.run.validation.passed &&
      input.run.review !== undefined;
  
    return {
      runId: input.runId,
      taskId: input.run.task.id,
  
      strategy: "parallel",
  
      success,
  
      firstPassSuccess:
        success &&
        validationFailures === 0 &&
        repairAttempts === 0,
  
      validationFailures,
      repairAttempts,
      humanInterventions,
      reviewFindings,
  
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
  
      planningDurationMs: 0,
      implementationDurationMs: 0,
  
      validationDurationMs:
        input.run.validation.durationMs,
  
      reviewDurationMs: 0,
  
      totalDurationMs,
  
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    };
  }
  
  function calculateDuration(
    startedAt: string,
    completedAt: string,
  ): number {
    const startedMs =
      Date.parse(startedAt);
  
    const completedMs =
      Date.parse(completedAt);
  
    if (
      Number.isNaN(startedMs) ||
      Number.isNaN(completedMs)
    ) {
      throw new Error(
        "Run timestamps must be valid ISO date strings.",
      );
    }
  
    if (completedMs < startedMs) {
      throw new Error(
        "Run completion cannot occur before the run started.",
      );
    }
  
    return completedMs - startedMs;
  }
  
  function assertNonnegativeInteger(
    value: number,
    label: string,
  ): void {
    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new Error(
        `${label} must be a nonnegative integer.`,
      );
    }
  }