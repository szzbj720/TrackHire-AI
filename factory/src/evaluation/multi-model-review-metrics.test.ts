import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  import {
    collectMultiModelReviewMetrics,
  } from "./multi-model-review-metrics.js";
  
  function createReviewResult(
    overrides: Partial<MultiModelReviewResult> = {},
  ): MultiModelReviewResult {
    return {
      executions: [
        {
          targetId: "reviewer-a",
          model: "model-a",
          status: "success",
          review: {
            approved: true,
            summary: "Approved.",
            findings: [],
            requirementCoverage: [],
            requiresHumanInput: false,
            confidence: 0.9,
          },
        },
        {
          targetId: "reviewer-b",
          model: "model-b",
          status: "success",
          review: {
            approved: true,
            summary: "Approved.",
            findings: [],
            requirementCoverage: [],
            requiresHumanInput: false,
            confidence: 0.85,
          },
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
            confidence: 0.85,
          },
        ],
      },
      escalation: {
        requiresHumanInput: false,
        reasons: [],
      },
      ...overrides,
    };
  }
  
  describe(
    "collectMultiModelReviewMetrics",
    () => {
      it("summarizes agreeing model reviews", () => {
        const metrics =
          collectMultiModelReviewMetrics(
            createReviewResult(),
          );
  
        expect(metrics).toEqual({
          reviewCount: 2,
          successfulReviews: 2,
          failedReviews: 0,
          disagreement: false,
          disagreementReasons: 0,
          escalationRequired: false,
          escalationReasons: 0,
        });
      });
  
      it("records disagreement and escalation", () => {
        const result =
          createReviewResult({
            disagreement: {
              disagreed: true,
              reasons: [
                "approval",
              ],
              judgments: [
                {
                  targetId:
                    "reviewer-a",
                  model: "model-a",
                  approved: true,
                  requiresHumanInput:
                    false,
                  confidence: 0.9,
                },
                {
                  targetId:
                    "reviewer-b",
                  model: "model-b",
                  approved: false,
                  requiresHumanInput:
                    false,
                  confidence: 0.8,
                },
              ],
            },
            escalation: {
              requiresHumanInput: true,
              reasons: [
                "material-model-disagreement",
              ],
            },
          });
  
        const metrics =
          collectMultiModelReviewMetrics(
            result,
          );
  
        expect(
          metrics.disagreement,
        ).toBe(true);
  
        expect(
          metrics.disagreementReasons,
        ).toBe(1);
  
        expect(
          metrics.escalationRequired,
        ).toBe(true);
  
        expect(
          metrics.escalationReasons,
        ).toBe(1);
      });
  
      it("records failed model reviews separately from disagreement", () => {
        const result =
          createReviewResult({
            executions: [
              {
                targetId: "reviewer-a",
                model: "model-a",
                status: "success",
                review: {
                  approved: true,
                  summary: "Approved.",
                  findings: [],
                  requirementCoverage: [],
                  requiresHumanInput:
                    false,
                  confidence: 0.9,
                },
              },
              {
                targetId: "reviewer-b",
                model: "model-b",
                status: "error",
                error:
                  "Reviewer unavailable.",
              },
            ],
            disagreement: {
              disagreed: false,
              reasons: [],
              judgments: [
                {
                  targetId:
                    "reviewer-a",
                  model: "model-a",
                  approved: true,
                  requiresHumanInput:
                    false,
                  confidence: 0.9,
                },
              ],
            },
          });
  
        const metrics =
          collectMultiModelReviewMetrics(
            result,
          );
  
        expect(
          metrics.reviewCount,
        ).toBe(2);
  
        expect(
          metrics.successfulReviews,
        ).toBe(1);
  
        expect(
          metrics.failedReviews,
        ).toBe(1);
  
        expect(
          metrics.disagreement,
        ).toBe(false);
      });
  
      it("counts multiple disagreement and escalation reasons", () => {
        const result =
          createReviewResult({
            disagreement: {
              disagreed: true,
              reasons: [
                "approval",
                "human-input",
              ],
              judgments: [],
            },
            escalation: {
              requiresHumanInput: true,
              reasons: [
                "model-requested-human-input",
                "material-model-disagreement",
              ],
            },
          });
  
        const metrics =
          collectMultiModelReviewMetrics(
            result,
          );
  
        expect(
          metrics.disagreementReasons,
        ).toBe(2);
  
        expect(
          metrics.escalationReasons,
        ).toBe(2);
      });
    },
  );
  