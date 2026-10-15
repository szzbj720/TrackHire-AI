import type { Decomposer } from "../agents/decomposer.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { WorkGraph } from "../schemas/work-graph.js";

export interface ParallelPlanningResult {
  task: EngineeringTask;
  workGraph: WorkGraph;
}

export class ParallelPlanningWorkflow {
  constructor(
    private readonly decomposer: Decomposer,
  ) {}

  async run(
    task: EngineeringTask,
  ): Promise<ParallelPlanningResult> {
    if (
      task.status !== "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Cannot prepare parallel execution while task is in state ${task.status}.`,
      );
    }

    if (task.strategy?.mode !== "parallel") {
      throw new Error(
        "Parallel planning requires a parallel execution strategy.",
      );
    }

    if (!task.plan) {
      throw new Error(
        "Parallel planning requires an implementation plan.",
      );
    }

    if (task.plan.requiresHumanInput) {
      throw new Error(
        "Cannot prepare parallel execution from a plan that still requires human input.",
      );
    }

    const workGraph =
      await this.decomposer.decompose({
        task,
        plan: task.plan,
      });

    return {
      task,
      workGraph,
    };
  }
}