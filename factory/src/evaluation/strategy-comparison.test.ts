import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    compareStrategies,
  } from "./strategy-comparison.js";
  
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
  
  describe("compareStrategies", () => {
    it("returns all three strategies", () => {
      const comparison =
        compareStrategies([]);
  
      expect(
        comparison.strategies.map(
          (result) => result.strategy,
        ),
      ).toEqual([
        "lightweight",
        "sequential",
        "parallel",
      ]);
    });
  
    it("returns zeroed summaries when no runs exist", () => {
      const comparison =
        compareStrategies([]);
  
      expect(
        comparison.overall.totalRuns,
      ).toBe(0);
  
      for (
        const result of
        comparison.strategies
      ) {
        expect(
          result.summary.totalRuns,
        ).toBe(0);
  
        expect(
          result.summary.successRate,
        ).toBe(0);
      }
    });
  
    it("groups runs by execution strategy", () => {
      const comparison =
        compareStrategies([
          createRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
          }),
  
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
          }),
  
          createRun({
            runId: "SEQ-002",
            strategy: "sequential",
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
          }),
  
          createRun({
            runId: "PAR-002",
            strategy: "parallel",
          }),
  
          createRun({
            runId: "PAR-003",
            strategy: "parallel",
          }),
        ]);
  
      const lightweight =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "lightweight",
        );
  
      const sequential =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "sequential",
        );
  
      const parallel =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "parallel",
        );
  
      expect(
        lightweight?.summary.totalRuns,
      ).toBe(1);
  
      expect(
        sequential?.summary.totalRuns,
      ).toBe(2);
  
      expect(
        parallel?.summary.totalRuns,
      ).toBe(3);
  
      expect(
        comparison.overall.totalRuns,
      ).toBe(6);
    });
  
    it("calculates success rates independently for each strategy", () => {
      const comparison =
        compareStrategies([
          createRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
            success: true,
            firstPassSuccess: true,
          }),
  
          createRun({
            runId: "LIGHT-002",
            strategy: "lightweight",
            success: false,
            firstPassSuccess: false,
          }),
  
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
            success: true,
            firstPassSuccess: true,
          }),
  
          createRun({
            runId: "SEQ-002",
            strategy: "sequential",
            success: true,
            firstPassSuccess: false,
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
            success: true,
            firstPassSuccess: true,
          }),
        ]);
  
      const lightweight =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "lightweight",
        )!;
  
      const sequential =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "sequential",
        )!;
  
      const parallel =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "parallel",
        )!;
  
      expect(
        lightweight.summary.successRate,
      ).toBe(0.5);
  
      expect(
        sequential.summary.successRate,
      ).toBe(1);
  
      expect(
        sequential.summary
          .firstPassSuccessRate,
      ).toBe(0.5);
  
      expect(
        parallel.summary.successRate,
      ).toBe(1);
    });
  
    it("compares reliability metrics independently", () => {
      const comparison =
        compareStrategies([
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
            validationFailures: 0,
            repairAttempts: 0,
            humanInterventions: 0,
          }),
  
          createRun({
            runId: "SEQ-002",
            strategy: "sequential",
            validationFailures: 2,
            repairAttempts: 2,
            humanInterventions: 1,
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
            validationFailures: 3,
            repairAttempts: 1,
            humanInterventions: 2,
          }),
        ]);
  
      const sequential =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "sequential",
        )!;
  
      const parallel =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "parallel",
        )!;
  
      expect(
        sequential.summary
          .averageValidationFailures,
      ).toBe(1);
  
      expect(
        sequential.summary
          .averageRepairAttempts,
      ).toBe(1);
  
      expect(
        sequential.summary
          .averageHumanInterventions,
      ).toBe(0.5);
  
      expect(
        parallel.summary
          .averageValidationFailures,
      ).toBe(3);
  
      expect(
        parallel.summary
          .averageRepairAttempts,
      ).toBe(1);
  
      expect(
        parallel.summary
          .averageHumanInterventions,
      ).toBe(2);
    });
  
    it("compares cost and latency independently", () => {
      const comparison =
        compareStrategies([
          createRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
            estimatedCostUsd: 0.01,
            totalDurationMs: 100,
          }),
  
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
            estimatedCostUsd: 0.02,
            totalDurationMs: 200,
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
            estimatedCostUsd: 0.04,
            totalDurationMs: 150,
          }),
        ]);
  
      const lightweight =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "lightweight",
        )!;
  
      const sequential =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "sequential",
        )!;
  
      const parallel =
        comparison.strategies.find(
          (result) =>
            result.strategy ===
            "parallel",
        )!;
  
      expect(
        lightweight.summary
          .averageEstimatedCostUsd,
      ).toBe(0.01);
  
      expect(
        lightweight.summary
          .averageTotalDurationMs,
      ).toBe(100);
  
      expect(
        sequential.summary
          .averageEstimatedCostUsd,
      ).toBe(0.02);
  
      expect(
        sequential.summary
          .averageTotalDurationMs,
      ).toBe(200);
  
      expect(
        parallel.summary
          .averageEstimatedCostUsd,
      ).toBe(0.04);
  
      expect(
        parallel.summary
          .averageTotalDurationMs,
      ).toBe(150);
    });
  });