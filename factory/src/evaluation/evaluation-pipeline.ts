import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    EvaluationArtifactStore,
  } from "./evaluation-artifact-store.js";
  import {
    EvaluationHarness,
    type EvaluationHarnessResult,
  } from "./evaluation-harness.js";
  
  export interface EvaluationPipelineResult {
    metrics: FactoryRunMetrics;
    evaluation: EvaluationHarnessResult;
  }
  
  export class EvaluationPipeline {
    constructor(
      private readonly artifactStore:
        EvaluationArtifactStore,
      private readonly harness:
        EvaluationHarness =
          new EvaluationHarness(),
    ) {}
  
    async process(
      metrics: FactoryRunMetrics,
      benchmarkRuns: FactoryRunMetrics[] = [],
    ): Promise<EvaluationPipelineResult> {
      await this.artifactStore.writeRunMetrics(
        metrics,
      );
  
      const evaluation =
        this.harness.evaluate([
          ...benchmarkRuns,
          metrics,
        ]);
  
      return {
        metrics,
        evaluation,
      };
    }
  }