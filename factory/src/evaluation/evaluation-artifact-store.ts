import type {
    RunArtifactStore,
  } from "../artifact/run-artifact-store.js";
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
  }