import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  PlanningWorkflow,
} from "./planning-workflow.js";
import type {
  FactoryRunner,
  FactoryRunnerResult,
} from "./factory-runner.js";

export interface FactoryEntrypointResult {
  plannedTask: EngineeringTask;
  execution?: FactoryRunnerResult;
  stopReason:
    | "HUMAN_INPUT_REQUIRED"
    | "PLAN_APPROVAL_REQUIRED";
}

export class FactoryEntrypoint {
  constructor(
    private readonly planningWorkflow: PlanningWorkflow,
    private readonly factoryRunner: FactoryRunner,
  ) {}

  async plan(
    task: EngineeringTask,
    repositoryRoot: string,
  ): Promise<FactoryEntrypointResult> {
    const orchestrator =
      await this.planningWorkflow.run(
        task,
        repositoryRoot,
      );
    const plannedTask = orchestrator.getTask();

    if (plannedTask.status === "NEEDS_HUMAN") {
      return {
        plannedTask,
        stopReason: "HUMAN_INPUT_REQUIRED",
      };
    }

    if (plannedTask.status !== "AWAITING_PLAN_APPROVAL") {
      throw new Error(
        `FactoryEntrypoint cannot continue from planning state ${plannedTask.status}.`,
      );
    }

    return {
      plannedTask,
      stopReason: "PLAN_APPROVAL_REQUIRED",
    };
  }

  async resumeAfterPlanApproval(
    plannedTask: EngineeringTask,
    repositoryRoot: string,
    timestamp = new Date().toISOString(),
    baseBranch = "main",
  ): Promise<FactoryRunnerResult> {
    if (plannedTask.status !== "AWAITING_PLAN_APPROVAL") {
      throw new Error(
        `FactoryEntrypoint requires an approved planned task, received ${plannedTask.status}.`,
      );
    }

    return this.factoryRunner.run(
      plannedTask,
      repositoryRoot,
      timestamp,
      baseBranch,
    );
  }
}
