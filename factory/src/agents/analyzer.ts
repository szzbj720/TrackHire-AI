import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import type { ModelProvider } from "../models/provider.js";
  import type { RepositoryContext } from "../context/context-builder.js";
  import { taskAnalysisSchema } from "../schemas/task-analysis.js";
  
  export interface TaskAnalyzer {
    analyze(
      task: EngineeringTask,
      context: RepositoryContext,
    ): Promise<TaskAnalysis>;
  }
  
  export class ModelTaskAnalyzer implements TaskAnalyzer {
    constructor(private readonly provider: ModelProvider) {}
  
    async analyze(
      task: EngineeringTask,
      context: RepositoryContext,
    ): Promise<TaskAnalysis> {
      const response = await this.provider.generate({
        systemPrompt: [
          "You are a software engineering task analyzer.",
          "Analyze the task using the supplied repository context.",
          "Do not modify any code.",
          "Identify complexity, risk, affected areas, relevant files, ambiguities, and assumptions.",
          "Return only valid JSON matching the requested TaskAnalysis structure.",
        ].join(" "),
  
        userPrompt: JSON.stringify({
          task: {
            request: task.request,
            requirements: task.requirements,
            acceptanceCriteria: task.acceptanceCriteria,
            constraints: task.constraints,
          },
  
          repository: {
            summary: context.summary,
  
            relevantFiles: context.relevantFiles,
  
            fileContents: context.fileContents.map((file) => ({
              path: file.path,
              content: file.content,
              truncated: file.truncated,
            })),
          },
        }),
      });
  
      const parsed = JSON.parse(response.content);
  
      return taskAnalysisSchema.parse(parsed);
    }
  }