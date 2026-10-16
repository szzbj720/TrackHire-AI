import type {
    Builder,
  } from "../agents/builder.js";
  import {
    ExplorationMetricsCollector,
  } from "../evaluation/exploration-metrics-collector.js";
  import {
    createExplorationEvidence,
  } from "../evidence/exploration-evidence.js";
  import type {
    ExplorationEvidence,
  } from "../evidence/exploration-evidence.js";
  import {
    ExplorationCandidateEvaluator,
  } from "../models/exploration-candidate-evaluator.js";
  import {
    ExplorationCandidateGenerator,
  } from "../models/exploration-candidate-generator.js";
  import {
    ExplorationCandidateValidator,
  } from "../models/exploration-candidate-validator.js";
  import {
    ExplorationImplementationRunner,
  } from "../models/exploration-implementation-runner.js";
  import type {
    ExplorationImplementationSelection,
  } from "../models/exploration-implementation-selector.js";
  import {
    ExplorationImplementationSelector,
  } from "../models/exploration-implementation-selector.js";
  import {
    ExplorationImplementationValidator,
  } from "../models/exploration-implementation-validator.js";
  import {
    ExplorationPolicy,
  } from "../models/exploration-policy.js";
  import {
    ExplorationWorkspaceManager,
  } from "../models/exploration-workspace-manager.js";
  import type {
    ModelExecutionTarget,
  } from "../models/multi-model-runner.js";
  import type {
    ModelRequest,
  } from "../models/provider.js";
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    ExplorationMetrics,
  } from "../schemas/exploration-metrics.js";
  import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  
  export interface ExplorationBuilderTarget {
    targetId: string;
    builder: Builder;
  }
  
  export interface ExplorationWorkflowInput {
    task: EngineeringTask;
    analysis: TaskAnalysis;
  
    request: ModelRequest;
    generationTargets:
      ModelExecutionTarget[];
  
    builderTargets:
      ExplorationBuilderTarget[];
  
    validator: Validator;
  
    repositoryRoot: string;
    repositoryFiles: string[];
    baseBranch: string;
  }
  
  export interface ExplorationWorkflowResult {
    explored: boolean;
    reasoning: string;
  
    candidates: ExplorationCandidate[];
  
    selectedCandidateId?: string;
  
    implementationSelection?:
      ExplorationImplementationSelection;
  
    metrics?: ExplorationMetrics;
  
    evidence?: ExplorationEvidence;
  
    requiresHumanInput: boolean;
  }
  
  export class ExplorationWorkflow {
    constructor(
      private readonly policy =
        new ExplorationPolicy(),
  
      private readonly generator =
        new ExplorationCandidateGenerator(),
  
      private readonly candidateValidator =
        new ExplorationCandidateValidator(),
  
      private readonly candidateEvaluator =
        new ExplorationCandidateEvaluator(),
  
      private readonly workspaceManager =
        new ExplorationWorkspaceManager(),
  
      private readonly implementationRunner =
        new ExplorationImplementationRunner(),
  
      private readonly implementationValidator =
        new ExplorationImplementationValidator(),
  
      private readonly implementationSelector =
        new ExplorationImplementationSelector(),
  
      private readonly metricsCollector =
        new ExplorationMetricsCollector(),
    ) {}
  
    async run(
      input: ExplorationWorkflowInput,
    ): Promise<ExplorationWorkflowResult> {
      const policyDecision =
        this.policy.decide(
          input.analysis,
        );
  
      if (!policyDecision.explore) {
        return {
          explored: false,
          reasoning:
            policyDecision.reasoning,
          candidates: [],
          requiresHumanInput:
            input.analysis
              .requiresHumanInput,
        };
      }
  
      const generation =
        await this.generator.generate(
          input.request,
          input.generationTargets,
        );
  
      const candidates =
        generation.results.flatMap(
          (result) =>
            result.status ===
            "success"
              ? [result.candidate]
              : [],
        );
  
      if (candidates.length < 2) {
        return {
          explored: true,
          reasoning:
            "Parallel exploration did not produce at least two usable candidates.",
          candidates,
          requiresHumanInput: true,
        };
      }
  
      const candidateValidation =
        this.candidateValidator.validate(
          candidates,
          input.repositoryFiles,
        );
  
      const candidateEvaluation =
        this.candidateEvaluator.evaluate(
          candidates,
          candidateValidation.results,
        );
  
      const eligibleCandidateIds =
        new Set(
          candidateEvaluation.scores
            .filter(
              (score) =>
                score.eligible,
            )
            .map(
              (score) =>
                score.candidateId,
            ),
        );
  
      const eligibleCandidates =
        candidates.filter(
          (candidate) =>
            eligibleCandidateIds.has(
              candidate.candidateId,
            ),
        );
  
      if (
        eligibleCandidates.length < 2
      ) {
        return {
          explored: true,
          reasoning:
            "Fewer than two exploration candidates passed deterministic candidate validation.",
          candidates,
          requiresHumanInput: true,
        };
      }
  
      const workspaces =
        await this.workspaceManager.createAll(
          eligibleCandidates,
          {
            repositoryRoot:
              input.repositoryRoot,
            taskId: input.task.id,
            baseBranch:
              input.baseBranch,
          },
        );
  
      const buildersByTargetId =
        this.indexBuilders(
          input.builderTargets,
        );
  
      const implementationTargets =
        eligibleCandidates.map(
          (candidate) => {
            const workspace =
              workspaces.find(
                (candidateWorkspace) =>
                  candidateWorkspace
                    .candidateId ===
                  candidate.candidateId,
              );
  
            if (!workspace) {
              throw new Error(
                `Missing exploration workspace for candidate: ${candidate.candidateId}`,
              );
            }
  
            const builder =
              buildersByTargetId.get(
                candidate.targetId,
              );
  
            if (!builder) {
              throw new Error(
                `Missing exploration builder for target: ${candidate.targetId}`,
              );
            }
  
            return {
              candidate,
              workspace,
              builder,
            };
          },
        );
  
      const implementations =
        await this.implementationRunner.run(
          input.task,
          implementationTargets,
        );
  
      const validationTargets =
        implementations.results.map(
          (implementation) => {
            const workspace =
              workspaces.find(
                (candidateWorkspace) =>
                  candidateWorkspace
                    .candidateId ===
                  implementation
                    .candidateId,
              );
  
            if (!workspace) {
              throw new Error(
                `Missing exploration validation workspace for candidate: ${implementation.candidateId}`,
              );
            }
  
            return {
              implementation,
              workspace,
              validator:
                input.validator,
            };
          },
        );
  
      const validations =
        await this.implementationValidator.validate(
          validationTargets,
        );
  
      const implementationSelection =
        this.implementationSelector.select(
          implementations.results,
          validations.results,
          candidateEvaluation,
        );
  
      const metrics =
        this.metricsCollector.collect({
          generation,
          implementations,
          validations,
          selection:
            implementationSelection,
        });
  
      const evidence =
        createExplorationEvidence({
          candidates,
          implementations:
            implementations.results,
          validations:
            validations.results,
          selection:
            implementationSelection,
          metrics,
        });
  
      if (
        implementationSelection
          .requiresHumanSelection
      ) {
        return {
          explored: true,
          reasoning:
            "Competing implementations require human selection.",
          candidates,
          implementationSelection,
          metrics,
          evidence,
          requiresHumanInput: true,
        };
      }
  
      return {
        explored: true,
        reasoning:
          "Parallel exploration produced a deterministically validated implementation winner.",
        candidates,
        ...(implementationSelection
          .selectedCandidateId
          ? {
              selectedCandidateId:
                implementationSelection
                  .selectedCandidateId,
            }
          : {}),
        implementationSelection,
        metrics,
        evidence,
        requiresHumanInput: false,
      };
    }
  
    private indexBuilders(
      targets:
        ExplorationBuilderTarget[],
    ): Map<string, Builder> {
      const builders =
        new Map<string, Builder>();
  
      for (const target of targets) {
        if (
          builders.has(
            target.targetId,
          )
        ) {
          throw new Error(
            `Duplicate exploration builder target: ${target.targetId}`,
          );
        }
  
        builders.set(
          target.targetId,
          target.builder,
        );
      }
  
      return builders;
    }
  }