import type {
    Builder,
  } from "../agents/builder.js";
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    ExplorationWorkspace,
  } from "./exploration-workspace-manager.js";
  
  export interface ExplorationImplementationTarget {
    candidate: ExplorationCandidate;
    workspace: ExplorationWorkspace;
    builder: Builder;
  }
  
  export interface SuccessfulExplorationImplementation {
    candidateId: string;
    targetId: string;
    model: string;
    status: "success";
    implementation: ImplementationResult;
  }
  
  export interface FailedExplorationImplementation {
    candidateId: string;
    targetId: string;
    model: string;
    status: "error";
    error: string;
  }
  
  export type ExplorationImplementationResult =
    | SuccessfulExplorationImplementation
    | FailedExplorationImplementation;
  
  export interface ExplorationImplementationRunResult {
    results: ExplorationImplementationResult[];
  }
  
  export class ExplorationImplementationRunner {
    async run(
      task: EngineeringTask,
      targets: ExplorationImplementationTarget[],
    ): Promise<ExplorationImplementationRunResult> {
      this.assertUniqueCandidateIds(
        targets,
      );
  
      const results = await Promise.all(
        targets.map((target) =>
          this.executeTarget(
            task,
            target,
          ),
        ),
      );
  
      return { results };
    }
  
    private async executeTarget(
      task: EngineeringTask,
      target: ExplorationImplementationTarget,
    ): Promise<ExplorationImplementationResult> {
      try {
        this.assertWorkspaceMatchesCandidate(
          target,
        );
  
        const implementation =
          await target.builder.implement({
            task,
            plan: this.toImplementationPlan(
              target.candidate,
            ),
            worktreePath:
              target.workspace.worktree.path,
          });
  
        return {
          candidateId:
            target.candidate.candidateId,
          targetId:
            target.candidate.targetId,
          model: target.candidate.model,
          status: "success",
          implementation,
        };
      } catch (error) {
        return {
          candidateId:
            target.candidate.candidateId,
          targetId:
            target.candidate.targetId,
          model: target.candidate.model,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }
  
    private toImplementationPlan(
      candidate: ExplorationCandidate,
    ): ImplementationPlan {
      return {
        summary: candidate.summary,
  
        steps:
          candidate.implementationSteps.map(
            (description, index) => ({
              order: index + 1,
              description,
              files:
                candidate.affectedFiles,
              rationale:
                candidate.approach,
            }),
          ),
  
        affectedFiles:
          candidate.affectedFiles,
  
        validationSteps:
          candidate.validationSteps,
  
        risks: candidate.risks,
  
        assumptions:
          candidate.assumptions,
  
        requiresHumanInput:
          candidate.requiresHumanInput,
      };
    }
  
    private assertWorkspaceMatchesCandidate(
      target: ExplorationImplementationTarget,
    ): void {
      if (
        target.workspace.candidateId !==
        target.candidate.candidateId
      ) {
        throw new Error(
          `Exploration workspace candidate mismatch: expected ${target.candidate.candidateId}, received ${target.workspace.candidateId}`,
        );
      }
  
      if (
        target.workspace.targetId !==
        target.candidate.targetId
      ) {
        throw new Error(
          `Exploration workspace target mismatch for candidate ${target.candidate.candidateId}.`,
        );
      }
  
      if (
        target.workspace.model !==
        target.candidate.model
      ) {
        throw new Error(
          `Exploration workspace model mismatch for candidate ${target.candidate.candidateId}.`,
        );
      }
    }
  
    private assertUniqueCandidateIds(
      targets: ExplorationImplementationTarget[],
    ): void {
      const ids = new Set<string>();
  
      for (const target of targets) {
        const candidateId =
          target.candidate.candidateId;
  
        if (ids.has(candidateId)) {
          throw new Error(
            `Duplicate exploration implementation candidate: ${candidateId}`,
          );
        }
  
        ids.add(candidateId);
      }
    }
  }