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
      if (runId.length === 0) {
        throw new Error(
          "Run ID is required to persist multi-model review evidence.",
        );
      }
  
      await this.artifactStore.writeJson(
        runId,
        "multi-model-review",
        review,
      );
    }
  }