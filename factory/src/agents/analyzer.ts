import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  
  export interface TaskAnalyzer {
    analyze(task: EngineeringTask): Promise<TaskAnalysis>;
  }