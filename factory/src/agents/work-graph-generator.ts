import type {
  DecomposerInput,
  WorkGraphGenerator,
} from "./decomposer.js";
import type {
  ModelProvider,
} from "../models/provider.js";
import type { WorkGraph } from "../schemas/work-graph.js";

function createWorkGraphJsonSchema(
  allowedFiles: string[],
): Record<string, unknown> {
  const fileSchema =
    allowedFiles.length > 0
      ? {
          type: "string",
          enum: allowedFiles,
        }
      : {
          type: "string",
        };

  return {
    type: "object",
    properties: {
      units: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 1,
            },
            description: {
              type: "string",
              minLength: 1,
            },
            files: {
              type: "array",
              items: fileSchema,
              uniqueItems: true,
            },
            dependsOn: {
              type: "array",
              items: {
                type: "string",
              },
              uniqueItems: true,
            },
          },
          required: [
            "id",
            "description",
            "files",
            "dependsOn",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["units"],
    additionalProperties: false,
  };
}

export class ModelWorkGraphGenerator
  implements WorkGraphGenerator {
  constructor(
    private readonly provider: ModelProvider,
  ) {}

  async generateWorkGraph(
    input: DecomposerInput,
  ): Promise<WorkGraph> {
    const allowedFiles = input.plan.affectedFiles;

    const response = await this.provider.generate({
      systemPrompt: [
        "You are a software engineering work decomposition planner.",
        "Decompose the approved implementation plan into concrete work units for controlled parallel execution.",
        "Do not modify code.",
        "Every file assigned to a work unit must come from allowedFiles.",
        "Use dependencies to order units that must not execute concurrently.",
        "Independent units must not modify the same file.",
        "Keep the graph minimal and preserve the approved plan's intent.",
        "Every dependency must reference another returned work unit id.",
        "Do not create dependency cycles or self-dependencies.",
        "Return only the requested structured JSON.",
      ].join(" "),
      userPrompt: JSON.stringify({
        task: {
          request: input.task.request,
          requirements: input.task.requirements,
          acceptanceCriteria:
            input.task.acceptanceCriteria,
          constraints: input.task.constraints,
        },
        plan: input.plan,
        allowedFiles,
      }),
      responseSchema:
        createWorkGraphJsonSchema(allowedFiles),
    });

    const parsed: unknown = JSON.parse(
      response.content,
    );

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray(
        (parsed as { units?: unknown }).units,
      )
    ) {
      throw new Error(
        "Model returned an invalid work graph payload.",
      );
    }

    return parsed as WorkGraph;
  }
}
