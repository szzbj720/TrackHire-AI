import type {
  Planner,
} from "../agents/planner.js";

import type {
  TaskAnalyzer,
} from "../agents/analyzer.js";

import type {
  RepositoryContext,
} from "../context/context-builder.js";

import {
  PlanningWorkflow,
} from "../orchestrator/planning-workflow.js";

import type {
  ImplementationPlan,
} from "../schemas/plan.js";

import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";

import type {
  BenchmarkScenario,
} from "../schemas/benchmark-scenario.js";

import type {
  BenchmarkUsage,
} from "../schemas/benchmark-result.js";

import type {
  BenchmarkCriterionResult,
} from "./benchmark-acceptance-evaluator.js";

import type {
  BenchmarkModelProviderSnapshot,
} from "./benchmark-model-provider.js";

import type {
  BenchmarkStrategyExecution,
  BenchmarkStrategyExecutor,
} from "./benchmark-runner.js";

import type {
  BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

export interface ClarificationBenchmarkAcceptanceCollector {
  collect(input: {
    scenario: BenchmarkScenario;
    workspace: BenchmarkWorkspace;
    task: EngineeringTask;
  }): Promise<BenchmarkCriterionResult[]>;
}

export interface ClarificationBenchmarkModelEvidenceSource {
  snapshot(): BenchmarkModelProviderSnapshot;
}

export interface ClarificationBenchmarkExecutorOptions {
  runId: string;
  analyzer: TaskAnalyzer;
  acceptanceCollector:
    ClarificationBenchmarkAcceptanceCollector;
  modelEvidence?:
    ClarificationBenchmarkModelEvidenceSource;
  onWorkspaceReady?(
    workspace: BenchmarkWorkspace,
  ): void;
}

function usageFromSnapshot(
  snapshot: BenchmarkModelProviderSnapshot,
): BenchmarkUsage {
  return {
    inputTokens: snapshot.inputTokens,
    outputTokens: snapshot.outputTokens,
    estimatedCostUsd:
      snapshot.estimatedCostUsd,
  };
}

function zeroUsage(): BenchmarkUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };
}

class BenchmarkFallbackPlanner
  implements Planner
{
  calls = 0;

  async plan(
    _task: EngineeringTask,
    analysis: TaskAnalysis,
    _context: RepositoryContext,
  ): Promise<ImplementationPlan> {
    this.calls += 1;

    return {
      summary:
        "Benchmark fallback plan created because analysis did not request clarification.",
      steps: [
        {
          order: 1,
          description:
            "Proceed with the implementation using the analyzer's interpretation of the request.",
          files:
            analysis.relevantFiles,
          rationale:
            "The analyzer did not identify an ambiguity that prevents planning.",
        },
      ],
      affectedFiles:
        analysis.relevantFiles,
      validationSteps: [
        "Run the benchmark validation commands.",
      ],
      risks: [],
      assumptions: [
        ...analysis.assumptions,
      ],
      requiresHumanInput: false,
    };
  }
}

function createAnalyzerTask(
  scenario: BenchmarkScenario,
  runId: string,
): EngineeringTask {
  const timestamp =
    new Date().toISOString();

  return {
    id: `${scenario.id}-${runId}`,
    request: scenario.task,
    status: "TASK_CREATED",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [
      `Repository scope: ${scenario.repositoryFiles.join(", ")}`,
    ],
    repairAttempts: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export class ClarificationBenchmarkExecutor
  implements BenchmarkStrategyExecutor
{
  constructor(
    private readonly options:
      ClarificationBenchmarkExecutorOptions,
  ) {}

  async execute(input: {
    scenario: BenchmarkScenario;
    workspace: BenchmarkWorkspace;
  }): Promise<BenchmarkStrategyExecution> {
    this.options.onWorkspaceReady?.(
      input.workspace,
    );

    if (
      input.scenario.expectedBehavior !==
      "clarify"
    ) {
      throw new Error(
        `ClarificationBenchmarkExecutor requires expectedBehavior "clarify", received "${input.scenario.expectedBehavior}".`,
      );
    }

    const task =
      createAnalyzerTask(
        input.scenario,
        this.options.runId,
      );

    const fallbackPlanner =
      new BenchmarkFallbackPlanner();

    const workflow =
      new PlanningWorkflow(
        this.options.analyzer,
        fallbackPlanner,
      );

    const orchestrator =
      await workflow.run(
        task,
        input.workspace.path,
      );

    const finalTask =
      orchestrator.getTask();

    const criterionResults =
      await this.options
        .acceptanceCollector
        .collect({
          scenario: input.scenario,
          workspace: input.workspace,
          task: finalTask,
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
        finalTask.status ===
        "NEEDS_HUMAN"
          ? 1
          : 0,
    };
  }
}
