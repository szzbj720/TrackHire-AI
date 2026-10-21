import {
  failureDiagnosisSchema,
  type FailureDiagnosis,
} from "../schemas/diagnosis.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  ModelProvider,
} from "../models/provider.js";

export interface DiagnosticianInput {
  task: EngineeringTask;
  plan: ImplementationPlan;
  implementation: ImplementationResult;
  validation: ValidationResult;
  relevantFiles: Array<{
    path: string;
    content: string;
  }>;
}

export interface Diagnostician {
  diagnose(
    input: DiagnosticianInput,
  ): Promise<FailureDiagnosis>;
}

const failureDiagnosisResponseSchema: Record<
  string,
  unknown
> = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: [
        "STATIC_ANALYSIS",
        "TEST_REGRESSION",
        "INCORRECT_IMPLEMENTATION",
        "INTEGRATION_MISMATCH",
        "ENVIRONMENT",
        "REQUIREMENT_AMBIGUITY",
        "UNKNOWN",
      ],
    },
    summary: {
      type: "string",
    },
    evidence: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
    },
    suspectedFiles: {
      type: "array",
      items: {
        type: "string",
      },
    },
    recommendedAction: {
      type: "string",
    },
    repairable: {
      type: "boolean",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    requiresHumanInput: {
      type: "boolean",
    },
  },
  required: [
    "category",
    "summary",
    "evidence",
    "suspectedFiles",
    "recommendedAction",
    "repairable",
    "confidence",
    "requiresHumanInput",
  ],
  additionalProperties: false,
};

function normalizeConfidence(
  value: unknown,
): unknown {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return value;
  }

  if (value > 1 && value <= 100) {
    return Math.min(
      1,
      Math.max(
        0,
        value / 100,
      ),
    );
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}

export class ModelDiagnostician
  implements Diagnostician
{
  constructor(
    private readonly provider:
      ModelProvider,
  ) {}

  async diagnose(
    input: DiagnosticianInput,
  ): Promise<FailureDiagnosis> {
    if (input.validation.passed) {
      throw new Error(
        "Cannot diagnose a successful validation result.",
      );
    }

    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are a software engineering failure diagnostician.",
          "Determine why an implementation failed deterministic validation.",
          "Use the supplied task, approved plan, implementation result, validation evidence, and relevant files.",
          "Do not modify code.",
          "Do not claim evidence that is not present in the supplied context.",
          "Classify the failure using one of the allowed failure categories.",
          "Confidence MUST be a decimal number between 0 and 1. For example, use 0.9 instead of 90.",
          "Set requiresHumanInput to true when requirements are ambiguous, evidence is insufficient, or a safe repair cannot be determined.",
          "Return only the requested FailureDiagnosis JSON object.",
        ].join(" "),

        userPrompt:
          JSON.stringify({
            task: {
              request:
                input.task.request,
              requirements:
                input.task.requirements,
              acceptanceCriteria:
                input.task
                  .acceptanceCriteria,
              constraints:
                input.task.constraints,
            },
            plan: input.plan,
            implementation:
              input.implementation,
            validation:
              input.validation,
            relevantFiles:
              input.relevantFiles,
          }),

        responseSchema:
          failureDiagnosisResponseSchema,
      });

    const parsed: unknown =
      JSON.parse(
        response.content,
      );

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      const diagnosis =
        parsed as Record<
          string,
          unknown
        >;

      diagnosis.confidence =
        normalizeConfidence(
          diagnosis.confidence,
        );
    }

    return failureDiagnosisSchema.parse(
      parsed,
    );
  }
}