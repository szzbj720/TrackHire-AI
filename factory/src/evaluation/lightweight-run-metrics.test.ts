import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    LightweightWorkflowResult,
  } from "../orchestrator/lightweight-workflow.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import {
    createLightweightRunMetrics,
  } from "./lightweight-run-metrics.js";
  
  function createTask(
    status: EngineeringTask["status"],
  ): EngineeringTask {
    return {
      id: "TH-001",
      request: "Test task",
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
  
  function createRun(
    overrides: Partial<LightweightWorkflowResult> = {},
  ): LightweightWorkflowResult {
    return {
      task: createTask(
        "AWAITING_FINAL_APPROVAL",
      ),
  
      worktree: {
        path: "/tmp/worktree",
        branch: "factory/TH-001",
      },
  
      implementation: {
        summary: "Implemented task.",
        changedFiles: [],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      },
  
      validation: {
        passed: true,
  
        checks: [
          {
            name: "test",
            command: "npm",
            args: ["test"],
            exitCode: 0,
            stdout: "",
            stderr: "",
            durationMs: 50,
            passed: true,
          },
        ],
  
        failedChecks: [],
        durationMs: 50,
      },
  
      ...overrides,
    };
  }
  
  describe(
    "createLightweightRunMetrics",
    () => {
      it("derives successful lightweight metrics", () => {
        const metrics =
          createLightweightRunMetrics({
            runId: "LIGHT-001",
            run: createRun(),
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.strategy).toBe(
          "lightweight",
        );
  
        expect(metrics.success).toBe(
          true,
        );
  
        expect(
          metrics.firstPassSuccess,
        ).toBe(true);
  
        expect(
          metrics.validationFailures,
        ).toBe(0);
  
        expect(
          metrics.repairAttempts,
        ).toBe(0);
  
        expect(
          metrics.validationDurationMs,
        ).toBe(50);
  
        expect(
          metrics.totalDurationMs,
        ).toBe(1000);
      });
  
      it("records failed validation and human escalation", () => {
        const run = createRun({
          task: createTask(
            "NEEDS_HUMAN",
          ),
  
          validation: {
            passed: false,
  
            checks: [
              {
                name: "test",
                command: "npm",
                args: ["test"],
                exitCode: 1,
                stdout: "",
                stderr: "Failed.",
                durationMs: 75,
                passed: false,
              },
            ],
  
            failedChecks: ["test"],
            durationMs: 75,
          },
        });
  
        const metrics =
          createLightweightRunMetrics({
            runId: "LIGHT-002",
            run,
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.success).toBe(
          false,
        );
  
        expect(
          metrics.validationFailures,
        ).toBe(1);
  
        expect(
          metrics.humanInterventions,
        ).toBe(1);
  
        expect(
          metrics.firstPassSuccess,
        ).toBe(false);
  
        expect(
          metrics.validationDurationMs,
        ).toBe(75);
      });
  
      it("records implementation human escalation without inventing a validation failure", () => {
        const baseRun = createRun();
  
        const run: LightweightWorkflowResult = {
          task: createTask(
            "NEEDS_HUMAN",
          ),
  
          worktree: baseRun.worktree,
  
          implementation: {
            summary:
              "Implementation needs input.",
            changedFiles: [],
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: true,
          },
        };
  
        const metrics =
          createLightweightRunMetrics({
            runId: "LIGHT-003",
            run,
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.success).toBe(
          false,
        );
  
        expect(
          metrics.validationFailures,
        ).toBe(0);
  
        expect(
          metrics.humanInterventions,
        ).toBe(1);
  
        expect(
          metrics.validationDurationMs,
        ).toBe(0);
      });
  
      it("rejects invalid timestamps", () => {
        expect(() =>
          createLightweightRunMetrics({
            runId: "LIGHT-004",
            run: createRun(),
  
            startedAt: "invalid",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          }),
        ).toThrow(
          "Run timestamps must be valid ISO date strings.",
        );
      });
  
      it("rejects completion before start", () => {
        expect(() =>
          createLightweightRunMetrics({
            runId: "LIGHT-005",
            run: createRun(),
  
            startedAt:
              "2026-10-16T00:00:02.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          }),
        ).toThrow(
          "Run completion cannot occur before the run started.",
        );
      });
    },
  );