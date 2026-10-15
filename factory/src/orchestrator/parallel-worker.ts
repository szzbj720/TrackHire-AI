import type {
    Builder,
  } from "../agents/builder.js";
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
    WorkUnit,
  } from "../schemas/work-graph.js";
  import type {
    ParallelWorktree,
  } from "./parallel-worktrees.js";
  
  export interface ParallelWorkerResult {
    unit: WorkUnit;
    implementation: ImplementationResult;
  }
  
  export interface ParallelWorkerInput {
    task: EngineeringTask;
    plan: ImplementationPlan;
    worktrees: ParallelWorktree[];
    units: WorkUnit[];
  }
  
  export class ParallelWorker {
    constructor(
      private readonly builder: Builder,
    ) {}
  
    async executeWave(
      input: ParallelWorkerInput,
    ): Promise<ParallelWorkerResult[]> {
      return Promise.all(
        input.units.map((unit) =>
          this.executeUnit(
            input.task,
            input.plan,
            input.worktrees,
            unit,
          ),
        ),
      );
    }
  
    private async executeUnit(
      task: EngineeringTask,
      plan: ImplementationPlan,
      worktrees: ParallelWorktree[],
      unit: WorkUnit,
    ): Promise<ParallelWorkerResult> {
      const worktree = worktrees.find(
        (entry) => entry.unit.id === unit.id,
      );
  
      if (!worktree) {
        throw new Error(
          `No isolated worktree exists for work unit ${unit.id}.`,
        );
      }
  
      const unitPlan =
        this.createUnitPlan(
          plan,
          unit,
        );
  
      const implementation =
        await this.builder.implement({
          task,
          plan: unitPlan,
          worktreePath:
            worktree.worktree.path,
        });
  
      return {
        unit,
        implementation,
      };
    }
  
    private createUnitPlan(
      plan: ImplementationPlan,
      unit: WorkUnit,
    ): ImplementationPlan {
      const approvedFiles = new Set(
        unit.files,
      );
  
      return {
        ...plan,
        summary:
          `Parallel work unit ${unit.id}: ${unit.description}`,
        steps: plan.steps.filter((step) =>
          step.files.some((file) =>
            approvedFiles.has(file),
          ),
        ),
        affectedFiles: [...unit.files],
      };
    }
  }