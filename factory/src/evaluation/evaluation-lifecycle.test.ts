import {
    mkdtemp,
    rm,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    RunArtifactStore,
  } from "../artifact/run-artifact-store.js";
  import type {
    SequentialFactoryRun,
  } from "../orchestrator/sequential-factory.js";
  import type {
    FactoryRunMetrics,
  } from "../schemas/evaluation.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import {
    EvaluationArtifactStore,
  } from "./evaluation-artifact-store.js";
  import {
    EvaluationPipeline,
  } from "./evaluation-pipeline.js";
  import {
    createSequentialRunMetrics,
  } from "./sequential-run-metrics.js";
  
  function createTask(): EngineeringTask {
    return {
      id: "TH-001",
      request:
        "Add an optional interview date.",
      status: "COMPLETE",
      requirements: [],
      acceptanceCriteria: [],
      constraints: [],
      repairAttempts: 0,
      createdAt:
        "2026-10-16T00:00:00.000Z",
      updatedAt:
        "2026-10-16T00:00:01.000Z",
    };
  }
  
  function createSequentialRun():
    SequentialFactoryRun {
    return {
      task: createTask(),
      repairs: [],
  
      review: {
        approved: true,
        summary:
          "Implementation is approved.",
        findings: [],
        requirementCoverage: [],
        requiresHumanInput: false,
        confidence: 0.95,
      },
    };
  }
  
  function createBenchmarkRun(
    overrides: Partial<FactoryRunMetrics>,
  ): FactoryRunMetrics {
    return {
      runId: "BENCH-001",
      taskId: "TH-001",
  
      strategy: "lightweight",
  
      success: true,
      firstPassSuccess: true,
  
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
      totalDurationMs: 500,
  
      startedAt:
        "2026-10-16T00:00:00.000Z",
      completedAt:
        "2026-10-16T00:00:00.500Z",
  
      ...overrides,
    };
  }
  
  describe(
    "evaluation lifecycle",
    () => {
      const temporaryDirectories:
        string[] = [];
  
      afterEach(async () => {
        await Promise.all(
          temporaryDirectories.splice(0).map(
            (directory) =>
              rm(directory, {
                recursive: true,
                force: true,
              }),
          ),
        );
      });
  
      it("derives, persists, and evaluates real sequential run evidence", async () => {
        const factoryRoot =
          await mkdtemp(
            join(
              tmpdir(),
              "factory-evaluation-",
            ),
          );
  
        temporaryDirectories.push(
          factoryRoot,
        );
  
        const runArtifactStore =
          new RunArtifactStore(
            factoryRoot,
          );
  
        const evaluationArtifactStore =
          new EvaluationArtifactStore(
            runArtifactStore,
          );
  
        const pipeline =
          new EvaluationPipeline(
            evaluationArtifactStore,
          );
  
        const metrics =
          createSequentialRunMetrics({
            runId: "SEQ-001",
  
            run: createSequentialRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        const benchmarkRuns = [
          createBenchmarkRun({
            runId: "LIGHT-001",
            strategy: "lightweight",
            totalDurationMs: 500,
          }),
  
          createBenchmarkRun({
            runId: "PAR-001",
            strategy: "parallel",
            totalDurationMs: 1500,
          }),
        ];
  
        const result =
          await pipeline.process(
            metrics,
            benchmarkRuns,
          );
  
        const persisted =
          await runArtifactStore
            .readJson<FactoryRunMetrics>(
              "SEQ-001",
              "metrics",
            );
  
        expect(persisted).toEqual(
          metrics,
        );
  
        expect(
          persisted.strategy,
        ).toBe("sequential");
  
        expect(
          persisted.success,
        ).toBe(true);
  
        expect(
          persisted.firstPassSuccess,
        ).toBe(true);
  
        expect(
          result.evaluation
            .comparison.overall.totalRuns,
        ).toBe(3);
  
        expect(
          result.evaluation
            .comparison.strategies.map(
              (entry) => ({
                strategy:
                  entry.strategy,
                totalRuns:
                  entry.summary.totalRuns,
              }),
            ),
        ).toEqual([
          {
            strategy: "lightweight",
            totalRuns: 1,
          },
          {
            strategy: "sequential",
            totalRuns: 1,
          },
          {
            strategy: "parallel",
            totalRuns: 1,
          },
        ]);
      });
  
      it("persists metrics in the expected run artifact location", async () => {
        const factoryRoot =
          await mkdtemp(
            join(
              tmpdir(),
              "factory-evaluation-",
            ),
          );
  
        temporaryDirectories.push(
          factoryRoot,
        );
  
        const runArtifactStore =
          new RunArtifactStore(
            factoryRoot,
          );
  
        const evaluationArtifactStore =
          new EvaluationArtifactStore(
            runArtifactStore,
          );
  
        const pipeline =
          new EvaluationPipeline(
            evaluationArtifactStore,
          );
  
        const metrics =
          createSequentialRunMetrics({
            runId: "SEQ-PERSIST",
  
            run: createSequentialRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        await pipeline.process(metrics);
  
        const persisted =
          await runArtifactStore
            .readJson<FactoryRunMetrics>(
              "SEQ-PERSIST",
              "metrics",
            );
  
        expect(persisted.runId).toBe(
          "SEQ-PERSIST",
        );
  
        expect(persisted.taskId).toBe(
          "TH-001",
        );
  
        expect(
          persisted.totalDurationMs,
        ).toBe(1000);
      });
    },
  );