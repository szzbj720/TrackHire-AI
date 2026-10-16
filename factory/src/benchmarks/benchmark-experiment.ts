import type {
    BenchmarkResult,
    BenchmarkStrategy,
  } from "../schemas/benchmark-result.js";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  import type {
    BenchmarkRunRequest,
    BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  export interface BenchmarkRunnerAdapter {
    run(
      request: BenchmarkRunRequest,
    ): Promise<BenchmarkResult>;
  }
  
  export interface BenchmarkExperimentTarget {
    strategy: BenchmarkStrategy;
  
    executor: BenchmarkStrategyExecutor;
  
    validator: Validator;
  }
  
  export interface BenchmarkExperimentRequest {
    experimentId: string;
  
    scenario: BenchmarkScenario;
  
    repositoryRoot: string;
  
    baseRevision: string;
  
    targets: BenchmarkExperimentTarget[];
  }
  
  export interface BenchmarkExperimentResult {
    experimentId: string;
  
    scenarioId: string;
  
    baselineRevision: string;
  
    results: BenchmarkResult[];
  
    successfulStrategies:
      BenchmarkStrategy[];
  
    failedStrategies:
      BenchmarkStrategy[];
  }
  
  function requireIdentifier(
    value: string,
    label: string,
  ): string {
    const trimmed =
      value.trim();
  
    if (!trimmed) {
      throw new Error(
        `${label} cannot be empty.`,
      );
    }
  
    return trimmed;
  }
  
  function validateTargets(
    targets: BenchmarkExperimentTarget[],
  ): void {
    if (targets.length < 2) {
      throw new Error(
        "A benchmark experiment requires at least two strategy targets.",
      );
    }
  
    const strategies =
      new Set<BenchmarkStrategy>();
  
    for (const target of targets) {
      if (
        strategies.has(
          target.strategy,
        )
      ) {
        throw new Error(
          `Duplicate benchmark strategy target: ${target.strategy}.`,
        );
      }
  
      strategies.add(
        target.strategy,
      );
    }
  }
  
  export class BenchmarkExperiment {
    constructor(
      private readonly runner:
        BenchmarkRunnerAdapter,
    ) {}
  
    async run(
      request: BenchmarkExperimentRequest,
    ): Promise<BenchmarkExperimentResult> {
      const experimentId =
        requireIdentifier(
          request.experimentId,
          "Benchmark experiment ID",
        );
  
      validateTargets(
        request.targets,
      );
  
      const results:
        BenchmarkResult[] = [];
  
      for (
        const target
        of request.targets
      ) {
        const result =
          await this.runner.run({
            runId:
              `${experimentId}-${target.strategy}`,
  
            scenario:
              request.scenario,
  
            strategy:
              target.strategy,
  
            repositoryRoot:
              request.repositoryRoot,
  
            baseRevision:
              request.baseRevision,
  
            executor:
              target.executor,
  
            validator:
              target.validator,
          });
  
        results.push(
          result,
        );
      }
  
      const baselineRevisions =
        new Set(
          results.map(
            (result) =>
              result.baselineRevision,
          ),
        );
  
      if (
        baselineRevisions.size !== 1
      ) {
        throw new Error(
          "Benchmark strategies did not execute from the same baseline revision.",
        );
      }
  
      const baselineRevision =
        results[0]?.baselineRevision;
  
      if (!baselineRevision) {
        throw new Error(
          "Benchmark experiment produced no results.",
        );
      }
  
      return {
        experimentId,
  
        scenarioId:
          request.scenario.id,
  
        baselineRevision,
  
        results,
  
        successfulStrategies:
          results
            .filter(
              (result) =>
                result.success,
            )
            .map(
              (result) =>
                result.strategy,
            ),
  
        failedStrategies:
          results
            .filter(
              (result) =>
                !result.success,
            )
            .map(
              (result) =>
                result.strategy,
            ),
      };
    }
  }