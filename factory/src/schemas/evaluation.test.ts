import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    factoryRunMetricsSchema,
    type FactoryRunMetrics,
  } from "./evaluation.js";
  
  function createMetrics(): FactoryRunMetrics {
    return {
      runId: "RUN-001",
      taskId: "TH-001",
  
      strategy: "parallel",
  
      success: true,
      firstPassSuccess: false,
  
      validationFailures: 1,
      repairAttempts: 1,
      humanInterventions: 1,
      reviewFindings: 0,
  
      inputTokens: 1200,
      outputTokens: 600,
      estimatedCostUsd: 0.03,
  
      planningDurationMs: 100,
      implementationDurationMs: 500,
      validationDurationMs: 200,
      reviewDurationMs: 100,
      totalDurationMs: 900,
  
      startedAt:
        "2026-10-16T00:00:00.000Z",
      completedAt:
        "2026-10-16T00:00:00.900Z",
    };
  }
  
  describe("factoryRunMetricsSchema", () => {
    it("accepts valid factory run metrics", () => {
      const metrics =
        createMetrics();
  
      const result =
        factoryRunMetricsSchema.parse(
          metrics,
        );
  
      expect(result).toEqual(
        metrics,
      );
    });
  
    it("supports every factory execution strategy", () => {
      for (const strategy of [
        "lightweight",
        "sequential",
        "parallel",
      ] as const) {
        const result =
          factoryRunMetricsSchema.parse({
            ...createMetrics(),
            strategy,
          });
  
        expect(
          result.strategy,
        ).toBe(strategy);
      }
    });
  
    it("rejects an unsupported execution strategy", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          strategy: "unknown",
        }),
      ).toThrow();
    });
  
    it("rejects negative counters", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          repairAttempts: -1,
        }),
      ).toThrow();
    });
  
    it("rejects negative token usage", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          inputTokens: -1,
        }),
      ).toThrow();
    });
  
    it("rejects negative estimated cost", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          estimatedCostUsd: -0.01,
        }),
      ).toThrow();
    });
  
    it("rejects negative durations", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          totalDurationMs: -1,
        }),
      ).toThrow();
    });
  
    it("requires run and task identifiers", () => {
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          runId: "",
        }),
      ).toThrow();
  
      expect(() =>
        factoryRunMetricsSchema.parse({
          ...createMetrics(),
          taskId: "",
        }),
      ).toThrow();
    });
  });