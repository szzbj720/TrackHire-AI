import type {
  ModelProvider,
} from "../models/provider.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import {
  reviewResultSchema,
  type ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";

export interface ReviewerInput {
  task: EngineeringTask;
  plan: ImplementationPlan;
  implementation: ImplementationResult;
  validation: ValidationResult;
  verification?: VerificationResult;
  relevantFiles: Array<{
    path: string;
    content: string;
  }>;
}

export interface Reviewer {
  review(
    input: ReviewerInput,
  ): Promise<ReviewResult>;
}

export class ModelReviewer
  implements Reviewer
{
  constructor(
    private readonly provider: ModelProvider,
  ) {}

  async review(
    input: ReviewerInput,
  ): Promise<ReviewResult> {
    if (!input.validation.passed) {
      throw new Error(
        "Cannot review an implementation that failed deterministic validation.",
      );
    }

    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are an independent software engineering reviewer.",
          "Review the implementation using the supplied task, approved plan, implementation evidence, deterministic validation evidence, independent verification evidence when available, and current relevant files.",
          "Do not modify code.",
          "Do not propose unrelated improvements or expand the approved task scope.",
          "Evaluate correctness, regressions, requirement coverage, scope compliance, and missing validation.",
          "Treat failed independent verification probes as concrete negative evidence that must be addressed before approval unless the supplied evidence clearly shows the probe itself is invalid.",
          "Do not assume successful independent verification proves every requirement is satisfied.",
          "Every finding must include concrete evidence.",
          "For every supplied task requirement, include requirement coverage and evidence supporting whether it is satisfied.",
          "Do not treat passing tests as proof that every requirement is satisfied.",
          "Set requiresHumanInput to true when requirements are ambiguous, evidence is insufficient, verification evidence conflicts with other evidence, or a safe conclusion requires human judgment.",
          "Confidence must represent how strongly the available evidence supports the review.",
          "Return only valid JSON matching the requested ReviewResult structure.",
        ].join(" "),
        userPrompt: JSON.stringify({
          task: {
            request: input.task.request,
            requirements:
              input.task.requirements,
            acceptanceCriteria:
              input.task.acceptanceCriteria,
            constraints:
              input.task.constraints,
          },
          plan: input.plan,
          implementation:
            input.implementation,
          validation:
            input.validation,
          ...(input.verification
            ? {
                verification:
                  input.verification,
              }
            : {}),
          relevantFiles:
            input.relevantFiles,
        }),
      });

    const parsed: unknown = JSON.parse(
      response.content,
    );

    return reviewResultSchema.parse(
      parsed,
    );
  }
}
