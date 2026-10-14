import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  export interface BuilderInput {
    task: EngineeringTask;
    plan: ImplementationPlan;
    worktreePath: string;
  }
  
  export interface Builder {
    implement(
      input: BuilderInput,
    ): Promise<ImplementationResult>;
  }