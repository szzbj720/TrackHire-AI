import type {
    WorkGraph,
    WorkUnit,
  } from "../schemas/work-graph.js";
  import {
    createTaskWorktree,
    type Worktree,
  } from "../tools/git-worktree.js";
  
  export interface ParallelWorktree {
    unit: WorkUnit;
    worktree: Worktree;
  }
  
  export interface ParallelWorktreeOptions {
    repositoryRoot: string;
    taskId: string;
    baseBranch: string;
    graph: WorkGraph;
  }
  
  export async function createParallelWorktrees(
    options: ParallelWorktreeOptions,
  ): Promise<ParallelWorktree[]> {
    const worktrees: ParallelWorktree[] = [];
  
    try {
      for (const unit of options.graph.units) {
        const worktree =
          await createTaskWorktree({
            repositoryRoot:
              options.repositoryRoot,
            taskId: `${options.taskId}-${unit.id}`,
            baseBranch: options.baseBranch,
          });
  
        worktrees.push({
          unit,
          worktree,
        });
      }
  
      return worktrees;
    } catch (error) {
      throw new Error(
        "Failed to create isolated parallel worktrees.",
        {
          cause: error,
        },
      );
    }
  }