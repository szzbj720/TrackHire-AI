import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";

import type {
  ModelProvider,
} from "../models/provider.js";

import type {
  RepositoryContext,
} from "../context/context-builder.js";

import {
  taskAnalysisSchema,
} from "../schemas/task-analysis.js";

export interface TaskAnalyzer {
  analyze(
    task: EngineeringTask,
    context: RepositoryContext,
  ): Promise<TaskAnalysis>;
}

function createTaskAnalysisJsonSchema(
  context: RepositoryContext,
): Record<string, unknown> {
  const allowedFiles =
    context.relevantFiles.map(
      (file) => file.path,
    );

  return {
    type:
      "object",

    properties: {
      complexity: {
        type:
          "string",

        enum: [
          "low",
          "medium",
          "high",
        ],
      },

      risk: {
        type:
          "string",

        enum: [
          "low",
          "medium",
          "high",
        ],
      },

      affectedAreas: {
        type:
          "array",

        items: {
          type:
            "string",
        },
      },

      relevantFiles: {
        type:
          "array",

        items:
          allowedFiles.length > 0
            ? {
                type:
                  "string",

                enum:
                  allowedFiles,
              }
            : {
                type:
                  "string",
              },

        uniqueItems:
          true,
      },

      ambiguities: {
        type:
          "array",

        items: {
          type:
            "string",
        },
      },

      assumptions: {
        type:
          "array",

        items: {
          type:
            "string",
        },
      },

      confidence: {
        type:
          "number",

        minimum:
          0,

        maximum:
          1,
      },

      requiresHumanInput: {
        type:
          "boolean",
      },

      reasoning: {
        type:
          "string",

        minLength:
          1,
      },
    },

    required: [
      "complexity",
      "risk",
      "affectedAreas",
      "relevantFiles",
      "ambiguities",
      "assumptions",
      "confidence",
      "requiresHumanInput",
      "reasoning",
    ],

    additionalProperties:
      false,
  };
}

export class ModelTaskAnalyzer
  implements TaskAnalyzer {
  constructor(
    private readonly provider:
      ModelProvider,
  ) {}

  async analyze(
    task: EngineeringTask,
    context: RepositoryContext,
  ): Promise<TaskAnalysis> {
    const allowedFiles =
      context.relevantFiles.map(
        (file) => file.path,
      );

    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are a software engineering task analyzer.",
          "Analyze the task using only the supplied repository context.",
          "Do not modify any code.",
          "Do not invent repository files.",
          "Every path in relevantFiles must come from the supplied allowedRepositoryFiles list.",
          "Select every supplied file that is genuinely relevant to implementing the task.",
          "Identify complexity, risk, affected areas, relevant files, ambiguities, assumptions, confidence, whether human input is needed, and reasoning.",
          "Only set requiresHumanInput to true when a real unresolved ambiguity prevents safe planning.",
          "Do not require human input merely because the repository uses classes or architecture that you need to inspect.",
          "Return only the requested structured JSON.",
        ].join(
          " ",
        ),

        userPrompt:
          JSON.stringify({
            task: {
              request:
                task.request,

              requirements:
                task.requirements,

              acceptanceCriteria:
                task.acceptanceCriteria,

              constraints:
                task.constraints,
            },

            allowedRepositoryFiles:
              allowedFiles,

            repository: {
              summary:
                context.summary,

              relevantFiles:
                context.relevantFiles,

              fileContents:
                context.fileContents.map(
                  (
                    file,
                  ) => ({
                    path:
                      file.path,

                    content:
                      file.content,

                    truncated:
                      file.truncated,
                  }),
                ),
            },
          }),

        responseSchema:
          createTaskAnalysisJsonSchema(
            context,
          ),
      });

    const parsed:
      unknown =
      JSON.parse(
        response.content,
      );

    return taskAnalysisSchema.parse(
      parsed,
    );
  }
}