import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  import type {
    ReviewResult,
  } from "../schemas/review.js";
  import type {
    ReviewWorkflowResult,
  } from "./review-workflow.js";
  import {
    extractReviewLifecycleEvidence,
  } from "./review-lifecycle-evidence.js";
  
  function createReview():
    ReviewResult {
    return {
      approved: true,
      summary: "Approved.",
      findings: [],
      requirementCoverage: [],
      requiresHumanInput: false,
      confidence: 0.9,
    };
  }
  
  function createMultiModelReview():
    MultiModelReviewResult {
    return {
      executions: [
        {
          targetId: "reviewer-a",
          model: "model-a",
          status: "success",
          review: createReview(),
        },
        {
          targetId: "reviewer-b",
          model: "model-b",
          status: "success",
          review: createReview(),
        },
      ],
      disagreement: {
        disagreed: false,
        reasons: [],
        judgments: [
          {
            targetId: "reviewer-a",
            model: "model-a",
            approved: true,
            requiresHumanInput: false,
            confidence: 0.9,
          },
          {
            targetId: "reviewer-b",
            model: "model-b",
            approved: true,
            requiresHumanInput: false,
            confidence: 0.9,
          },
        ],
      },
      escalation: {
        requiresHumanInput: false,
        reasons: [],
      },
    };
  }
  
  function createResult(
    overrides: Partial<ReviewWorkflowResult> = {},
  ): ReviewWorkflowResult {
    return {
      task: {
        id: "TH-001",
        request: "Test task.",
        status:
          "AWAITING_FINAL_APPROVAL",
        requirements: [
          "Test requirement.",
        ],
        acceptanceCriteria: [
          "The requirement is satisfied.",
        ],
        constraints: [],
        repairAttempts: 0,
        createdAt:
          "2026-10-16T00:00:00.000Z",
        updatedAt:
          "2026-10-16T00:00:00.000Z",
      },
      changeEvidence: {
        approvedFiles: [],
        reportedFiles: [],
        observedFiles: [],
        unreportedFiles: [],
        missingReportedFiles: [],
        unapprovedFiles: [],
        withinApprovedScope: true,
        reportMatchesObserved: true,
        patch: "",
      },
      ...overrides,
    };
  }
  
  describe(
    "extractReviewLifecycleEvidence",
    () => {
      it("preserves an ordinary review", () => {
        const review = createReview();
  
        const evidence =
          extractReviewLifecycleEvidence(
            createResult({
              review,
            }),
          );
  
        expect(evidence).toEqual({
          review,
        });
      });
  
      it("preserves multi-model review evidence", () => {
        const review = createReview();
  
        const multiModelReview =
          createMultiModelReview();
  
        const evidence =
          extractReviewLifecycleEvidence(
            createResult({
              review,
              multiModelReview,
            }),
          );
  
        expect(evidence).toEqual({
          review,
          multiModelReview,
        });
      });
  
      it("preserves multi-model evidence when no primary review exists", () => {
        const multiModelReview =
          createMultiModelReview();
  
        const evidence =
          extractReviewLifecycleEvidence(
            createResult({
              multiModelReview,
            }),
          );
  
        expect(evidence).toEqual({
          multiModelReview,
        });
      });
  
      it("returns empty evidence when review is skipped", () => {
        const evidence =
          extractReviewLifecycleEvidence(
            createResult(),
          );
  
        expect(evidence).toEqual({});
      });
    },
  );