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
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
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
  
  describe("EvaluationArtifactStore", () => {
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
  });