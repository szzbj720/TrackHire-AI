import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ParallelValidationResult,
  } from "../orchestrator/parallel-validation-workflow.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import {
    createParallelRunMetrics,
  } from "./parallel-run-metrics.js";
  
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
    overrides: Partial<ParallelValidationResult> = {},
  ): ParallelValidationResult {
    return {
      task: createTask(
        "AWAITING_FINAL_APPROVAL",
      ),
  
      implementation: {
        summary:
          "Integrated parallel implementation.",
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
            durationMs: 100,
            passed: true,
          },
        ],
  
        failedChecks: [],
        durationMs: 100,
      },
  
      review: {
        task: createTask(
          "AWAITING_FINAL_APPROVAL",
        ),
  
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
  
      ...overrides,
    };
  }
  
  describe(
    "createParallelRunMetrics",
    () => {
      it("derives successful parallel metrics", () => {
        const metrics =
          createParallelRunMetrics({
            runId: "PAR-001",
            run: createRun(),
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:02.000Z",
          });
  
        expect(metrics.strategy).toBe(
          "parallel",
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
        ).toBe(100);
  
        expect(
          metrics.totalDurationMs,
        ).toBe(2000);
      });
  
      it("records repair attempts without inventing final failure", () => {
        const metrics =
          createParallelRunMetrics({
            runId: "PAR-002",
            run: createRun(),
            repairAttempts: 2,
  
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
  
      it("counts final failed validation after preceding repairs", () => {
        const baseRun = createRun();
  
        const run: ParallelValidationResult = {
          task: createTask(
            "DIAGNOSING_FAILURE",
          ),
  
          implementation:
            baseRun.implementation,
  
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
                durationMs: 125,
                passed: false,
              },
            ],
  
            failedChecks: ["test"],
            durationMs: 125,
          },
        };
  
        const metrics =
          createParallelRunMetrics({
            runId: "PAR-003",
            run,
            repairAttempts: 1,
  
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
  
        expect(metrics.success).toBe(
          false,
        );
      });
  
      it("counts reviewer findings and human escalation", () => {
        const run = createRun({
          task: createTask(
            "NEEDS_HUMAN",
          ),
  
          review: {
            task: createTask(
              "NEEDS_HUMAN",
            ),
  
            review: {
              approved: false,
  
              summary:
                "Review found an issue.",
  
              findings: [
                {
                  severity: "HIGH",
                  summary:
                    "Regression risk",
  
                  evidence: [
                    "Existing behavior changed.",
                  ],
  
                  files: [
                    "lib/example.dart",
                  ],
  
                  recommendation:
                    "Correct the regression.",
                },
              ],
  
              requirementCoverage: [],
              requiresHumanInput: true,
              confidence: 0.6,
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
        });
  
        const metrics =
          createParallelRunMetrics({
            runId: "PAR-004",
            run,
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:02.000Z",
          });
  
        expect(
          metrics.reviewFindings,
        ).toBe(1);
  
        expect(
          metrics.humanInterventions,
        ).toBe(1);
  
        expect(metrics.success).toBe(
          false,
        );
      });
  
      it("rejects invalid repair attempt counts", () => {
        expect(() =>
          createParallelRunMetrics({
            runId: "PAR-005",
            run: createRun(),
            repairAttempts: -1,
  
            startedAt:
              "2026-10-16T00:00:00.000Z",
  
            completedAt:
              "2026-10-16T00:00:01.000Z",
          }),
        ).toThrow(
          "Repair attempt count must be a nonnegative integer.",
        );
      });
  
      it("rejects invalid timestamps", () => {
        expect(() =>
          createParallelRunMetrics({
            runId: "PAR-006",
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
          createParallelRunMetrics({
            runId: "PAR-007",
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