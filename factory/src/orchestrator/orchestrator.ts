import type { FactoryEvent } from "../schemas/event.js";
import type { ImplementationPlan } from "../schemas/plan.js";
import type {
  EngineeringTask,
  FactoryState,
  TaskAnalysis,
} from "../schemas/task.js";
import { transitionState } from "./state-machine.js";

export class Orchestrator {
  private task: EngineeringTask;
  private events: FactoryEvent[] = [];

  constructor(task: EngineeringTask) {
    this.task = task;
  }

  getTask(): EngineeringTask {
    return this.task;
  }

  getEvents(): FactoryEvent[] {
    return [...this.events];
  }

  setAnalysis(analysis: TaskAnalysis): void {
    this.task = {
      ...this.task,
      analysis,
      updatedAt: new Date().toISOString(),
    };
  }

  setPlan(plan: ImplementationPlan): void {
    this.task = {
      ...this.task,
      plan,
      updatedAt: new Date().toISOString(),
    };
  }

  approvePlan(): void {
    if (
      this.task.status !== "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Cannot approve plan while task is in state ${this.task.status}`,
      );
    }

    this.transition("IMPLEMENTING");

    this.events.push({
      id: crypto.randomUUID(),
      taskId: this.task.id,
      type: "HUMAN_APPROVAL_RECEIVED",
      timestamp: new Date().toISOString(),
      stage: "IMPLEMENTING",
      message: "Implementation plan approved by human.",
    });
  }

  rejectPlan(): void {
    if (
      this.task.status !== "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Cannot reject plan while task is in state ${this.task.status}`,
      );
    }

    this.transition("PLANNING");

    this.events.push({
      id: crypto.randomUUID(),
      taskId: this.task.id,
      type: "HUMAN_APPROVAL_RECEIVED",
      timestamp: new Date().toISOString(),
      stage: "PLANNING",
      message: "Implementation plan rejected by human.",
    });
  }

  transition(nextState: FactoryState): void {
    const previousState = this.task.status;
    const newState = transitionState(
      previousState,
      nextState,
    );

    this.task = {
      ...this.task,
      status: newState,
      updatedAt: new Date().toISOString(),
    };

    this.events.push({
      id: crypto.randomUUID(),
      taskId: this.task.id,
      type: "STATE_TRANSITION",
      timestamp: new Date().toISOString(),
      stage: newState,
      transition: {
        from: previousState,
        to: newState,
      },
    });
  }
}