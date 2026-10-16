import type {
    LightweightWorkflowResult,
  } from "../orchestrator/lightweight-workflow.js";
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  
  export interface LightweightRunMetricsInput {
    runId: string;
    run: LightweightWorkflowResult;
    startedAt: string;
    completedAt: string;
  }
  
  export function createLightweightRunMetrics(
    input: LightweightRunMetricsInput,
  ): FactoryRunMetrics {
    const totalDurationMs =
      calculateDuration(
        input.startedAt,
        input.completedAt,
      );
  
    const validationFailures =
      input.run.validation !== undefined &&
      !input.run.validation.passed
        ? 1
        : 0;
  
    const humanInterventions =
      input.run.task.status ===
      "NEEDS_HUMAN"
        ? 1
        : 0;
  
    const success =
      input.run.task.status ===
        "AWAITING_FINAL_APPROVAL" &&
      input.run.validation?.passed === true;
  
    return {
      runId: input.runId,
      taskId: input.run.task.id,
  
      strategy: "lightweight",
  
      success,
      firstPassSuccess:
        success &&
        validationFailures === 0,
  
      validationFailures,
      repairAttempts: 0,
      humanInterventions,
      reviewFindings: 0,
  
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
  
      planningDurationMs: 0,
      implementationDurationMs: 0,
      validationDurationMs:
        input.run.validation?.durationMs ??
        0,
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