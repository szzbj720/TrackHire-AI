import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Reviewer,
    ReviewerInput,
  } from "../agents/reviewer.js";
  import type {
    ReviewResult,
  } from "../schemas/review.js";
  import {
    MultiModelReviewCoordinator,
  } from "./multi-model-review-coordinator.js";
  
  class FakeReviewer
    implements Reviewer
  {
    constructor(
      private readonly result:
        ReviewResult,
    ) {}
  
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      return this.result;
    }
  }
  
  class FailingReviewer
    implements Reviewer
  {
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      throw new Error(
        "Reviewer unavailable",
      );
    }
  }
  
  function createReview(
    overrides: Partial<ReviewResult> = {},
  ): ReviewResult {
    return {
      approved: true,
      summary:
        "Implementation is approved.",
      findings: [],
      requirementCoverage: [
        {
          requirement:
            "Preserve existing behavior.",
          satisfied: true,
          evidence: [
            "Deterministic validation passed.",
          ],
        },
      ],
      requiresHumanInput: false,
      confidence: 0.9,
      ...overrides,
    };
  }
  
  function createInput():
    ReviewerInput {
    return {
      task: {
        id: "TH-001",
        request: "Update TrackHire.",
        status: "REVIEWING",
        requirements: [
          "Preserve existing behavior.",
        ],
        acceptanceCriteria: [
          "Tests pass.",
        ],
        constraints: [],
        repairAttempts: 0,
        createdAt:
          "2026-10-16T00:00:00.000Z",
        updatedAt:
          "2026-10-16T00:00:00.000Z",
      },
      plan: {
        summary: "Update the model.",
        steps: [
          {
            order: 1,
            description:
              "Update the model.",
            files: [
              "lib/models/job_application.dart",
            ],
            rationale:
              "Support the requested change.",
          },
        ],
        affectedFiles: [
          "lib/models/job_application.dart",
        ],
        validationSteps: [
          "Run tests.",
        ],
        risks: [],
        assumptions: [],
        requiresHumanInput: false,
      },
      implementation: {
        summary:
          "Updated the model.",
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
            changeType: "modified",
            summary:
              "Updated application model.",
          },
        ],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      },
      validation: {
        passed: true,
        checks: [
          {
            name: "tests",
            command: "flutter",
            args: ["test"],
            exitCode: 0,
            stdout: "",
            stderr: "",
            durationMs: 10,
            passed: true,
          },
        ],
        failedChecks: [],
        durationMs: 10,
      },
      relevantFiles: [
        {
          path:
            "lib/models/job_application.dart",
          content: "class JobApplication {}",
        },
      ],
    };
  }
  
  describe(
    "MultiModelReviewCoordinator",
    () => {
      it("records agreement between independent reviewers", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        const result =
          await coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  new FakeReviewer(
                    createReview({
                      confidence: 0.85,
                    }),
                  ),
              },
            ],
            "high",
          );
  
        expect(
          result.disagreement.disagreed,
        ).toBe(false);
  
        expect(
          result.escalation
            .requiresHumanInput,
        ).toBe(false);
  
        expect(
          result.executions,
        ).toHaveLength(2);
      });
  
      it("detects conflicting review decisions", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        const result =
          await coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  new FakeReviewer(
                    createReview({
                      approved: false,
                      summary:
                        "Implementation has a problem.",
                    }),
                  ),
              },
            ],
            "high",
          );
  
        expect(
          result.disagreement.disagreed,
        ).toBe(true);
  
        expect(
          result.disagreement.reasons,
        ).toContain("approval");
  
        expect(
          result.escalation
            .requiresHumanInput,
        ).toBe(true);
  
        expect(
          result.escalation.reasons,
        ).toContain(
          "material-model-disagreement",
        );
      });
  
      it("escalates when a reviewer requests human input", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        const result =
          await coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  new FakeReviewer(
                    createReview({
                      requiresHumanInput:
                        true,
                    }),
                  ),
              },
            ],
            "low",
          );
  
        expect(
          result.escalation
            .requiresHumanInput,
        ).toBe(true);
  
        expect(
          result.escalation.reasons,
        ).toContain(
          "model-requested-human-input",
        );
      });
  
      it("escalates low-confidence high-risk review", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        const result =
          await coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  new FakeReviewer(
                    createReview({
                      confidence: 0.5,
                    }),
                  ),
              },
            ],
            "high",
          );
  
        expect(
          result.escalation.reasons,
        ).toContain(
          "low-confidence-high-risk",
        );
      });
  
      it("preserves reviewer failures without losing successful evidence", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        const result =
          await coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  new FailingReviewer(),
              },
            ],
            "medium",
          );
  
        expect(
          result.executions,
        ).toEqual([
          {
            targetId: "reviewer-a",
            model: "model-a",
            status: "success",
            review: createReview(),
          },
          {
            targetId: "reviewer-b",
            model: "model-b",
            status: "error",
            error:
              "Reviewer unavailable",
          },
        ]);
  
        expect(
          result.disagreement.judgments,
        ).toHaveLength(1);
      });
  
      it("rejects fewer than two review targets", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        await expect(
          coordinator.review(
            createInput(),
            [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
            ],
            "medium",
          ),
        ).rejects.toThrow(
          "Multi-model review requires at least two review targets.",
        );
      });
  
      it("rejects duplicate review target IDs", async () => {
        const coordinator =
          new MultiModelReviewCoordinator();
  
        await expect(
          coordinator.review(
            createInput(),
            [
              {
                id: "reviewer",
                model: "model-a",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
              {
                id: "reviewer",
                model: "model-b",
                reviewer:
                  new FakeReviewer(
                    createReview(),
                  ),
              },
            ],
            "medium",
          ),
        ).rejects.toThrow(
          "Duplicate review target: reviewer",
        );
      });
    },
  );