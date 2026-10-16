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
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  export interface BenchmarkAcceptanceCollector {
    collect(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
      task: EngineeringTask;
    }): Promise<BenchmarkCriterionResult[]>;
  }
  
  export interface SequentialBenchmarkExecutorOptions {
    runId: string;
  
    plan: ImplementationPlan;
  
    implementationWorkflow:
      ImplementationWorkflow;
  
    acceptanceCollector:
      BenchmarkAcceptanceCollector;
  
    usage?: BenchmarkUsage;
  }
  
  export class SequentialBenchmarkExecutor
    implements BenchmarkStrategyExecutor {
    private readonly taskAdapter =
      new BenchmarkTaskAdapter();
  
    constructor(
      private readonly options:
        SequentialBenchmarkExecutorOptions,
    ) {}
  
    async execute(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
    }): Promise<BenchmarkStrategyExecution> {
      const createdTask =
        this.taskAdapter.create({
          scenario:
            input.scenario,
  
          runId:
            this.options.runId,
        });
  
      const implementationTask:
        EngineeringTask = {
          ...createdTask,
  
          status:
            "IMPLEMENTING",
  
          plan:
            this.options.plan,
  
          updatedAt:
            createdTask.updatedAt,
        };
  
      const result =
        await this.options
          .implementationWorkflow
          .run(
            implementationTask,
  
            input.workspace.path,
  
            input.workspace
              .baselineRevision,
  
            {
              worktree: {
                path:
                  input.workspace.path,
  
                branch:
                  input.workspace.branch,
              },
            },
          );
  
      const criterionResults =
        await this.options
          .acceptanceCollector
          .collect({
            scenario:
              input.scenario,
  
            workspace:
              input.workspace,
  
            task:
              result.task,
          });
  
      return {
        criterionResults,
  
        usage:
          this.options.usage ?? {
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
          },
  
        humanInterventions: 1,
      };
    }
  }