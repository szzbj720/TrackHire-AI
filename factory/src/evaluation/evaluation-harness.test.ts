import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import {
    EvaluationHarness,
  } from "./evaluation-harness.js";
  
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
  
  describe("EvaluationHarness", () => {
    it("evaluates an empty benchmark", () => {
      const harness =
        new EvaluationHarness();
  
      const result =
        harness.evaluate([]);
  
      expect(result.runs).toEqual([]);
  
      expect(
        result.comparison.overall
          .totalRuns,
      ).toBe(0);
  
      expect(
        result.comparison.strategies,
      ).toHaveLength(3);
    });
  
    it("validates and preserves benchmark runs", () => {
      const harness =
        new EvaluationHarness();
  
      const runs = [
        createRun({
          runId: "RUN-001",
          strategy: "lightweight",
        }),
  
        createRun({
          runId: "RUN-002",
          strategy: "sequential",
        }),
  
        createRun({
          runId: "RUN-003",
          strategy: "parallel",
        }),
      ];
  
      const result =
        harness.evaluate(runs);
  
      expect(result.runs).toEqual(
        runs,
      );
  
      expect(
        result.comparison.overall
          .totalRuns,
      ).toBe(3);
    });
  
    it("produces separate strategy summaries", () => {
      const harness =
        new EvaluationHarness();
  
      const result =
        harness.evaluate([
          createRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
            success: true,
          }),
  
          createRun({
            runId: "SEQ-001",
            strategy: "sequential",
            success: false,
            firstPassSuccess: false,
          }),
  
          createRun({
            runId: "PAR-001",
            strategy: "parallel",
            success: true,
          }),
        ]);
  
      const lightweight =
        result.comparison.strategies.find(
          (entry) =>
            entry.strategy ===
            "lightweight",
        )!;
  
      const sequential =
        result.comparison.strategies.find(
          (entry) =>
            entry.strategy ===
            "sequential",
        )!;
  
      const parallel =
        result.comparison.strategies.find(
          (entry) =>
            entry.strategy ===
            "parallel",
        )!;
  
      expect(
        lightweight.summary.successRate,
      ).toBe(1);
  
      expect(
        sequential.summary.successRate,
      ).toBe(0);
  
      expect(
        parallel.summary.successRate,
      ).toBe(1);
    });
  
    it("aggregates reliability, cost, and latency", () => {
      const harness =
        new EvaluationHarness();
  
      const result =
        harness.evaluate([
          createRun({
            runId: "RUN-001",
            validationFailures: 0,
            repairAttempts: 0,
            humanInterventions: 0,
            estimatedCostUsd: 0.01,
            totalDurationMs: 100,
          }),
  
          createRun({
            runId: "RUN-002",
            validationFailures: 2,
            repairAttempts: 1,
            humanInterventions: 1,
            estimatedCostUsd: 0.03,
            totalDurationMs: 300,
          }),
        ]);
  
      const overall =
        result.comparison.overall;
  
      expect(
        overall
          .averageValidationFailures,
      ).toBe(1);
  
      expect(
        overall.averageRepairAttempts,
      ).toBe(0.5);
  
      expect(
        overall
          .averageHumanInterventions,
      ).toBe(0.5);
  
      expect(
        overall
          .averageEstimatedCostUsd,
      ).toBeCloseTo(0.02);
  
      expect(
        overall.averageTotalDurationMs,
      ).toBe(200);
    });
  
    it("rejects malformed run metrics", () => {
      const harness =
        new EvaluationHarness();
  
      const invalidRun = {
        ...createRun(),
        validationFailures: -1,
      };
  
      expect(() =>
        harness.evaluate([
          invalidRun,
        ]),
      ).toThrow();
    });
  
    it("rejects duplicate run IDs", () => {
      const harness =
        new EvaluationHarness();
  
      expect(() =>
        harness.evaluate([
          createRun({
            runId: "RUN-SAME",
            strategy: "sequential",
          }),
  
          createRun({
            runId: "RUN-SAME",
            strategy: "parallel",
          }),
        ]),
      ).toThrow(
        "Duplicate evaluation run ID: RUN-SAME",
      );
    });
  
    it("allows repeated task IDs across different runs", () => {
      const harness =
        new EvaluationHarness();
  
      const result =
        harness.evaluate([
          createRun({
            runId: "RUN-001",
            taskId: "TH-001",
            strategy: "lightweight",
          }),
  
          createRun({
            runId: "RUN-002",
            taskId: "TH-001",
            strategy: "sequential",
          }),
  
          createRun({
            runId: "RUN-003",
            taskId: "TH-001",
            strategy: "parallel",
          }),
        ]);
  
      expect(
        result.comparison.overall
          .totalRuns,
      ).toBe(3);
  
      expect(
        new Set(
          result.runs.map(
            (run) => run.taskId,
          ),
        ),
      ).toEqual(
        new Set(["TH-001"]),
      );
    });
  });