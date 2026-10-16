import type {
    EvaluationStrategy,
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    evaluateRuns,
    type EvaluationSummary,
  } from "./run-evaluator.js";
  
  export interface StrategyEvaluation {
    strategy: EvaluationStrategy;
    summary: EvaluationSummary;
  }
  
  export interface StrategyComparison {
    overall: EvaluationSummary;
    strategies: StrategyEvaluation[];
  }
  
  const strategies: EvaluationStrategy[] = [
    "lightweight",
    "sequential",
    "parallel",
  ];
  
  export function compareStrategies(
    runs: FactoryRunMetrics[],
  ): StrategyComparison {
    return {
      overall: evaluateRuns(runs),
  
      strategies: strategies.map(
        (strategy) => ({
          strategy,
  
          summary: evaluateRuns(
            runs.filter(
              (run) =>
                run.strategy === strategy,
            ),
          ),
        }),
      ),
    };
  }