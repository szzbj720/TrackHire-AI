import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    LightweightWorkflowResult,
  } from "../orchestrator/lightweight-workflow.js";
  import type {
    ParallelValidationResult,
  } from "../orchestrator/parallel-validation-workflow.js";
  import type {
    SequentialFactoryRun,
  } from "../orchestrator/sequential-factory.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import {
    EvaluationHarness,
  } from "./evaluation-harness.js";
  import {
    createLightweightRunMetrics,
  } from "./lightweight-run-metrics.js";
  import {
    createParallelRunMetrics,
  } from "./parallel-run-metrics.js";
  import {
    createSequentialRunMetrics,
  } from "./sequential-run-metrics.js";
  
  function createTask(
    id: string,
    status: EngineeringTask["status"],
  ): EngineeringTask {
    return {
      id,
      request: "Add an optional interview date.",
      status,
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
  
  function createValidation(
    durationMs: number,
  ) {
    return {
      passed: true,
  
      checks: [
        {
          name: "test",
          command: "npm",
          args: ["test"],
          exitCode: 0,
          stdout: "",
          stderr: "",
          durationMs,
          passed: true,
        },
      ],
  
      failedChecks: [],
      durationMs,
    };
  }
  
  function createImplementation() {
    return {
      summary: "Implemented task.",
      changedFiles: [],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createLightweightRun():
    LightweightWorkflowResult {
    return {
      task: createTask(
        "TH-LIGHT",
        "AWAITING_FINAL_APPROVAL",
      ),
  
      worktree: {
        path: "/tmp/lightweight",
        branch: "factory/th-light",
      },
  
      implementation:
        createImplementation(),
  
      validation: createValidation(50),
    };
  }
  
  function createParallelRun():
    ParallelValidationResult {
    const task = createTask(
      "TH-PARALLEL",
      "AWAITING_FINAL_APPROVAL",
    );
  
    return {
      task,
  
      implementation:
        createImplementation(),
  
      validation: createValidation(100),
  
      review: {
        task,
  
        review: {
          approved: true,
          summary: "Approved.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.95,
        },
  
        changeEvidence: {
          approvedFiles: [],
          reportedFiles: [],
          observedFiles: [],
          unreportedFiles: [],
          missingReportedFiles: [],
          unapprovedFiles: [],
          withinApprovedScope: true,
          reportMatchesObserved: true,
          patch: "",
        },
      },
    };
  }
  
  function createSequentialRun():
    SequentialFactoryRun {
    return {
      task: createTask(
        "TH-SEQUENTIAL",
        "COMPLETE",
      ),
  
      repairs: [],
    };
  }
  
  describe(
    "cross-strategy evaluation lifecycle",
    () => {
      it("compares metrics derived from all three execution strategies", () => {
        const lightweightMetrics =
          createLightweightRunMetrics({
            runId: "RUN-LIGHT",
  
            run: createLightweightRun(),
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        const sequentialMetrics =
          createSequentialRunMetrics({
            runId: "RUN-SEQUENTIAL",
  
            run: createSequentialRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:02.000Z",
          });
  
        const parallelMetrics =
          createParallelRunMetrics({
            runId: "RUN-PARALLEL",
  
            run: createParallelRun(),
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:03.000Z",
          });
  
        const result =
          new EvaluationHarness().evaluate([
            lightweightMetrics,
            sequentialMetrics,
            parallelMetrics,
          ]);
  
        const lightweight =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "lightweight",
          );
  
        const sequential =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "sequential",
          );
  
        const parallel =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "parallel",
          );
  
        expect(result.runs).toHaveLength(3);
  
        expect(
          result.comparison.overall.totalRuns,
        ).toBe(3);
  
        expect(
          result.comparison.overall.successfulRuns,
        ).toBe(3);
  
        expect(
          result.comparison.overall.successRate,
        ).toBe(1);
  
        expect(lightweight).toBeDefined();
        expect(sequential).toBeDefined();
        expect(parallel).toBeDefined();
  
        expect(
          lightweight?.summary.totalRuns,
        ).toBe(1);
  
        expect(
          sequential?.summary.totalRuns,
        ).toBe(1);
  
        expect(
          parallel?.summary.totalRuns,
        ).toBe(1);
      });
  
      it("preserves each strategy's measured duration", () => {
        const result =
          new EvaluationHarness().evaluate([
            createLightweightRunMetrics({
              runId: "RUN-LIGHT",
  
              run: createLightweightRun(),
  
              startedAt:
                "2026-10-16T00:00:00.000Z",
  
              completedAt:
                "2026-10-16T00:00:01.000Z",
            }),
  
            createSequentialRunMetrics({
              runId: "RUN-SEQUENTIAL",
  
              run: createSequentialRun(),
  
              stopReason: "COMPLETE",
  
              startedAt:
                "2026-10-16T00:00:00.000Z",
  
              completedAt:
                "2026-10-16T00:00:02.000Z",
            }),
  
            createParallelRunMetrics({
              runId: "RUN-PARALLEL",
  
              run: createParallelRun(),
  
              startedAt:
                "2026-10-16T00:00:00.000Z",
  
              completedAt:
                "2026-10-16T00:00:03.000Z",
            }),
          ]);
  
        const lightweight =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "lightweight",
          );
  
        const sequential =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "sequential",
          );
  
        const parallel =
          result.comparison.strategies.find(
            (strategy) =>
              strategy.strategy ===
              "parallel",
          );
  
        expect(
          lightweight?.summary
            .averageTotalDurationMs,
        ).toBe(1000);
  
        expect(
          sequential?.summary
            .averageTotalDurationMs,
        ).toBe(2000);
  
        expect(
          parallel?.summary
            .averageTotalDurationMs,
        ).toBe(3000);
      });
    },
  );