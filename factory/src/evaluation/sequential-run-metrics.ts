import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import type {
    SequentialFactoryRun,
    SequentialFactoryStopReason,
  } from "../orchestrator/sequential-factory.js";
  
  export interface SequentialRunMetricsInput {
    runId: string;
    run: SequentialFactoryRun;
    stopReason: SequentialFactoryStopReason;
    startedAt: string;
    completedAt: string;
  }
  
  export function createSequentialRunMetrics(
    input: SequentialRunMetricsInput,
  ): FactoryRunMetrics {
    const startedMs =
      Date.parse(input.startedAt);
  
    const completedMs =
      Date.parse(input.completedAt);
  
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
  
    const repairAttempts =
      input.run.repairs.length;
  
    const validationFailures =
      inferValidationFailures(
        input.run,
      );
  
    const humanInterventions =
      inferHumanInterventions(
        input.stopReason,
      );
  
    const reviewFindings =
      input.run.review?.findings.length ??
      0;
  
    const success =
      input.stopReason === "COMPLETE" &&
      input.run.task.status ===
        "COMPLETE";
  
    return {
      runId: input.runId,
      taskId: input.run.task.id,
  
      strategy: "sequential",
  
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
      validationDurationMs: 0,
      reviewDurationMs: 0,
  
      totalDurationMs:
        completedMs - startedMs,
  
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    };
  }
  
  function inferValidationFailures(
    run: SequentialFactoryRun,
  ): number {
    const failuresBeforeRepairs =
      run.repairs.length;
  
    const finalValidationFailed =
      run.validation !== undefined &&
      !run.validation.passed;
  
    return (
      failuresBeforeRepairs +
      (finalValidationFailed ? 1 : 0)
    );
  }
  
  function inferHumanInterventions(
    stopReason: SequentialFactoryStopReason,
  ): number {
    return stopReason ===
      "HUMAN_INPUT_REQUIRED"
      ? 1
      : 0;
  }