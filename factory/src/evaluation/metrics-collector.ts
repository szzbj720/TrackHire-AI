import type {
    EvaluationStrategy,
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  
  export type FactoryRunStage =
    | "planning"
    | "implementation"
    | "validation"
    | "review";
  
  export interface MetricsCollectorInput {
    runId: string;
    taskId: string;
    strategy: EvaluationStrategy;
    startedAt?: string;
  }
  
  export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  }
  
  export class MetricsCollector {
    private readonly runId: string;
    private readonly taskId: string;
    private readonly strategy: EvaluationStrategy;
    private readonly startedAt: string;
  
    private success = false;
    private validationFailures = 0;
    private repairAttempts = 0;
    private humanInterventions = 0;
    private reviewFindings = 0;
  
    private inputTokens = 0;
    private outputTokens = 0;
    private estimatedCostUsd = 0;
  
    private readonly stageDurations: Record<
      FactoryRunStage,
      number
    > = {
      planning: 0,
      implementation: 0,
      validation: 0,
      review: 0,
    };
  
    constructor(input: MetricsCollectorInput) {
      this.runId = input.runId;
      this.taskId = input.taskId;
      this.strategy = input.strategy;
      this.startedAt =
        input.startedAt ??
        new Date().toISOString();
    }
  
    recordSuccess(): void {
      this.success = true;
    }
  
    recordValidationFailure(): void {
      this.validationFailures += 1;
    }
  
    recordRepairAttempt(): void {
      this.repairAttempts += 1;
    }
  
    recordHumanIntervention(): void {
      this.humanInterventions += 1;
    }
  
    recordReviewFindings(
      count: number,
    ): void {
      this.assertNonnegativeInteger(
        count,
        "Review finding count",
      );
  
      this.reviewFindings += count;
    }
  
    recordTokenUsage(
      usage: TokenUsage,
    ): void {
      this.assertNonnegativeInteger(
        usage.inputTokens,
        "Input token count",
      );
  
      this.assertNonnegativeInteger(
        usage.outputTokens,
        "Output token count",
      );
  
      if (
        !Number.isFinite(
          usage.estimatedCostUsd,
        ) ||
        usage.estimatedCostUsd < 0
      ) {
        throw new Error(
          "Estimated cost must be a nonnegative finite number.",
        );
      }
  
      this.inputTokens +=
        usage.inputTokens;
  
      this.outputTokens +=
        usage.outputTokens;
  
      this.estimatedCostUsd +=
        usage.estimatedCostUsd;
    }
  
    recordStageDuration(
      stage: FactoryRunStage,
      durationMs: number,
    ): void {
      this.assertNonnegativeInteger(
        durationMs,
        "Stage duration",
      );
  
      this.stageDurations[stage] +=
        durationMs;
    }
  
    complete(
      completedAt = new Date().toISOString(),
    ): FactoryRunMetrics {
      const startedMs =
        Date.parse(this.startedAt);
  
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
  
      return {
        runId: this.runId,
        taskId: this.taskId,
        strategy: this.strategy,
  
        success: this.success,
        firstPassSuccess:
          this.success &&
          this.validationFailures === 0 &&
          this.repairAttempts === 0,
  
        validationFailures:
          this.validationFailures,
        repairAttempts:
          this.repairAttempts,
        humanInterventions:
          this.humanInterventions,
        reviewFindings:
          this.reviewFindings,
  
        inputTokens: this.inputTokens,
        outputTokens:
          this.outputTokens,
        estimatedCostUsd:
          this.estimatedCostUsd,
  
        planningDurationMs:
          this.stageDurations.planning,
        implementationDurationMs:
          this.stageDurations
            .implementation,
        validationDurationMs:
          this.stageDurations.validation,
        reviewDurationMs:
          this.stageDurations.review,
  
        totalDurationMs:
          completedMs - startedMs,
  
        startedAt: this.startedAt,
        completedAt,
      };
    }
  
    private assertNonnegativeInteger(
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
  }