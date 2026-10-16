import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import {
    createTaskWorktree,
  } from "../tools/git-worktree.js";
  import type {
    Worktree,
  } from "../tools/git-worktree.js";
  
  export interface ExplorationWorkspace {
    candidateId: string;
    targetId: string;
    model: string;
    worktree: Worktree;
  }
  
  export interface ExplorationWorkspaceOptions {
    repositoryRoot: string;
    taskId: string;
    baseBranch: string;
  }
  
  export class ExplorationWorkspaceManager {
    async create(
      candidate: ExplorationCandidate,
      options: ExplorationWorkspaceOptions,
    ): Promise<ExplorationWorkspace> {
      const worktree =
        await createTaskWorktree({
          repositoryRoot:
            options.repositoryRoot,
          taskId:
            this.createWorkspaceTaskId(
              options.taskId,
              candidate.candidateId,
            ),
          baseBranch:
            options.baseBranch,
        });
  
      return {
        candidateId:
          candidate.candidateId,
        targetId:
          candidate.targetId,
        model: candidate.model,
        worktree,
      };
    }
  
    async createAll(
      candidates: ExplorationCandidate[],
      options: ExplorationWorkspaceOptions,
    ): Promise<ExplorationWorkspace[]> {
      this.assertUniqueCandidateIds(
        candidates,
      );
  
      return Promise.all(
        candidates.map((candidate) =>
          this.create(
            candidate,
            options,
          ),
        ),
      );
    }
  
    private createWorkspaceTaskId(
      taskId: string,
      candidateId: string,
    ): string {
      return `${taskId}-exploration-${candidateId}`;
    }
  
    private assertUniqueCandidateIds(
      candidates: ExplorationCandidate[],
    ): void {
      const ids = new Set<string>();
  
      for (const candidate of candidates) {
        if (
          ids.has(
            candidate.candidateId,
          )
        ) {
          throw new Error(
            `Duplicate exploration candidate ID: ${candidate.candidateId}`,
          );
        }
  
        ids.add(
          candidate.candidateId,
        );
      }
    }
  }