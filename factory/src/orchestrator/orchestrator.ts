import type {
    EngineeringTask,
    FactoryState,
    TaskAnalysis,
  } from "../schemas/task.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { FactoryEvent } from "../schemas/event.js";
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