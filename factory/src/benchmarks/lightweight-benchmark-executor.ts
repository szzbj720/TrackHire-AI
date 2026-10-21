import type {
    BenchmarkCriterionResult,
  } from "./benchmark-acceptance-evaluator.js";
  
  import type {
    BenchmarkStrategyExecution,
    BenchmarkStrategyExecutor,
  } from "./benchmark-runner.js";
  
  import {
    BenchmarkTaskAdapter,
  } from "./benchmark-task-adapter.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    BenchmarkModelProviderSnapshot,
  } from "./benchmark-model-provider.js";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    BenchmarkUsage,
  } from "../schemas/benchmark-result.js";
  
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    Builder,
  } from "../agents/builder.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  export interface LightweightBenchmarkAcceptanceCollector {
    collect(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
      task: EngineeringTask;
    }): Promise<BenchmarkCriterionResult[]>;
  }
  
  export interface LightweightBenchmarkModelEvidenceSource {
    snapshot(): BenchmarkModelProviderSnapshot;
  }
  
  export interface LightweightBenchmarkExecutorOptions {
    runId: string;
    plan: ImplementationPlan;
    builder: Builder;
    validator: Validator;
    acceptanceCollector: LightweightBenchmarkAcceptanceCollector;
    modelEvidence?: LightweightBenchmarkModelEvidenceSource;
  }
  
  function usageFromSnapshot(
    snapshot: BenchmarkModelProviderSnapshot,
  ): BenchmarkUsage {
    return {
      inputTokens: snapshot.inputTokens,
      outputTokens: snapshot.outputTokens,
      estimatedCostUsd: snapshot.estimatedCostUsd,
    };
  }
  
  function zeroUsage(): BenchmarkUsage {
    return {
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
    };
  }
  
  export class LightweightBenchmarkExecutor
    implements BenchmarkStrategyExecutor {
    private readonly taskAdapter =
      new BenchmarkTaskAdapter();
  
    constructor(
      private readonly options:
        LightweightBenchmarkExecutorOptions,
    ) {}
  
    async execute(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
    }): Promise<BenchmarkStrategyExecution> {
      const createdTask =
        this.taskAdapter.create({
          scenario: input.scenario,
          runId: this.options.runId,
        });
  
      const implementationTask:
        EngineeringTask = {
          ...createdTask,
  
          status: "IMPLEMENTING",
  
          plan: this.options.plan,
  
          strategy: {
            mode: "single-agent",
            reasoning:
              "Benchmark lightweight single-agent execution.",
          },
  
          updatedAt:
            createdTask.updatedAt,
        };
  
      const implementation =
        await this.options.builder.implement({
          task: implementationTask,
          plan: this.options.plan,
          worktreePath: input.workspace.path,
        });
  
      let taskAfterExecution:
        EngineeringTask;
  
      if (
        implementation.requiresHumanInput
      ) {
        taskAfterExecution = {
          ...implementationTask,
          status: "NEEDS_HUMAN",
          updatedAt:
            new Date().toISOString(),
        };
      } else {
        const validation =
          await this.options.validator.validate(
            input.workspace.path,
          );
  
        taskAfterExecution = {
          ...implementationTask,
  
          status:
            validation.passed
              ? "AWAITING_FINAL_APPROVAL"
              : "NEEDS_HUMAN",
  
          updatedAt:
            new Date().toISOString(),
        };
      }
  
      const criterionResults =
        await this.options
          .acceptanceCollector
          .collect({
            scenario: input.scenario,
            workspace: input.workspace,
            task: taskAfterExecution,
          });
  
      const usage =
        this.options.modelEvidence
          ? usageFromSnapshot(
              this.options
                .modelEvidence
                .snapshot(),
            )
          : zeroUsage();
  
      return {
        criterionResults,
        usage,
  
        humanInterventions:
          taskAfterExecution.status ===
          "NEEDS_HUMAN"
            ? 1
            : 0,
      };
    }
  }