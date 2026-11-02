import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  TrustDecision,
} from "../schemas/trust-decision.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  TrustDecisionEngine,
} from "../trust/trust-decision-engine.js";

export interface TrustDecisionWorkflowInput {
  task: EngineeringTask;
  validation: ValidationResult;
  verification: VerificationResult;
  review: ReviewResult;
}

export class TrustDecisionWorkflow {
  constructor(
    private readonly engine =
      new TrustDecisionEngine(),
  ) {}

  run(
    input: TrustDecisionWorkflowInput,
  ): TrustDecision {
    return this.engine.decide(input);
  }
}
