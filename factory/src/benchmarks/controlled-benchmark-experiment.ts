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
    BenchmarkFixture,
  } from "./benchmark-fixture-manager.js";
  
  import type {
    BenchmarkRunRequest,
    BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  export interface ControlledBenchmarkRunner {
    run(
      request: BenchmarkRunRequest,
    ): Promise<BenchmarkResult>;
  }
  
  export interface ControlledBenchmarkTarget {
    targetId: string;
  
    strategy: BenchmarkStrategy;
  
    executor: BenchmarkStrategyExecutor;
  
    validator: Validator;
  }
  
  export interface ControlledBenchmarkExperimentRequest {
    experimentId: string;
  
    scenario: BenchmarkScenario;
  
    repositoryRoot: string;
  
    baseRevision: string;
  
    repetitions: number;
  
    targets: ControlledBenchmarkTarget[];
  
    fixtures?: BenchmarkFixture[];
  }
  
  export interface ControlledBenchmarkTrial {
    targetId: string;
  
    trialNumber: number;
  
    runId: string;
  
    result: BenchmarkResult;
  }
  
  export interface ControlledBenchmarkTargetResult {
    targetId: string;
  
    strategy: BenchmarkStrategy;
  
    trials: ControlledBenchmarkTrial[];
  }
  
  export interface ControlledBenchmarkExperimentResult {
    experimentId: string;
  
    scenarioId: string;
  
    repetitions: number;
  
    baselineRevision: string;
  
    targets: ControlledBenchmarkTargetResult[];
  
    trials: ControlledBenchmarkTrial[];
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
  
  function validateRepetitions(
    repetitions: number,
  ): void {
    if (
      !Number.isInteger(
        repetitions,
      ) ||
      repetitions < 1
    ) {
      throw new Error(
        "Benchmark repetitions must be a positive integer.",
      );
    }
  }
  
  function validateTargets(
    targets: ControlledBenchmarkTarget[],
  ): void {
    if (targets.length < 2) {
      throw new Error(
        "A controlled benchmark experiment requires at least two targets.",
      );
    }
  
    const targetIds =
      new Set<string>();
  
    for (const target of targets) {
      const targetId =
        requireIdentifier(
          target.targetId,
          "Benchmark target ID",
        );
  
      if (
        targetIds.has(
          targetId,
        )
      ) {
        throw new Error(
          `Duplicate benchmark target ID: ${targetId}.`,
        );
      }
  
      targetIds.add(
        targetId,
      );
    }
  }
  
  function createTrialRunId(
    experimentId: string,
    targetId: string,
    trialNumber: number,
  ): string {
    return [
      experimentId,
      targetId,
      `trial-${trialNumber}`,
    ].join("-");
  }
  
  export class ControlledBenchmarkExperiment {
    constructor(
      private readonly runner:
        ControlledBenchmarkRunner,
    ) {}
  
    async run(
      request: ControlledBenchmarkExperimentRequest,
    ): Promise<ControlledBenchmarkExperimentResult> {
      const experimentId =
        requireIdentifier(
          request.experimentId,
          "Benchmark experiment ID",
        );
  
      validateRepetitions(
        request.repetitions,
      );
  
      validateTargets(
        request.targets,
      );
  
      const targetResults:
        ControlledBenchmarkTargetResult[] =
          [];
  
      const allTrials:
        ControlledBenchmarkTrial[] =
          [];
  
      for (
        const target
        of request.targets
      ) {
        const targetId =
          requireIdentifier(
            target.targetId,
            "Benchmark target ID",
          );
  
        const trials:
          ControlledBenchmarkTrial[] =
            [];
  
        for (
          let trialNumber = 1;
          trialNumber <=
            request.repetitions;
          trialNumber += 1
        ) {
          const runId =
            createTrialRunId(
              experimentId,
              targetId,
              trialNumber,
            );
  
          const runRequest:
            BenchmarkRunRequest = {
            runId,
  
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
          };
  
          if (
            request.fixtures !==
            undefined
          ) {
            runRequest.fixtures =
              request.fixtures;
          }
  
          const result =
            await this.runner.run(
              runRequest,
            );
  
          const trial:
            ControlledBenchmarkTrial = {
            targetId,
  
            trialNumber,
  
            runId,
  
            result,
          };
  
          trials.push(
            trial,
          );
  
          allTrials.push(
            trial,
          );
        }
  
        targetResults.push({
          targetId,
  
          strategy:
            target.strategy,
  
          trials,
        });
      }
  
      const baselineRevisions =
        new Set(
          allTrials.map(
            (trial) =>
              trial.result
                .baselineRevision,
          ),
        );
  
      if (
        baselineRevisions.size !== 1
      ) {
        throw new Error(
          "Controlled benchmark trials did not execute from the same baseline revision.",
        );
      }
  
      const baselineRevision =
        allTrials[0]
          ?.result
          .baselineRevision;
  
      if (!baselineRevision) {
        throw new Error(
          "Controlled benchmark experiment produced no trials.",
        );
      }
  
      return {
        experimentId,
  
        scenarioId:
          request.scenario.id,
  
        repetitions:
          request.repetitions,
  
        baselineRevision,
  
        targets:
          targetResults,
  
        trials:
          allTrials,
      };
    }
  }