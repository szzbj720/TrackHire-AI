import type { TaskAnalyzer } from "../agents/analyzer.js";
import type { Planner } from "../agents/planner.js";
import { buildRepositoryContext } from "../context/context-builder.js";
import type { EngineeringTask } from "../schemas/task.js";
import { Orchestrator } from "./orchestrator.js";

export class PlanningWorkflow {
  constructor(
    private readonly analyzer: TaskAnalyzer,
    private readonly planner: Planner,
  ) {}

  async run(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<Orchestrator> {
    const orchestrator = new Orchestrator(task);

    orchestrator.transition("ANALYZING");

    const context = await buildRepositoryContext(
      task,
      repositoryRoot,
    );

    const analysis = await this.analyzer.analyze(
      orchestrator.getTask(),
      context,
    );

    orchestrator.setAnalysis(analysis);

    if (analysis.requiresHumanInput) {
      orchestrator.transition("NEEDS_HUMAN");
      return orchestrator;
    }

    orchestrator.transition("PLANNING");

    const plan = await this.planner.plan(
      orchestrator.getTask(),
      analysis,
      context,
    );

    orchestrator.setPlan(plan);

    if (plan.requiresHumanInput) {
      orchestrator.transition("NEEDS_HUMAN");
      return orchestrator;
    }

    orchestrator.transition(
      "AWAITING_PLAN_APPROVAL",
    );

    return orchestrator;
  }
}