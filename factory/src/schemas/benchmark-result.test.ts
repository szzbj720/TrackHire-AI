import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    benchmarkResultSchema,
    type BenchmarkResult,
  } from "./benchmark-result.js";
  
  function createResult():
    BenchmarkResult {
    return {
      runId:
        "benchmark-run-001",
  
      scenarioId:
        "trackhire-interview-date",
  
      strategy:
        "sequential",
  
      baselineRevision:
        "abc123def456",
  
      workspacePath:
        "/tmp/trackhire-benchmark",
  
      workspaceBranch:
        "factory/benchmark-trackhire-interview-date-run-001-sequential",
  
      validation: {
        passed: true,
  
        commandsRun: [
          "flutter analyze",
          "flutter test",
        ],
  
        failedCommands: [],
      },
  
      acceptance: {
        passed: true,
  
        passedCriteria: 5,
        failedCriteria: 0,
        totalCriteria: 5,
  
        scores: [
          {
            criterionId:
              "optional-date",
  
            description:
              "A job application can exist without an interview date.",
  
            passed: true,
  
            evidence: [
              "Model tests passed.",
            ],
          },
        ],
  
        missingCriterionIds: [],
        unexpectedCriterionIds: [],
      },
  
      usage: {
        inputTokens: 1200,
        outputTokens: 800,
        estimatedCostUsd: 0.02,
      },
  
      durationMs: 4500,
  
      humanInterventions: 0,
  
      success: true,
  
      startedAt:
        "2026-10-16T20:00:00.000Z",
  
      completedAt:
        "2026-10-16T20:00:04.500Z",
    };
  }
  
  describe(
    "benchmarkResultSchema",
    () => {
      it("accepts a complete benchmark result", () => {
        const result =
          createResult();
  
        const parsed =
          benchmarkResultSchema.parse(
            result,
          );
  
        expect(parsed.runId).toBe(
          "benchmark-run-001",
        );
  
        expect(parsed.strategy).toBe(
          "sequential",
        );
  
        expect(parsed.success).toBe(
          true,
        );
      });
  
      it("supports exploration as a benchmark strategy", () => {
        const result =
          createResult();
  
        const parsed =
          benchmarkResultSchema.parse({
            ...result,
            strategy: "exploration",
          });
  
        expect(parsed.strategy).toBe(
          "exploration",
        );
      });
  
      it("rejects an unknown benchmark strategy", () => {
        const result =
          createResult();
  
        expect(() =>
          benchmarkResultSchema.parse({
            ...result,
            strategy: "magic-agent",
          }),
        ).toThrow();
      });
  
      it("rejects negative usage and timing metrics", () => {
        const result =
          createResult();
  
        expect(() =>
          benchmarkResultSchema.parse({
            ...result,
  
            durationMs: -1,
  
            usage: {
              ...result.usage,
              inputTokens: -1,
            },
          }),
        ).toThrow();
      });
  
      it("requires immutable baseline evidence", () => {
        const result =
          createResult();
  
        expect(() =>
          benchmarkResultSchema.parse({
            ...result,
            baselineRevision: "",
          }),
        ).toThrow();
      });
  
      it("requires workspace evidence", () => {
        const result =
          createResult();
  
        expect(() =>
          benchmarkResultSchema.parse({
            ...result,
            workspacePath: "",
          }),
        ).toThrow();
      });
    },
  );