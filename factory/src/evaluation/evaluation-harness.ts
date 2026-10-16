import {
    factoryRunMetricsSchema,
    type FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    compareStrategies,
    type StrategyComparison,
  } from "./strategy-comparison.js";
  
  export interface EvaluationHarnessResult {
    runs: FactoryRunMetrics[];
    comparison: StrategyComparison;
  }
  
  export class EvaluationHarness {
    evaluate(
      runs: FactoryRunMetrics[],
    ): EvaluationHarnessResult {
      const validatedRuns =
        runs.map((run) =>
          factoryRunMetricsSchema.parse(
            run,
          ),
        );
  
      this.assertUniqueRunIds(
        validatedRuns,
      );
  
      return {
        runs: validatedRuns,
        comparison:
          compareStrategies(
            validatedRuns,
          ),
      };
    }
  
    private assertUniqueRunIds(
      runs: FactoryRunMetrics[],
    ): void {
      const runIds =
        new Set<string>();
  
      for (const run of runs) {
        if (runIds.has(run.runId)) {
          throw new Error(
            `Duplicate evaluation run ID: ${run.runId}`,
          );
        }
  
        runIds.add(run.runId);
      }
    }
  }