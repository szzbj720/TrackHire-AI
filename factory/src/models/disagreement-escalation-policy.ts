import type {
    ModelDisagreement,
  } from "./model-disagreement.js";
  import type {
    TaskRisk,
  } from "../schemas/task.js";
  
  export type EscalationReason =
    | "model-requested-human-input"
    | "material-model-disagreement"
    | "low-confidence-high-risk";
  
  export interface DisagreementEscalationRequest {
    disagreement: ModelDisagreement;
    taskRisk: TaskRisk;
    minimumConfidence?: number;
  }
  
  export interface DisagreementEscalationDecision {
    requiresHumanInput: boolean;
    reasons: EscalationReason[];
  }
  
  const DEFAULT_MINIMUM_CONFIDENCE = 0.7;
  
  export function evaluateDisagreementEscalation(
    request: DisagreementEscalationRequest,
  ): DisagreementEscalationDecision {
    const minimumConfidence =
      request.minimumConfidence ??
      DEFAULT_MINIMUM_CONFIDENCE;
  
    if (
      minimumConfidence < 0 ||
      minimumConfidence > 1
    ) {
      throw new Error(
        "Minimum confidence must be between 0 and 1.",
      );
    }
  
    const reasons: EscalationReason[] = [];
  
    const modelRequestedHumanInput =
      request.disagreement.judgments.some(
        (judgment) =>
          judgment.requiresHumanInput,
      );
  
    if (modelRequestedHumanInput) {
      reasons.push(
        "model-requested-human-input",
      );
    }
  
    const riskRequiresDisagreementEscalation =
      request.taskRisk === "medium" ||
      request.taskRisk === "high";
  
    if (
      request.disagreement.disagreed &&
      riskRequiresDisagreementEscalation
    ) {
      reasons.push(
        "material-model-disagreement",
      );
    }
  
    const hasLowConfidence =
      request.disagreement.judgments.some(
        (judgment) =>
          judgment.confidence <
          minimumConfidence,
      );
  
    if (
      request.taskRisk === "high" &&
      hasLowConfidence
    ) {
      reasons.push(
        "low-confidence-high-risk",
      );
    }
  
    return {
      requiresHumanInput:
        reasons.length > 0,
      reasons,
    };
  }