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
  
  export interface BenchmarkWorktreeCreator {
    create(options: {
      repositoryRoot: string;
      taskId: string;
      baseBranch: string;
    }): Promise<Worktree>;
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
        return createTaskWorktree(options);
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
    const trimmed = value.trim();
  
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
    ) {}
  
    async create(
      request: BenchmarkWorkspaceRequest,
    ): Promise<BenchmarkWorkspace> {
      const runId = requireIdentifier(
        request.runId,
        "Benchmark run ID",
      );
  
      const strategyId = requireIdentifier(
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
  
        path: worktree.path,
        branch: worktree.branch,
      };
    }
  }