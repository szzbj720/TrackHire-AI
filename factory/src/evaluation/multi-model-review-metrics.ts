import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  
  export interface MultiModelReviewMetrics {
    reviewCount: number;
    successfulReviews: number;
    failedReviews: number;
    disagreement: boolean;
    disagreementReasons: number;
    escalationRequired: boolean;
    escalationReasons: number;
  }
  
  export function collectMultiModelReviewMetrics(
    result: MultiModelReviewResult,
  ): MultiModelReviewMetrics {
    const successfulReviews =
      result.executions.filter(
        (execution) =>
          execution.status === "success",
      ).length;
  
    const failedReviews =
      result.executions.filter(
        (execution) =>
          execution.status === "error",
      ).length;
  
    return {
      reviewCount:
        result.executions.length,
      successfulReviews,
      failedReviews,
      disagreement:
        result.disagreement.disagreed,
      disagreementReasons:
        result.disagreement.reasons.length,
      escalationRequired:
        result.escalation
          .requiresHumanInput,
      escalationReasons:
        result.escalation.reasons.length,
    };
  }