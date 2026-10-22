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
  ImplementationResult,
} from "../schemas/implementation.js";

import type {
  ValidationResult,
} from "../schemas/validation.js";

import type {
  FailureDiagnosis,
} from "../schemas/diagnosis.js";

import {
  ImplementationWorkflow,
} from "../orchestrator/implementation-workflow.js";

import {
  DiagnosisWorkflow,
} from "../orchestrator/diagnosis-workflow.js";

import {
  RepairWorkflow,
} from "../orchestrator/repair-workflow.js";

export interface BenchmarkAcceptanceCollector {
  collect(input: {
    scenario: BenchmarkScenario;
    workspace: BenchmarkWorkspace;
    task: EngineeringTask;
  }): Promise<BenchmarkCriterionResult[]>;
}

export interface BenchmarkModelEvidenceSource {
  snapshot(): BenchmarkModelProviderSnapshot;
}

export interface SequentialBenchmarkExecutorOptions {
  runId: string;

  plan: ImplementationPlan;

  implementationWorkflow:
    ImplementationWorkflow;

  diagnosisWorkflow?:
    DiagnosisWorkflow;

  repairWorkflow?:
    RepairWorkflow;

  acceptanceCollector:
    BenchmarkAcceptanceCollector;

  modelEvidence?:
    BenchmarkModelEvidenceSource;

  maxRecoveryCycles?:
    number;
}

function usageFromSnapshot(
  snapshot:
    BenchmarkModelProviderSnapshot,
): BenchmarkUsage {
  return {
    inputTokens:
      snapshot.inputTokens,

    outputTokens:
      snapshot.outputTokens,

    estimatedCostUsd:
      snapshot.estimatedCostUsd,
  };
}

function zeroUsage():
  BenchmarkUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };
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

        strategy: {
          mode:
            "sequential",

          reasoning:
            "Benchmark sequential execution with deterministic validation and bounded recovery.",
        },

        updatedAt:
          createdTask.updatedAt,
      };

    const implementationResult =
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

    let currentTask =
      implementationResult.task;

    let currentImplementation:
      ImplementationResult =
        implementationResult
          .implementation;

    let currentValidation:
      ValidationResult =
        implementationResult
          .validation;

    let currentDiagnosis:
      FailureDiagnosis | undefined;

    let recoveryCycles = 0;

    const maxRecoveryCycles =
      this.options.maxRecoveryCycles ??
      2;

    while (
      !currentValidation.passed &&
      currentTask.status ===
        "DIAGNOSING_FAILURE" &&
      recoveryCycles <
        maxRecoveryCycles
    ) {
      if (
        !this.options
          .diagnosisWorkflow ||
        !this.options
          .repairWorkflow
      ) {
        break;
      }

      const diagnosisResult =
        await this.options
          .diagnosisWorkflow
          .run({
            task:
              currentTask,

            implementation:
              currentImplementation,

            validation:
              currentValidation,

            worktreePath:
              input.workspace.path,
          });

      currentTask =
        diagnosisResult.task;

      currentDiagnosis =
        diagnosisResult.diagnosis;

      if (
        currentTask.status !==
        "REPAIRING"
      ) {
        break;
      }

      const repairResult =
        await this.options
          .repairWorkflow
          .run({
            task:
              currentTask,

            implementation:
              currentImplementation,

            validation:
              currentValidation,

            diagnosis:
              currentDiagnosis,

            worktreePath:
              input.workspace.path,
          });

      currentTask =
        repairResult.task;

      currentValidation =
        repairResult.validation;

      if (repairResult.repair) {
        currentImplementation = {
          summary:
            [
              currentImplementation
                .summary,
              repairResult.repair
                .summary,
            ]
              .filter(Boolean)
              .join(" "),

          changedFiles: [
            ...currentImplementation
              .changedFiles,

            ...repairResult.repair
              .changedFiles,
          ],

          commandsRun: [
            ...currentImplementation
              .commandsRun,

            ...repairResult.repair
              .commandsRun,
          ],

          assumptions: [
            ...currentImplementation
              .assumptions,

            ...repairResult.repair
              .assumptions,
          ],

          warnings: [
            ...currentImplementation
              .warnings,

            ...repairResult.repair
              .warnings,
          ],

          requiresHumanInput:
            repairResult.repair
              .requiresHumanInput,
        };
      }

      recoveryCycles += 1;
    }

    if (
      !currentValidation.passed &&
      currentTask.status ===
        "DIAGNOSING_FAILURE" &&
      recoveryCycles >=
        maxRecoveryCycles
    ) {
      currentTask = {
        ...currentTask,

        status:
          "NEEDS_HUMAN",

        updatedAt:
          new Date().toISOString(),
      };
    }

    const criterionResults =
      await this.options
        .acceptanceCollector
        .collect({
          scenario:
            input.scenario,

          workspace:
            input.workspace,

          task:
            currentTask,
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
        
          humanInterventions: 1,
        };
  }
}