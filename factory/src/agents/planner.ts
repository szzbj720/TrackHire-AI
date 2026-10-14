import type { RepositoryContext } from "../context/context-builder.js";
import type { ModelProvider } from "../models/provider.js";
import {
  implementationPlanSchema,
  type ImplementationPlan,
} from "../schemas/plan.js";
import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";

export interface Planner {
  plan(
    task: EngineeringTask,
    analysis: TaskAnalysis,
    context: RepositoryContext,
  ): Promise<ImplementationPlan>;
}

export class ModelPlanner implements Planner {
  constructor(private readonly provider: ModelProvider) {}

  async plan(
    task: EngineeringTask,
    analysis: TaskAnalysis,
    context: RepositoryContext,
  ): Promise<ImplementationPlan> {
    const response = await this.provider.generate({
      systemPrompt: [
        "You are a software engineering implementation planner.",
        "Create a concrete implementation plan using the task analysis and supplied repository context.",
        "Do not modify any code.",
        "Do not invent files that are not supported by the repository context.",
        "Identify implementation steps, affected files, validation steps, risks, and assumptions.",
        "If important information is missing or ambiguous, set requiresHumanInput to true.",
        "Return only valid JSON matching the requested ImplementationPlan structure.",
      ].join(" "),

      userPrompt: JSON.stringify({
        task: {
          request: task.request,
          requirements: task.requirements,
          acceptanceCriteria: task.acceptanceCriteria,
          constraints: task.constraints,
        },

        analysis,

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

    return implementationPlanSchema.parse(parsed);
  }
}