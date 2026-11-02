import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";
import {
  trustDecisionSchema,
  type TrustDecision,
  type TrustEvidence,
} from "../schemas/trust-decision.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  evaluateAutonomyPolicy,
} from "../orchestrator/autonomy-policy.js";

export interface TrustDecisionInput {
  task: EngineeringTask;
  validation: ValidationResult;
  verification: VerificationResult;
  review: ReviewResult;
}

export class TrustDecisionEngine {
  constructor(
    private readonly mergeConfidenceThreshold = 0.8,
    private readonly maxRepairAttempts = 2,
  ) {}

  decide(
    input: TrustDecisionInput,
  ): TrustDecision {
    const evidence =
      this.buildEvidence(input);

    if (
      input.review.requiresHumanInput
    ) {
      return this.createDecision({
        action: "ESCALATE",
        confidence:
          input.review.confidence,
        reasons: [
          "The independent review requires human judgment.",
        ],
        evidence,
      });
    }

    if (
      input.task.analysis?.requiresHumanInput
    ) {
      return this.createDecision({
        action: "ESCALATE",
        confidence:
          input.review.confidence,
        reasons: [
          "Task analysis requires human judgment before autonomous continuation.",
        ],
        evidence,
      });
    }

    const repairBudget =
      this.getRepairBudget(input.task);

    if (
      input.task.repairAttempts >=
      repairBudget
    ) {
      return this.createDecision({
        action: "ESCALATE",
        confidence:
          input.review.confidence,
        reasons: [
          "The repair attempt budget has been exhausted.",
        ],
        evidence,
      });
    }

    if (
      input.validation.passed &&
      input.verification.passed &&
      input.review.approved &&
      input.review.confidence >=
        this.mergeConfidenceThreshold
    ) {
      return this.createDecision({
        action: "MERGE",
        confidence:
          input.review.confidence,
        reasons: [
          "Deterministic validation passed.",
          "Independent verification passed.",
          "Independent review approved the implementation with sufficient confidence.",
        ],
        evidence,
      });
    }

    if (
      !input.validation.passed ||
      !input.verification.passed ||
      !input.review.approved
    ) {
      return this.createDecision({
        action: "RETRY",
        confidence:
          input.review.confidence,
        reasons: [
          "Actionable negative evidence remains and the repair budget has not been exhausted.",
        ],
        evidence,
      });
    }

    return this.createDecision({
      action: "ESCALATE",
      confidence:
        input.review.confidence,
      reasons: [
        "The available evidence is not strong enough to trust an autonomous merge.",
      ],
      evidence,
    });
  }

  private getRepairBudget(
    task: EngineeringTask,
  ): number {
    if (task.analysis && task.strategy) {
      return evaluateAutonomyPolicy(task)
        .maxAutonomousRepairAttempts;
    }

    return this.maxRepairAttempts;
  }

  private buildEvidence(
    input: TrustDecisionInput,
  ): TrustEvidence[] {
    const risk =
      input.task.analysis?.risk;

    return [
      {
        source: "validation",
        signal: input.validation.passed
          ? "Deterministic validation passed."
          : "Deterministic validation failed.",
        supportsTrust:
          input.validation.passed,
      },
      {
        source: "verification",
        signal: input.verification.passed
          ? "Independent verification passed."
          : `Independent verification failed: ${input.verification.failedProbes.join(", ")}.`,
        supportsTrust:
          input.verification.passed,
      },
      {
        source: "review",
        signal: input.review.approved
          ? `Independent review approved with confidence ${input.review.confidence}.`
          : `Independent review rejected with confidence ${input.review.confidence}.`,
        supportsTrust:
          input.review.approved &&
          !input.review
            .requiresHumanInput,
      },
      {
        source: "risk",
        signal:
          `Task risk is ${this.describeRisk(risk)}.`,
        supportsTrust:
          risk === "low",
      },
    ];
  }

  private describeRisk(
    risk: TaskRisk | undefined,
  ): string {
    return risk ?? "unknown";
  }

  private createDecision(
    decision: TrustDecision,
  ): TrustDecision {
    return trustDecisionSchema.parse(
      decision,
    );
  }
}
