import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import type {
    ExplorationImplementationResult,
  } from "./exploration-implementation-runner.js";
  import type {
    ExplorationWorkspace,
  } from "./exploration-workspace-manager.js";
  
  export interface ExplorationValidationTarget {
    implementation:
      ExplorationImplementationResult;
    workspace: ExplorationWorkspace;
    validator: Validator;
  }
  
  export interface SuccessfulExplorationValidation {
    candidateId: string;
    targetId: string;
    model: string;
    status: "success";
    validation: ValidationResult;
  }
  
  export interface FailedExplorationValidation {
    candidateId: string;
    targetId: string;
    model: string;
    status: "error";
    error: string;
  }
  
  export interface SkippedExplorationValidation {
    candidateId: string;
    targetId: string;
    model: string;
    status: "skipped";
    reason: string;
  }
  
  export type ExplorationValidationResult =
    | SuccessfulExplorationValidation
    | FailedExplorationValidation
    | SkippedExplorationValidation;
  
  export interface ExplorationValidationRunResult {
    results: ExplorationValidationResult[];
  }
  
  export class ExplorationImplementationValidator {
    async validate(
      targets: ExplorationValidationTarget[],
    ): Promise<ExplorationValidationRunResult> {
      this.assertUniqueCandidateIds(
        targets,
      );
  
      const results = await Promise.all(
        targets.map((target) =>
          this.validateTarget(target),
        ),
      );
  
      return { results };
    }
  
    private async validateTarget(
      target: ExplorationValidationTarget,
    ): Promise<ExplorationValidationResult> {
      const implementation =
        target.implementation;
  
      if (
        implementation.status === "error"
      ) {
        return {
          candidateId:
            implementation.candidateId,
          targetId:
            implementation.targetId,
          model: implementation.model,
          status: "skipped",
          reason:
            "Implementation failed before deterministic validation.",
        };
      }
  
      try {
        this.assertWorkspaceMatchesImplementation(
          implementation,
          target.workspace,
        );
  
        if (
          implementation.implementation
            .requiresHumanInput
        ) {
          return {
            candidateId:
              implementation.candidateId,
            targetId:
              implementation.targetId,
            model: implementation.model,
            status: "skipped",
            reason:
              "Implementation requires human input before deterministic validation.",
          };
        }
  
        const validation =
          await target.validator.validate(
            target.workspace.worktree.path,
          );
  
        return {
          candidateId:
            implementation.candidateId,
          targetId:
            implementation.targetId,
          model: implementation.model,
          status: "success",
          validation,
        };
      } catch (error) {
        return {
          candidateId:
            implementation.candidateId,
          targetId:
            implementation.targetId,
          model: implementation.model,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }
  
    private assertWorkspaceMatchesImplementation(
      implementation:
        Extract<
          ExplorationImplementationResult,
          { status: "success" }
        >,
      workspace: ExplorationWorkspace,
    ): void {
      if (
        workspace.candidateId !==
        implementation.candidateId
      ) {
        throw new Error(
          `Exploration validation workspace candidate mismatch: expected ${implementation.candidateId}, received ${workspace.candidateId}`,
        );
      }
  
      if (
        workspace.targetId !==
        implementation.targetId
      ) {
        throw new Error(
          `Exploration validation workspace target mismatch for candidate ${implementation.candidateId}.`,
        );
      }
  
      if (
        workspace.model !==
        implementation.model
      ) {
        throw new Error(
          `Exploration validation workspace model mismatch for candidate ${implementation.candidateId}.`,
        );
      }
    }
  
    private assertUniqueCandidateIds(
      targets: ExplorationValidationTarget[],
    ): void {
      const ids = new Set<string>();
  
      for (const target of targets) {
        const candidateId =
          target.implementation.candidateId;
  
        if (ids.has(candidateId)) {
          throw new Error(
            `Duplicate exploration validation candidate: ${candidateId}`,
          );
        }
  
        ids.add(candidateId);
      }
    }
  }