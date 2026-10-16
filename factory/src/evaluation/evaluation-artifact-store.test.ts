import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    RunArtifactStore,
  } from "../artifact/run-artifact-store.js";
  import type {
    MultiModelReviewResult,
  } from "../models/multi-model-review-coordinator.js";
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import type {
    MultiModelReviewMetrics,
  } from "./multi-model-review-metrics.js";
  import {
    EvaluationArtifactStore,
  } from "./evaluation-artifact-store.js";
  
  function createMetrics(
    overrides: Partial<FactoryRunMetrics> = {},
  ): FactoryRunMetrics {
    return {
      runId: "RUN-001",
      taskId: "TH-001",
  
      strategy: "sequential",
  
      success: true,
      firstPassSuccess: true,
  
      validationFailures: 0,
      repairAttempts: 0,
      humanInterventions: 0,
      reviewFindings: 0,
  
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUsd: 0.01,
  
      planningDurationMs: 100,
      implementationDurationMs: 200,
      validationDurationMs: 50,
      reviewDurationMs: 25,
      totalDurationMs: 375,
  
      startedAt:
        "2026-10-16T00:00:00.000Z",
      completedAt:
        "2026-10-16T00:00:00.375Z",
  
      ...overrides,
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
          review: {
            approved: true,
            summary:
              "The implementation is approved.",
            findings: [],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "The field is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.9,
          },
        },
        {
          targetId: "reviewer-b",
          model: "model-b",
          status: "success",
          review: {
            approved: false,
            summary:
              "The implementation needs human review.",
            findings: [
              {
                severity: "HIGH",
                summary:
                  "Potential compatibility risk.",
                evidence: [
                  "The model changed.",
                ],
                files: [
                  "lib/models/job_application.dart",
                ],
                recommendation:
                  "Verify existing application loading.",
              },
            ],
            requirementCoverage: [
              {
                requirement:
                  "Interview date must be optional.",
                satisfied: true,
                evidence: [
                  "The field is nullable.",
                ],
              },
            ],
            requiresHumanInput: false,
            confidence: 0.8,
          },
        },
      ],
      disagreement: {
        disagreed: true,
        reasons: [
          "approval",
        ],
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
            approved: false,
            requiresHumanInput: false,
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
    };
  }
  
  function createMultiModelReviewMetrics():
    MultiModelReviewMetrics {
    return {
      reviewCount: 2,
      successfulReviews: 2,
      failedReviews: 0,
      disagreement: true,
      disagreementReasons: 1,
      escalationRequired: true,
      escalationReasons: 1,
    };
  }
  
  function createArtifactStore(): {
    artifactStore: RunArtifactStore;
    writeJson: ReturnType<typeof vi.fn>;
  } {
    const writeJson = vi.fn(
      async () => undefined,
    );
  
    const artifactStore = {
      writeJson,
    } as unknown as RunArtifactStore;
  
    return {
      artifactStore,
      writeJson,
    };
  }
  
  describe(
    "EvaluationArtifactStore",
    () => {
      it("persists validated run metrics", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        const metrics = createMetrics();
  
        await store.writeRunMetrics(
          metrics,
        );
  
        expect(
          writeJson,
        ).toHaveBeenCalledTimes(1);
  
        expect(
          writeJson,
        ).toHaveBeenCalledWith(
          "RUN-001",
          "metrics",
          metrics,
        );
      });
  
      it("uses the metrics run ID as the artifact run ID", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await store.writeRunMetrics(
          createMetrics({
            runId: "RUN-ABC",
          }),
        );
  
        expect(
          writeJson,
        ).toHaveBeenCalledWith(
          "RUN-ABC",
          "metrics",
          expect.objectContaining({
            runId: "RUN-ABC",
          }),
        );
      });
  
      it("persists metrics for every execution strategy", async () => {
        const strategies =
          [
            "lightweight",
            "sequential",
            "parallel",
          ] as const;
  
        for (
          const strategy of strategies
        ) {
          const {
            artifactStore,
            writeJson,
          } = createArtifactStore();
  
          const store =
            new EvaluationArtifactStore(
              artifactStore,
            );
  
          await store.writeRunMetrics(
            createMetrics({
              strategy,
            }),
          );
  
          expect(
            writeJson,
          ).toHaveBeenCalledWith(
            "RUN-001",
            "metrics",
            expect.objectContaining({
              strategy,
            }),
          );
        }
      });
  
      it("rejects invalid metrics before persistence", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        const invalidMetrics = {
          ...createMetrics(),
          repairAttempts: -1,
        };
  
        await expect(
          store.writeRunMetrics(
            invalidMetrics,
          ),
        ).rejects.toThrow();
  
        expect(
          writeJson,
        ).not.toHaveBeenCalled();
      });
  
      it("propagates artifact persistence failures", async () => {
        const writeJson = vi.fn(
          async () => {
            throw new Error(
              "Persistence failed.",
            );
          },
        );
  
        const artifactStore = {
          writeJson,
        } as unknown as RunArtifactStore;
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await expect(
          store.writeRunMetrics(
            createMetrics(),
          ),
        ).rejects.toThrow(
          "Persistence failed.",
        );
      });
  
      it("persists multi-model review evidence for the run", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        const review =
          createMultiModelReview();
  
        await store.writeMultiModelReview(
          "RUN-001",
          review,
        );
  
        expect(
          writeJson,
        ).toHaveBeenCalledTimes(1);
  
        expect(
          writeJson,
        ).toHaveBeenCalledWith(
          "RUN-001",
          "multi-model-review",
          review,
        );
      });
  
      it("preserves disagreement and escalation evidence", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await store.writeMultiModelReview(
          "RUN-DISAGREEMENT",
          createMultiModelReview(),
        );
  
        expect(
          writeJson,
        ).toHaveBeenCalledWith(
          "RUN-DISAGREEMENT",
          "multi-model-review",
          expect.objectContaining({
            disagreement:
              expect.objectContaining({
                disagreed: true,
                reasons: [
                  "approval",
                ],
              }),
            escalation:
              expect.objectContaining({
                requiresHumanInput: true,
                reasons: [
                  "material-model-disagreement",
                ],
              }),
          }),
        );
      });
  
      it("rejects an empty run ID before persisting multi-model review evidence", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await expect(
          store.writeMultiModelReview(
            "",
            createMultiModelReview(),
          ),
        ).rejects.toThrow(
          "Run ID is required to persist multi-model review evidence.",
        );
  
        expect(
          writeJson,
        ).not.toHaveBeenCalled();
      });
  
      it("propagates multi-model review persistence failures", async () => {
        const writeJson = vi.fn(
          async () => {
            throw new Error(
              "Persistence failed.",
            );
          },
        );
  
        const artifactStore = {
          writeJson,
        } as unknown as RunArtifactStore;
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await expect(
          store.writeMultiModelReview(
            "RUN-001",
            createMultiModelReview(),
          ),
        ).rejects.toThrow(
          "Persistence failed.",
        );
      });
  
      it("persists multi-model review metrics for the run", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        const metrics =
          createMultiModelReviewMetrics();
  
        await store.writeMultiModelReviewMetrics(
          "RUN-001",
          metrics,
        );
  
        expect(
          writeJson,
        ).toHaveBeenCalledTimes(1);
  
        expect(
          writeJson,
        ).toHaveBeenCalledWith(
          "RUN-001",
          "multi-model-review-metrics",
          metrics,
        );
      });
  
      it("rejects an empty run ID before persisting multi-model review metrics", async () => {
        const {
          artifactStore,
          writeJson,
        } = createArtifactStore();
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await expect(
          store.writeMultiModelReviewMetrics(
            "",
            createMultiModelReviewMetrics(),
          ),
        ).rejects.toThrow(
          "Run ID is required to persist multi-model review evidence.",
        );
  
        expect(
          writeJson,
        ).not.toHaveBeenCalled();
      });
  
      it("propagates multi-model review metrics persistence failures", async () => {
        const writeJson = vi.fn(
          async () => {
            throw new Error(
              "Persistence failed.",
            );
          },
        );
  
        const artifactStore = {
          writeJson,
        } as unknown as RunArtifactStore;
  
        const store =
          new EvaluationArtifactStore(
            artifactStore,
          );
  
        await expect(
          store.writeMultiModelReviewMetrics(
            "RUN-001",
            createMultiModelReviewMetrics(),
          ),
        ).rejects.toThrow(
          "Persistence failed.",
        );
      });
    },
  );