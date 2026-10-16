import type {
    RunArtifactStore,
  } from "../artifact/run-artifact-store.js";
  import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  import {
    factoryRunMetricsSchema,
    type FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import type {
    MultiModelReviewMetrics,
  } from "./multi-model-review-metrics.js";
  
  export class EvaluationArtifactStore {
    constructor(
      private readonly artifactStore:
        RunArtifactStore,
    ) {}
  
    async writeRunMetrics(
      metrics: FactoryRunMetrics,
    ): Promise<void> {
      const validatedMetrics =
        factoryRunMetricsSchema.parse(
          metrics,
        );
  
      await this.artifactStore.writeJson(
        validatedMetrics.runId,
        "metrics",
        validatedMetrics,
      );
    }
  
    async writeMultiModelReview(
      runId: string,
      review: MultiModelReviewResult,
    ): Promise<void> {
      this.assertRunId(runId);
  
      await this.artifactStore.writeJson(
        runId,
        "multi-model-review",
        review,
      );
    }
  
    async writeMultiModelReviewMetrics(
      runId: string,
      metrics: MultiModelReviewMetrics,
    ): Promise<void> {
      this.assertRunId(runId);
  
      await this.artifactStore.writeJson(
        runId,
        "multi-model-review-metrics",
        metrics,
      );
    }
  
    private assertRunId(
      runId: string,
    ): void {
      if (runId.length === 0) {
        throw new Error(
          "Run ID is required to persist multi-model review evidence.",
        );
      }
    }
  }