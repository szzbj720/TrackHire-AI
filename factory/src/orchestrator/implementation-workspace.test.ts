import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Builder,
    BuilderInput,
  } from "../agents/builder.js";
  
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  import {
    ImplementationWorkflow,
  } from "./implementation-workflow.js";
  
  class RecordingBuilder
    implements Builder {
    worktreePaths: string[] = [];
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.worktreePaths.push(
        input.worktreePath,
      );
  
      return {
        summary:
          "Implemented benchmark task.",
  
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
  
            changeType:
              "modified",
  
            summary:
              "Added interview date support.",
          },
        ],
  
        commandsRun: [],
  
        assumptions: [],
  
        warnings: [],
  
        requiresHumanInput: false,
      };
    }
  }
  
  class RecordingValidator
    implements Validator {
    worktreePaths: string[] = [];
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      this.worktreePaths.push(
        worktreePath,
      );
  
      return {
        passed: true,
  
        checks: [
          {
            name:
              "Flutter tests",
  
            command:
              "flutter",
  
            args: [
              "test",
            ],
  
            exitCode: 0,
  
            stdout:
              "All tests passed.",
  
            stderr: "",
  
            durationMs: 100,
  
            passed: true,
          },
        ],
  
        failedChecks: [],
  
        durationMs: 100,
      };
    }
  }
  
  function createPlan():
    ImplementationPlan {
    return {
      summary:
        "Add interview date support.",
  
      steps: [
        {
          order: 1,
  
          description:
            "Update TrackHire application behavior.",
  
          files: [
            "lib/models/job_application.dart",
          ],
  
          rationale:
            "The benchmark requires interview date support.",
        },
      ],
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
  
      risks: [],
  
      assumptions: [
        "Interview date is optional.",
      ],
  
      requiresHumanInput: false,
    };
  }
  
  function createTask():
    EngineeringTask {
    return {
      id:
        "trackhire-interview-date-run-001",
  
      request:
        "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  
      status:
        "IMPLEMENTING",
  
      requirements: [
        "Interview date must be optional.",
      ],
  
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
  
      constraints: [],
  
      repairAttempts: 0,
  
      plan:
        createPlan(),
  
      createdAt:
        "2026-10-16T21:00:00.000Z",
  
      updatedAt:
        "2026-10-16T21:00:00.000Z",
    };
  }
  
  describe(
    "ImplementationWorkflow benchmark workspace",
    () => {
      it("uses a supplied benchmark workspace instead of creating another worktree", async () => {
        const builder =
          new RecordingBuilder();
  
        const validator =
          new RecordingValidator();
  
        const workflow =
          new ImplementationWorkflow(
            builder,
            validator,
          );
  
        const result =
          await workflow.run(
            createTask(),
  
            "/repo/trackhire",
  
            "abc123def456",
  
            {
              worktree: {
                path:
                  "/tmp/benchmark-worktree",
  
                branch:
                  "factory/benchmark-trackhire-interview-date-run-001-sequential",
              },
            },
          );
  
        expect(
          builder.worktreePaths,
        ).toEqual([
          "/tmp/benchmark-worktree",
        ]);
  
        expect(
          validator.worktreePaths,
        ).toEqual([
          "/tmp/benchmark-worktree",
        ]);
  
        expect(
          result.worktree,
        ).toEqual({
          path:
            "/tmp/benchmark-worktree",
  
          branch:
            "factory/benchmark-trackhire-interview-date-run-001-sequential",
        });
  
        expect(
          result.validation.passed,
        ).toBe(true);
  
        expect(
          result.task.status,
        ).toBe("REVIEWING");
      });
  
      it("preserves the supplied workspace branch as execution evidence", async () => {
        const workflow =
          new ImplementationWorkflow(
            new RecordingBuilder(),
            new RecordingValidator(),
          );
  
        const result =
          await workflow.run(
            createTask(),
  
            "/repo/trackhire",
  
            "abc123def456",
  
            {
              worktree: {
                path:
                  "/tmp/benchmark-exploration",
  
                branch:
                  "factory/benchmark-exploration",
              },
            },
          );
  
        expect(
          result.worktree.path,
        ).toBe(
          "/tmp/benchmark-exploration",
        );
  
        expect(
          result.worktree.branch,
        ).toBe(
          "factory/benchmark-exploration",
        );
      });
    },
  );