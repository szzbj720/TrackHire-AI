import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  import type {
    ReviewResult,
  } from "../schemas/review.js";
  import type {
    ReviewWorkflowResult,
  } from "./review-workflow.js";
  
  export interface ReviewLifecycleEvidence {
    review?: ReviewResult;
    multiModelReview?: MultiModelReviewResult;
  }
  
  export function extractReviewLifecycleEvidence(
    result: ReviewWorkflowResult,
  ): ReviewLifecycleEvidence {
    return {
      ...(result.review
        ? {
            review: result.review,
          }
        : {}),
      ...(result.multiModelReview
        ? {
            multiModelReview:
              result.multiModelReview,
          }
        : {}),
    };
  }