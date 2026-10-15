import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    WorkGraph,
    WorkUnit,
  } from "../schemas/work-graph.js";
  import {
    commitWorktreeChanges,
    cherryPickCommits,
  } from "../tools/git-integration.js";
  import {
    createTaskWorktree,
    type Worktree,
  } from "../tools/git-worktree.js";
  import { Orchestrator } from "./orchestrator.js";
  import {
    ParallelWorker,
    type ParallelWorkerResult,
  } from "./parallel-worker.js";
  import {
    createParallelWorktrees,
  } from "./parallel-worktrees.js";
  import {
    scheduleWorkGraph,
  } from "./work-graph-scheduler.js";
  
  export interface ParallelExecutionInput {
    task: EngineeringTask;
    graph: WorkGraph;
    repositoryRoot: string;
    baseBranch: string;
  }
  
  export interface ParallelExecutionResult {
    task: EngineeringTask;
    integrationWorktree: Worktree;
    workerResults: ParallelWorkerResult[];
  }
  
  export class ParallelExecutionWorkflow {
    constructor(
      private readonly worker: ParallelWorker,
    ) {}
  
    async run(
      input: ParallelExecutionInput,
    ): Promise<ParallelExecutionResult> {
      this.assertReady(input.task);
  
      const plan = input.task.plan;
  
      if (!plan) {
        throw new Error(
          "Parallel execution requires an implementation plan.",
        );
      }
  
      const orchestrator =
        new Orchestrator(input.task);
  
      orchestrator.transition("IMPLEMENTING");
  
      const schedule =
        scheduleWorkGraph(input.graph);
  
      const integrationWorktree =
        await createTaskWorktree({
          repositoryRoot:
            input.repositoryRoot,
          taskId:
            `${input.task.id}-integration`,
          baseBranch:
            input.baseBranch,
        });
  
      const workerResults:
        ParallelWorkerResult[] = [];
  
      for (
        let waveIndex = 0;
        waveIndex < schedule.waves.length;
        waveIndex += 1
      ) {
        const wave =
          schedule.waves[waveIndex];
  
        if (!wave) {
          continue;
        }
  
        const worktrees =
          await createParallelWorktrees({
            repositoryRoot:
              input.repositoryRoot,
            taskId:
              `${input.task.id}-wave-${waveIndex + 1}`,
            baseBranch:
              integrationWorktree.branch,
            graph: {
              units: wave,
            },
          });
  
        const results =
          await this.worker.executeWave({
            task: orchestrator.getTask(),
            plan,
            worktrees,
            units: wave,
          });
  
        workerResults.push(...results);
  
        if (
          results.some(
            (result) =>
              result.implementation
                .requiresHumanInput,
          )
        ) {
          orchestrator.transition(
            "NEEDS_HUMAN",
          );
  
          return {
            task: orchestrator.getTask(),
            integrationWorktree,
            workerResults,
          };
        }
  
        const commitHashes: string[] = [];
  
        for (const result of results) {
          const worktree =
            this.findWorktree(
              worktrees,
              result.unit,
            );
  
          const commit =
            await commitWorktreeChanges({
              worktreePath:
                worktree.worktree.path,
              message:
                `factory: complete ${result.unit.id}`,
            });
  
          commitHashes.push(commit.hash);
        }
  
        await cherryPickCommits({
          repositoryPath:
            integrationWorktree.path,
          commitHashes,
        });
      }
  
      orchestrator.transition("VALIDATING");
  
      return {
        task: orchestrator.getTask(),
        integrationWorktree,
        workerResults,
      };
    }
  
    private assertReady(
      task: EngineeringTask,
    ): void {
      if (
        task.status !==
        "AWAITING_PARALLEL_APPROVAL"
      ) {
        throw new Error(
          `Cannot execute parallel work while task is in state ${task.status}.`,
        );
      }
  
      if (
        task.strategy?.mode !== "parallel"
      ) {
        throw new Error(
          "Parallel execution requires a parallel execution strategy.",
        );
      }
  
      if (!task.plan) {
        throw new Error(
          "Parallel execution requires an implementation plan.",
        );
      }
  
      if (task.plan.requiresHumanInput) {
        throw new Error(
          "Cannot execute parallel work from a plan that still requires human input.",
        );
      }
    }
  
    private findWorktree(
      worktrees: Awaited<
        ReturnType<
          typeof createParallelWorktrees
        >
      >,
      unit: WorkUnit,
    ) {
      const worktree =
        worktrees.find(
          (entry) =>
            entry.unit.id === unit.id,
        );
  
      if (!worktree) {
        throw new Error(
          `No isolated worktree exists for work unit ${unit.id}.`,
        );
      }
  
      return worktree;
    }
  }