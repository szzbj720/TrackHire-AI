import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import type {
    EvaluationArtifactStore,
  } from "./evaluation-artifact-store.js";
  import {
    EvaluationPipeline,
  } from "./evaluation-pipeline.js";
  
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
  
  function createArtifactStore(): {
    artifactStore: EvaluationArtifactStore;
    writeRunMetrics: ReturnType<
      typeof vi.fn
    >;
  } {
    const writeRunMetrics = vi.fn(
      async () => undefined,
    );
  
    const artifactStore = {
      writeRunMetrics,
    } as unknown as EvaluationArtifactStore;
  
    return {
      artifactStore,
      writeRunMetrics,
    };
  }
  
  describe("EvaluationPipeline", () => {
    it("persists the current run metrics", async () => {
      const {
        artifactStore,
        writeRunMetrics,
      } = createArtifactStore();
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      const metrics = createMetrics();
  
      await pipeline.process(metrics);
  
      expect(
        writeRunMetrics,
      ).toHaveBeenCalledTimes(1);
  
      expect(
        writeRunMetrics,
      ).toHaveBeenCalledWith(
        metrics,
      );
    });
  
    it("evaluates the current run", async () => {
      const {
        artifactStore,
      } = createArtifactStore();
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      const result =
        await pipeline.process(
          createMetrics(),
        );
  
      expect(
        result.evaluation
          .comparison.overall.totalRuns,
      ).toBe(1);
  
      expect(
        result.evaluation
          .comparison.overall
          .successfulRuns,
      ).toBe(1);
    });
  
    it("combines benchmark runs with the current run", async () => {
      const {
        artifactStore,
      } = createArtifactStore();
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      const benchmarkRuns = [
        createMetrics({
          runId: "LIGHT-001",
          strategy: "lightweight",
        }),
  
        createMetrics({
          runId: "PAR-001",
          strategy: "parallel",
        }),
      ];
  
      const current =
        createMetrics({
          runId: "SEQ-001",
          strategy: "sequential",
        });
  
      const result =
        await pipeline.process(
          current,
          benchmarkRuns,
        );
  
      expect(
        result.evaluation
          .comparison.overall.totalRuns,
      ).toBe(3);
  
      expect(
        result.evaluation.runs.map(
          (run) => run.strategy,
        ),
      ).toEqual([
        "lightweight",
        "parallel",
        "sequential",
      ]);
    });
  
    it("produces per-strategy comparison data", async () => {
      const {
        artifactStore,
      } = createArtifactStore();
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      const result =
        await pipeline.process(
          createMetrics({
            runId: "SEQ-001",
            strategy: "sequential",
            success: false,
            firstPassSuccess: false,
          }),
          [
            createMetrics({
              runId: "LIGHT-001",
              strategy: "lightweight",
              success: true,
            }),
  
            createMetrics({
              runId: "PAR-001",
              strategy: "parallel",
              success: true,
            }),
          ],
        );
  
      const sequential =
        result.evaluation
          .comparison.strategies.find(
            (entry) =>
              entry.strategy ===
              "sequential",
          )!;
  
      expect(
        sequential.summary.totalRuns,
      ).toBe(1);
  
      expect(
        sequential.summary.successRate,
      ).toBe(0);
    });
  
    it("does not evaluate when persistence fails", async () => {
      const writeRunMetrics = vi.fn(
        async () => {
          throw new Error(
            "Persistence failed.",
          );
        },
      );
  
      const artifactStore = {
        writeRunMetrics,
      } as unknown as EvaluationArtifactStore;
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      await expect(
        pipeline.process(
          createMetrics(),
        ),
      ).rejects.toThrow(
        "Persistence failed.",
      );
    });
  
    it("rejects duplicate benchmark run IDs", async () => {
      const {
        artifactStore,
      } = createArtifactStore();
  
      const pipeline =
        new EvaluationPipeline(
          artifactStore,
        );
  
      await expect(
        pipeline.process(
          createMetrics({
            runId: "RUN-SAME",
          }),
          [
            createMetrics({
              runId: "RUN-SAME",
            }),
          ],
        ),
      ).rejects.toThrow(
        "Duplicate evaluation run ID: RUN-SAME",
      );
    });
  });