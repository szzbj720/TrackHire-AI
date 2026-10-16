import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    evaluateRuns,
  } from "./run-evaluator.js";
  
  function createRun(
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
  
  describe("evaluateRuns", () => {
    it("returns zeroed summary for no runs", () => {
      expect(
        evaluateRuns([]),
      ).toEqual({
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
  
        successRate: 0,
        firstPassSuccessRate: 0,
  
        averageValidationFailures: 0,
        averageRepairAttempts: 0,
        averageHumanInterventions: 0,
        averageReviewFindings: 0,
  
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageEstimatedCostUsd: 0,
  
        averagePlanningDurationMs: 0,
        averageImplementationDurationMs: 0,
        averageValidationDurationMs: 0,
        averageReviewDurationMs: 0,
        averageTotalDurationMs: 0,
      });
    });
  
    it("summarizes a single successful run", () => {
      const summary =
        evaluateRuns([
          createRun(),
        ]);
  
      expect(
        summary.totalRuns,
      ).toBe(1);
  
      expect(
        summary.successfulRuns,
      ).toBe(1);
  
      expect(
        summary.failedRuns,
      ).toBe(0);
  
      expect(
        summary.successRate,
      ).toBe(1);
  
      expect(
        summary.firstPassSuccessRate,
      ).toBe(1);
  
      expect(
        summary.averageEstimatedCostUsd,
      ).toBe(0.01);
  
      expect(
        summary.averageTotalDurationMs,
      ).toBe(375);
    });
  
    it("calculates success and first-pass success rates independently", () => {
      const summary =
        evaluateRuns([
          createRun({
            runId: "RUN-001",
            success: true,
            firstPassSuccess: true,
          }),
  
          createRun({
            runId: "RUN-002",
            success: true,
            firstPassSuccess: false,
            validationFailures: 1,
            repairAttempts: 1,
          }),
  
          createRun({
            runId: "RUN-003",
            success: false,
            firstPassSuccess: false,
          }),
  
          createRun({
            runId: "RUN-004",
            success: false,
            firstPassSuccess: false,
          }),
        ]);
  
      expect(
        summary.successRate,
      ).toBe(0.5);
  
      expect(
        summary.firstPassSuccessRate,
      ).toBe(0.25);
  
      expect(
        summary.successfulRuns,
      ).toBe(2);
  
      expect(
        summary.failedRuns,
      ).toBe(2);
    });
  
    it("calculates average reliability metrics", () => {
      const summary =
        evaluateRuns([
          createRun({
            validationFailures: 0,
            repairAttempts: 0,
            humanInterventions: 0,
            reviewFindings: 1,
          }),
  
          createRun({
            validationFailures: 2,
            repairAttempts: 2,
            humanInterventions: 1,
            reviewFindings: 3,
          }),
        ]);
  
      expect(
        summary.averageValidationFailures,
      ).toBe(1);
  
      expect(
        summary.averageRepairAttempts,
      ).toBe(1);
  
      expect(
        summary.averageHumanInterventions,
      ).toBe(0.5);
  
      expect(
        summary.averageReviewFindings,
      ).toBe(2);
    });
  
    it("calculates average token usage and cost", () => {
      const summary =
        evaluateRuns([
          createRun({
            inputTokens: 100,
            outputTokens: 50,
            estimatedCostUsd: 0.01,
          }),
  
          createRun({
            inputTokens: 300,
            outputTokens: 150,
            estimatedCostUsd: 0.03,
          }),
        ]);
  
      expect(
        summary.averageInputTokens,
      ).toBe(200);
  
      expect(
        summary.averageOutputTokens,
      ).toBe(100);
  
      expect(
        summary.averageEstimatedCostUsd,
      ).toBeCloseTo(0.02);
    });
  
    it("calculates average stage and total durations", () => {
      const summary =
        evaluateRuns([
          createRun({
            planningDurationMs: 100,
            implementationDurationMs: 200,
            validationDurationMs: 50,
            reviewDurationMs: 25,
            totalDurationMs: 375,
          }),
  
          createRun({
            planningDurationMs: 300,
            implementationDurationMs: 400,
            validationDurationMs: 150,
            reviewDurationMs: 75,
            totalDurationMs: 925,
          }),
        ]);
  
      expect(
        summary.averagePlanningDurationMs,
      ).toBe(200);
  
      expect(
        summary.averageImplementationDurationMs,
      ).toBe(300);
  
      expect(
        summary.averageValidationDurationMs,
      ).toBe(100);
  
      expect(
        summary.averageReviewDurationMs,
      ).toBe(50);
  
      expect(
        summary.averageTotalDurationMs,
      ).toBe(650);
    });
  
    it("can summarize runs from different strategies together", () => {
      const summary =
        evaluateRuns([
          createRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
          }),
  
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
          }),
        ]);
  
      expect(
        summary.totalRuns,
      ).toBe(3);
  
      expect(
        summary.successRate,
      ).toBe(1);
    });
  });