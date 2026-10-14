import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import type { ModelProvider } from "../models/provider.js";
  import { taskAnalysisSchema } from "../schemas/task-analysis.js";
  
  export interface TaskAnalyzer {
    analyze(task: EngineeringTask): Promise<TaskAnalysis>;
  }
  
  export class ModelTaskAnalyzer implements TaskAnalyzer {
    constructor(private readonly provider: ModelProvider) {}
  
    async analyze(task: EngineeringTask): Promise<TaskAnalysis> {
      const response = await this.provider.generate({
        systemPrompt: [
          "You are a software engineering task analyzer.",
          "Analyze the task without modifying any code.",
          "Return only valid JSON matching the requested TaskAnalysis structure.",
        ].join(" "),
        userPrompt: JSON.stringify({
          request: task.request,
          requirements: task.requirements,
          acceptanceCriteria: task.acceptanceCriteria,
          constraints: task.constraints,
        }),
      });
  
      const parsed = JSON.parse(response.content);
  
      return taskAnalysisSchema.parse(parsed);
    }
  }