import type { ImplementationPlan } from "../schemas/plan.js";
import type { EngineeringTask } from "../schemas/task.js";
import {
  validateWorkGraph,
  type WorkGraph,
} from "../schemas/work-graph.js";

export interface DecomposerInput {
  task: EngineeringTask;
  plan: ImplementationPlan;
}

export interface Decomposer {
  decompose(
    input: DecomposerInput,
  ): Promise<WorkGraph>;
}

export interface WorkGraphGenerator {
  generateWorkGraph(
    input: DecomposerInput,
  ): Promise<WorkGraph>;
}

export class ModelDecomposer implements Decomposer {
  constructor(
    private readonly generator: WorkGraphGenerator,
  ) {}

  async decompose(
    input: DecomposerInput,
  ): Promise<WorkGraph> {
    if (input.task.strategy?.mode !== "parallel") {
      throw new Error(
        "Work decomposition requires a parallel execution strategy.",
      );
    }

    if (input.plan.requiresHumanInput) {
      throw new Error(
        "Cannot decompose a plan that still requires human input.",
      );
    }

    const graph =
      await this.generator.generateWorkGraph(input);

    const validation = validateWorkGraph(graph);

    if (!validation.valid) {
      throw new Error(
        `Generated work graph is invalid: ${validation.errors.join(" ")}`,
      );
    }

    return graph;
  }
}