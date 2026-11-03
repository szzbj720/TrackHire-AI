import type { RepositoryContext } from "../context/context-builder.js";
import type {
  ModelProvider,
} from "../models/provider.js";
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

function createImplementationPlanJsonSchema(
  context: RepositoryContext,
): Record<string, unknown> {
  const allowedFiles =
    context.relevantFiles.map(
      (file) => file.path,
    );

  const fileSchema =
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
        };

  return {
    type:
      "object",

    properties: {
      summary: {
        type:
          "string",

        minLength:
          1,
      },

      steps: {
        type:
          "array",

        minItems:
          1,

        items: {
          type:
            "object",

          properties: {
            order: {
              type:
                "integer",

              minimum:
                1,
            },

            description: {
              type:
                "string",

              minLength:
                1,
            },

            files: {
              type:
                "array",

              minItems:
                1,

              items:
                fileSchema,

              uniqueItems:
                true,
            },

            rationale: {
              type:
                "string",

              minLength:
                1,
            },
          },

          required: [
            "order",
            "description",
            "files",
            "rationale",
          ],

          additionalProperties:
            false,
        },
      },

      affectedFiles: {
        type:
          "array",

        items:
          fileSchema,

        uniqueItems:
          true,
      },

      validationSteps: {
        type:
          "array",

        minItems:
          1,

        items: {
          type:
            "string",
        },
      },

      risks: {
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

      requiresHumanInput: {
        type:
          "boolean",
      },
    },

    required: [
      "summary",
      "steps",
      "affectedFiles",
      "validationSteps",
      "risks",
      "assumptions",
      "requiresHumanInput",
    ],

    additionalProperties:
      false,
  };
}

function normalizePlanFileCoverage(
  plan: ImplementationPlan,
): ImplementationPlan {
  const implementationSteps =
    plan.steps.filter(
      (step) =>
        step.files.length > 0,
    );

  if (
    implementationSteps.length === 0
  ) {
    throw new Error(
      "Implementation plan does not contain any source-file modification steps.",
    );
  }

  const stepFiles =
    implementationSteps.flatMap(
      (step) => step.files,
    );

  return {
    ...plan,
    steps:
      implementationSteps,
    affectedFiles: [
      ...new Set([
        ...plan.affectedFiles,
        ...stepFiles,
      ]),
    ],
  };
}

export class ModelPlanner
  implements Planner {
  constructor(
    private readonly provider:
      ModelProvider,
  ) {}

  async plan(
    task: EngineeringTask,
    analysis: TaskAnalysis,
    context: RepositoryContext,
  ): Promise<ImplementationPlan> {
    const allowedFiles =
      context.relevantFiles.map(
        (file) => file.path,
      );

    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are a software engineering implementation planner.",
          "Create a concrete implementation plan using the task analysis and supplied repository context.",
          "Do not modify any code.",
          "Do not invent repository files.",
          "Every file in affectedFiles and every file referenced by a step must come from the supplied allowedRepositoryFiles list.",
          "Every file referenced by any implementation step must also appear in affectedFiles.",
          "Every item in steps must be a source-file modification step and must contain at least one file.",
          "Put static analysis, test execution, and other validation-only actions in validationSteps instead of steps.",
          "Only include files that genuinely need modification.",
          "The plan should describe how to implement the requested behavior using the existing architecture.",
          "Validation steps should describe deterministic checks such as static analysis or tests, not source-file modifications.",
          "Do not add implementation steps that modify unrelated files merely to describe validation.",
          "Set requiresHumanInput to true only when a real unresolved ambiguity prevents safe implementation.",
          "Do not require human input merely because multiple files or architectural layers are involved.",
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

            analysis,

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
          createImplementationPlanJsonSchema(
            context,
          ),
      });

    const parsed:
      unknown =
      JSON.parse(
        response.content,
      );

    const plan =
      implementationPlanSchema.parse(
        parsed,
      );

    return normalizePlanFileCoverage(
      plan,
    );
  }
}