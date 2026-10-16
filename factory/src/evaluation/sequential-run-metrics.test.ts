import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    SequentialFactoryRun,
  } from "../orchestrator/sequential-factory.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import {
    createSequentialRunMetrics,
  } from "./sequential-run-metrics.js";
  
  function createTask(
    status: EngineeringTask["status"] =
      "COMPLETE",
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
    overrides: Partial<SequentialFactoryRun> = {},
  ): SequentialFactoryRun {
    return {
      task: createTask(),
      repairs: [],
      ...overrides,
    };
  }
  
  describe(
    "createSequentialRunMetrics",
    () => {
      it("creates metrics for a successful first-pass run", () => {
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-001",
  
            run: createRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.runId).toBe(
          "RUN-001",
        );
  
        expect(metrics.taskId).toBe(
          "TH-001",
        );
  
        expect(metrics.strategy).toBe(
          "sequential",
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
          metrics.totalDurationMs,
        ).toBe(1000);
      });
  
      it("counts repairs as evidence of preceding validation failures", () => {
        const run = createRun({
          repairs: [
            {
              summary: "Repair one",
              changedFiles: [],
              commandsRun: [],
              assumptions: [],
              warnings: [],
              requiresHumanInput: false,
            },
            {
              summary: "Repair two",
              changedFiles: [],
              commandsRun: [],
              assumptions: [],
              warnings: [],
              requiresHumanInput: false,
            },
          ],
        });
  
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-002",
            run,
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:02.000Z",
          });
  
        expect(
          metrics.repairAttempts,
        ).toBe(2);
  
        expect(
          metrics.validationFailures,
        ).toBe(2);
  
        expect(
          metrics.firstPassSuccess,
        ).toBe(false);
      });
  
      it("counts a final failed validation in addition to preceding repair failures", () => {
        const run = createRun({
          task: createTask(
            "NEEDS_HUMAN",
          ),
  
          repairs: [
            {
              summary: "Repair one",
              changedFiles: [],
              commandsRun: [],
              assumptions: [],
              warnings: [],
              requiresHumanInput: false,
            },
          ],
  
          validation: {
            passed: false,
  
            checks: [
              {
                name: "flutter test",
                command: "flutter",
                args: ["test"],
                exitCode: 1,
                stdout: "",
                stderr:
                  "Tests failed.",
                durationMs: 100,
                passed: false,
              },
            ],
  
            failedChecks: [
              "flutter test",
            ],
  
            durationMs: 100,
          },
        });
  
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-003",
            run,
  
            stopReason:
              "HUMAN_INPUT_REQUIRED",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:02.000Z",
          });
  
        expect(
          metrics.validationFailures,
        ).toBe(2);
  
        expect(
          metrics.repairAttempts,
        ).toBe(1);
  
        expect(
          metrics.humanInterventions,
        ).toBe(1);
  
        expect(metrics.success).toBe(
          false,
        );
      });
  
      it("counts review findings", () => {
        const run = createRun({
          review: {
            approved: false,
  
            summary:
              "Review found issues.",
  
            findings: [
              {
                severity: "MEDIUM",
                summary:
                  "Missing edge case",
                evidence: [
                  "No test covers the edge case.",
                ],
                files: [
                  "lib/example.dart",
                ],
                recommendation:
                  "Add a regression test.",
              },
  
              {
                severity: "LOW",
                summary:
                  "Minor cleanup",
                evidence: [
                  "Unused helper remains.",
                ],
                files: [
                  "lib/example.dart",
                ],
                recommendation:
                  "Remove the helper.",
              },
            ],
  
            requirementCoverage: [],
  
            requiresHumanInput: false,
  
            confidence: 0.9,
          },
        });
  
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-004",
            run,
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(
          metrics.reviewFindings,
        ).toBe(2);
      });
  
      it("records human intervention when the run stops for human input", () => {
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-005",
  
            run: createRun({
              task: createTask(
                "NEEDS_HUMAN",
              ),
            }),
  
            stopReason:
              "HUMAN_INPUT_REQUIRED",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(
          metrics.humanInterventions,
        ).toBe(1);
  
        expect(metrics.success).toBe(
          false,
        );
      });
  
      it("does not treat final approval requirement as completed success", () => {
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-006",
  
            run: createRun({
              task: createTask(
                "AWAITING_FINAL_APPROVAL",
              ),
            }),
  
            stopReason:
              "FINAL_APPROVAL_REQUIRED",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.success).toBe(
          false,
        );
  
        expect(
          metrics.firstPassSuccess,
        ).toBe(false);
      });
  
      it("leaves unavailable token, cost, and stage timing metrics at zero", () => {
        const metrics =
          createSequentialRunMetrics({
            runId: "RUN-007",
  
            run: createRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          });
  
        expect(metrics.inputTokens).toBe(
          0,
        );
  
        expect(
          metrics.outputTokens,
        ).toBe(0);
  
        expect(
          metrics.estimatedCostUsd,
        ).toBe(0);
  
        expect(
          metrics.planningDurationMs,
        ).toBe(0);
  
        expect(
          metrics.implementationDurationMs,
        ).toBe(0);
  
        expect(
          metrics.validationDurationMs,
        ).toBe(0);
  
        expect(
          metrics.reviewDurationMs,
        ).toBe(0);
      });
  
      it("rejects invalid timestamps", () => {
        expect(() =>
          createSequentialRunMetrics({
            runId: "RUN-008",
  
            run: createRun(),
  
            stopReason: "COMPLETE",
  
            startedAt:
              "not-a-timestamp",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          }),
        ).toThrow(
          "Run timestamps must be valid ISO date strings.",
        );
      });
  
      it("rejects completion before start", () => {
        expect(() =>
          createSequentialRunMetrics({
            runId: "RUN-009",
  
            run: createRun(),
  
            stopReason: "COMPLETE",
  
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