import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    MetricsCollector,
  } from "./metrics-collector.js";
  
  describe("MetricsCollector", () => {
    it("creates zeroed metrics for a new run", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-001",
          taskId: "TH-001",
          strategy: "sequential",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:01.000Z",
        );
  
      expect(metrics).toEqual({
        runId: "RUN-001",
        taskId: "TH-001",
        strategy: "sequential",
  
        success: false,
        firstPassSuccess: false,
  
        validationFailures: 0,
        repairAttempts: 0,
        humanInterventions: 0,
        reviewFindings: 0,
  
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
  
        planningDurationMs: 0,
        implementationDurationMs: 0,
        validationDurationMs: 0,
        reviewDurationMs: 0,
        totalDurationMs: 1000,
  
        startedAt:
          "2026-10-16T00:00:00.000Z",
        completedAt:
          "2026-10-16T00:00:01.000Z",
      });
    });
  
    it("records a successful first-pass run", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-002",
          taskId: "TH-002",
          strategy: "lightweight",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      collector.recordSuccess();
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:01.000Z",
        );
  
      expect(metrics.success).toBe(
        true,
      );
  
      expect(
        metrics.firstPassSuccess,
      ).toBe(true);
    });
  
    it("does not mark a repaired run as first-pass success", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-003",
          taskId: "TH-003",
          strategy: "parallel",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      collector.recordValidationFailure();
      collector.recordRepairAttempt();
      collector.recordSuccess();
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:02.000Z",
        );
  
      expect(metrics.success).toBe(
        true,
      );
  
      expect(
        metrics.firstPassSuccess,
      ).toBe(false);
  
      expect(
        metrics.validationFailures,
      ).toBe(1);
  
      expect(
        metrics.repairAttempts,
      ).toBe(1);
    });
  
    it("accumulates validation failures, repairs, human interventions, and review findings", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-004",
          taskId: "TH-004",
          strategy: "parallel",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      collector.recordValidationFailure();
      collector.recordValidationFailure();
  
      collector.recordRepairAttempt();
  
      collector.recordHumanIntervention();
      collector.recordHumanIntervention();
  
      collector.recordReviewFindings(2);
      collector.recordReviewFindings(3);
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:03.000Z",
        );
  
      expect(
        metrics.validationFailures,
      ).toBe(2);
  
      expect(
        metrics.repairAttempts,
      ).toBe(1);
  
      expect(
        metrics.humanInterventions,
      ).toBe(2);
  
      expect(
        metrics.reviewFindings,
      ).toBe(5);
    });
  
    it("accumulates token usage and estimated cost", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-005",
          taskId: "TH-005",
          strategy: "sequential",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      collector.recordTokenUsage({
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0.01,
      });
  
      collector.recordTokenUsage({
        inputTokens: 200,
        outputTokens: 75,
        estimatedCostUsd: 0.02,
      });
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:01.000Z",
        );
  
      expect(
        metrics.inputTokens,
      ).toBe(300);
  
      expect(
        metrics.outputTokens,
      ).toBe(125);
  
      expect(
        metrics.estimatedCostUsd,
      ).toBeCloseTo(0.03);
    });
  
    it("accumulates stage durations", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-006",
          taskId: "TH-006",
          strategy: "parallel",
          startedAt:
            "2026-10-16T00:00:00.000Z",
        });
  
      collector.recordStageDuration(
        "planning",
        100,
      );
  
      collector.recordStageDuration(
        "implementation",
        200,
      );
  
      collector.recordStageDuration(
        "implementation",
        50,
      );
  
      collector.recordStageDuration(
        "validation",
        75,
      );
  
      collector.recordStageDuration(
        "review",
        25,
      );
  
      const metrics =
        collector.complete(
          "2026-10-16T00:00:01.000Z",
        );
  
      expect(
        metrics.planningDurationMs,
      ).toBe(100);
  
      expect(
        metrics.implementationDurationMs,
      ).toBe(250);
  
      expect(
        metrics.validationDurationMs,
      ).toBe(75);
  
      expect(
        metrics.reviewDurationMs,
      ).toBe(25);
  
      expect(
        metrics.totalDurationMs,
      ).toBe(1000);
    });
  
    it("rejects invalid counter values", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-007",
          taskId: "TH-007",
          strategy: "parallel",
        });
  
      expect(() =>
        collector.recordReviewFindings(
          -1,
        ),
      ).toThrow(
        "Review finding count must be a nonnegative integer.",
      );
  
      expect(() =>
        collector.recordReviewFindings(
          1.5,
        ),
      ).toThrow(
        "Review finding count must be a nonnegative integer.",
      );
    });
  
    it("rejects invalid token and cost measurements", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-008",
          taskId: "TH-008",
          strategy: "sequential",
        });
  
      expect(() =>
        collector.recordTokenUsage({
          inputTokens: -1,
          outputTokens: 0,
          estimatedCostUsd: 0,
        }),
      ).toThrow();
  
      expect(() =>
        collector.recordTokenUsage({
          inputTokens: 0,
          outputTokens: 1.5,
          estimatedCostUsd: 0,
        }),
      ).toThrow();
  
      expect(() =>
        collector.recordTokenUsage({
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: -0.01,
        }),
      ).toThrow();
    });
  
    it("rejects invalid stage durations", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-009",
          taskId: "TH-009",
          strategy: "lightweight",
        });
  
      expect(() =>
        collector.recordStageDuration(
          "validation",
          -1,
        ),
      ).toThrow(
        "Stage duration must be a nonnegative integer.",
      );
  
      expect(() =>
        collector.recordStageDuration(
          "validation",
          1.5,
        ),
      ).toThrow(
        "Stage duration must be a nonnegative integer.",
      );
    });
  
    it("rejects completion before the run started", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-010",
          taskId: "TH-010",
          strategy: "parallel",
          startedAt:
            "2026-10-16T00:00:10.000Z",
        });
  
      expect(() =>
        collector.complete(
          "2026-10-16T00:00:09.000Z",
        ),
      ).toThrow(
        "Run completion cannot occur before the run started.",
      );
    });
  
    it("rejects invalid timestamps", () => {
      const collector =
        new MetricsCollector({
          runId: "RUN-011",
          taskId: "TH-011",
          strategy: "parallel",
          startedAt:
            "not-a-timestamp",
        });
  
      expect(() =>
        collector.complete(
          "2026-10-16T00:00:01.000Z",
        ),
      ).toThrow(
        "Run timestamps must be valid ISO date strings.",
      );
    });
  });