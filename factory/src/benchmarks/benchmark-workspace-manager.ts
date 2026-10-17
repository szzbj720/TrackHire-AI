import {
    execFile,
  } from "node:child_process";
  
  import {
    promisify,
  } from "node:util";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import {
    createTaskWorktree,
    type Worktree,
  } from "../tools/git-worktree.js";
  
  import {
    resolveGitRevision,
  } from "../tools/git-revision.js";
  
  const execFileAsync =
    promisify(execFile);
  
  export interface BenchmarkWorkspace {
    scenarioId: string;
    runId: string;
    strategyId: string;
  
    baselineRevision: string;
  
    path: string;
    branch: string;
  }
  
  export interface BenchmarkWorkspaceRequest {
    scenario: BenchmarkScenario;
  
    runId: string;
    strategyId: string;
  
    repositoryRoot: string;
    baseRevision: string;
  }
  
  export interface BenchmarkWorkspaceCleanupRequest {
    repositoryRoot: string;
    workspace: BenchmarkWorkspace;
  }
  
  export interface BenchmarkWorktreeCreator {
    create(options: {
      repositoryRoot: string;
      taskId: string;
      baseBranch: string;
    }): Promise<Worktree>;
  }
  
  export interface BenchmarkWorktreeCleaner {
    remove(options: {
      repositoryRoot: string;
      worktreePath: string;
      branch: string;
    }): Promise<void>;
  }
  
  export interface BenchmarkRevisionResolver {
    resolve(
      repositoryRoot: string,
      revision: string,
    ): Promise<string>;
  }
  
  const defaultWorktreeCreator:
    BenchmarkWorktreeCreator = {
      async create(options) {
        return createTaskWorktree(
          options,
        );
      },
    };
  
  const defaultWorktreeCleaner:
    BenchmarkWorktreeCleaner = {
      async remove(options) {
        await execFileAsync(
          "git",
          [
            "worktree",
            "remove",
            "--force",
            options.worktreePath,
          ],
          {
            cwd:
              options.repositoryRoot,
          },
        );
  
        await execFileAsync(
          "git",
          [
            "branch",
            "-D",
            options.branch,
          ],
          {
            cwd:
              options.repositoryRoot,
          },
        );
  
        await execFileAsync(
          "git",
          [
            "worktree",
            "prune",
          ],
          {
            cwd:
              options.repositoryRoot,
          },
        );
      },
    };
  
  const defaultRevisionResolver:
    BenchmarkRevisionResolver = {
      async resolve(
        repositoryRoot,
        revision,
      ) {
        return resolveGitRevision(
          repositoryRoot,
          revision,
        );
      },
    };
  
  function requireIdentifier(
    value: string,
    label: string,
  ): string {
    const trimmed =
      value.trim();
  
    if (!trimmed) {
      throw new Error(
        `${label} cannot be empty.`,
      );
    }
  
    return trimmed;
  }
  
  export class BenchmarkWorkspaceManager {
    constructor(
      private readonly worktreeCreator:
        BenchmarkWorktreeCreator =
          defaultWorktreeCreator,
  
      private readonly revisionResolver:
        BenchmarkRevisionResolver =
          defaultRevisionResolver,
  
      private readonly worktreeCleaner:
        BenchmarkWorktreeCleaner =
          defaultWorktreeCleaner,
    ) {}
  
    async create(
      request:
        BenchmarkWorkspaceRequest,
    ): Promise<BenchmarkWorkspace> {
      const runId =
        requireIdentifier(
          request.runId,
          "Benchmark run ID",
        );
  
      const strategyId =
        requireIdentifier(
          request.strategyId,
          "Benchmark strategy ID",
        );
  
      const baselineRevision =
        await this.revisionResolver.resolve(
          request.repositoryRoot,
          request.baseRevision,
        );
  
      const taskId = [
        "benchmark",
        request.scenario.id,
        runId,
        strategyId,
      ].join("-");
  
      const worktree =
        await this.worktreeCreator.create({
          repositoryRoot:
            request.repositoryRoot,
  
          taskId,
  
          baseBranch:
            baselineRevision,
        });
  
      return {
        scenarioId:
          request.scenario.id,
  
        runId,
        strategyId,
  
        baselineRevision,
  
        path:
          worktree.path,
  
        branch:
          worktree.branch,
      };
    }
  
    async cleanup(
      request:
        BenchmarkWorkspaceCleanupRequest,
    ): Promise<void> {
      await this.worktreeCleaner.remove({
        repositoryRoot:
          request.repositoryRoot,
  
        worktreePath:
          request.workspace.path,
  
        branch:
          request.workspace.branch,
      });
    }
  }