import type {
    BenchmarkCriterionResult,
  } from "./benchmark-acceptance-evaluator.js";
  import {
    BenchmarkAcceptanceEvaluator,
  } from "./benchmark-acceptance-evaluator.js";
  
  import type {
    BenchmarkWorkspace,
    BenchmarkWorkspaceManager,
  } from "./benchmark-workspace-manager.js";
  
  import {
    benchmarkResultSchema,
    type BenchmarkResult,
    type BenchmarkStrategy,
    type BenchmarkUsage,
  } from "../schemas/benchmark-result.js";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  export interface BenchmarkStrategyExecution {
    criterionResults:
      BenchmarkCriterionResult[];
  
    usage: BenchmarkUsage;
  
    humanInterventions: number;
  }
  
  export interface BenchmarkStrategyExecutor {
    execute(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
    }): Promise<BenchmarkStrategyExecution>;
  }
  
  export interface BenchmarkRunRequest {
    runId: string;
  
    scenario: BenchmarkScenario;
  
    strategy: BenchmarkStrategy;
  
    repositoryRoot: string;
  
    baseRevision: string;
  
    executor: BenchmarkStrategyExecutor;
  
    validator: Validator;
  }
  
  export interface BenchmarkClock {
    now(): number;
    isoNow(): string;
  }
  
  const defaultClock: BenchmarkClock = {
    now() {
      return Date.now();
    },
  
    isoNow() {
      return new Date().toISOString();
    },
  };
  
  function toValidationResult(
    validation: ValidationResult,
  ) {
    return {
      passed:
        validation.passed,
  
      commandsRun:
        validation.checks.map(
          (check) => {
            const args =
              check.args.length > 0
                ? ` ${check.args.join(" ")}`
                : "";
  
            return `${check.command}${args}`;
          },
        ),
  
      failedCommands:
        validation.checks
          .filter(
            (check) =>
              !check.passed,
          )
          .map(
            (check) => {
              const args =
                check.args.length > 0
                  ? ` ${check.args.join(" ")}`
                  : "";
  
              return `${check.command}${args}`;
            },
          ),
    };
  }
  
  export class BenchmarkRunner {
    constructor(
      private readonly workspaceManager:
        BenchmarkWorkspaceManager,
  
      private readonly acceptanceEvaluator =
        new BenchmarkAcceptanceEvaluator(),
  
      private readonly clock:
        BenchmarkClock =
          defaultClock,
    ) {}
  
    async run(
      request: BenchmarkRunRequest,
    ): Promise<BenchmarkResult> {
      const startedAt =
        this.clock.isoNow();
  
      const startedAtMs =
        this.clock.now();
  
      const workspace =
        await this.workspaceManager.create({
          scenario:
            request.scenario,
  
          runId:
            request.runId,
  
          strategyId:
            request.strategy,
  
          repositoryRoot:
            request.repositoryRoot,
  
          baseRevision:
            request.baseRevision,
        });
  
      const execution =
        await request.executor.execute({
          scenario:
            request.scenario,
  
          workspace,
        });
  
      const validation =
        await request.validator.validate(
          workspace.path,
        );
  
      const acceptance =
        this.acceptanceEvaluator.evaluate(
          request.scenario,
          execution.criterionResults,
        );
  
      const completedAtMs =
        this.clock.now();
  
      const completedAt =
        this.clock.isoNow();
  
      const result = {
        runId:
          request.runId,
  
        scenarioId:
          request.scenario.id,
  
        strategy:
          request.strategy,
  
        baselineRevision:
          workspace.baselineRevision,
  
        workspacePath:
          workspace.path,
  
        workspaceBranch:
          workspace.branch,
  
        validation:
          toValidationResult(
            validation,
          ),
  
        acceptance: {
          passed:
            acceptance.passed,
  
          passedCriteria:
            acceptance.passedCriteria,
  
          failedCriteria:
            acceptance.failedCriteria,
  
          totalCriteria:
            acceptance.totalCriteria,
  
          scores:
            acceptance.scores,
  
          missingCriterionIds:
            acceptance.missingCriterionIds,
  
          unexpectedCriterionIds:
            acceptance.unexpectedCriterionIds,
        },
  
        usage:
          execution.usage,
  
        durationMs:
          Math.max(
            0,
            completedAtMs -
              startedAtMs,
          ),
  
        humanInterventions:
          execution.humanInterventions,
  
        success:
          validation.passed &&
          acceptance.passed,
  
        startedAt,
  
        completedAt,
      };
  
      return benchmarkResultSchema.parse(
        result,
      );
    }
  }