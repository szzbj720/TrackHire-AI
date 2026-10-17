import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import {
    PullRequestBodyBuilder,
  } from "./pull-request-body-builder.js";
  
  function makeTask(): EngineeringTask {
    return {
      id:
        "TH-001",
  
      request:
        "Add an optional interview date and display upcoming interviews.",
  
      status:
        "VALIDATING",
  
      requirements: [
        "Support an optional interview date.",
        "Display upcoming interviews.",
      ],
  
      acceptanceCriteria: [
        "Interview date is optional.",
        "Interview date persists.",
        "Upcoming interviews are displayed.",
      ],
  
      constraints: [],
  
      repairAttempts:
        0,
  
      createdAt:
        "2026-10-17T00:00:00.000Z",
  
      updatedAt:
        "2026-10-17T00:00:00.000Z",
    };
  }
  
  function makeValidation(
    passed = true,
  ): ValidationResult {
    return {
      passed,
  
      checks: [
        {
          name:
            "flutter analyze",
  
          command:
            "flutter",
  
          args: [
            "analyze",
          ],
  
          exitCode:
            passed
              ? 0
              : 1,
  
          stdout:
            "",
  
          stderr:
            "",
  
          durationMs:
            100,
  
          passed,
        },
  
        {
          name:
            "flutter test",
  
          command:
            "flutter",
  
          args: [
            "test",
          ],
  
          exitCode:
            0,
  
          stdout:
            "",
  
          stderr:
            "",
  
          durationMs:
            200,
  
          passed:
            true,
        },
      ],
  
      failedChecks:
        passed
          ? []
          : [
              "flutter analyze",
            ],
  
      durationMs:
        300,
    };
  }
  
  describe(
    "PullRequestBodyBuilder",
    () => {
      it(
        "renders the task summary",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(),
  
              evidence:
                [],
            });
  
          expect(
            body,
          ).toContain(
            "Add an optional interview date and display upcoming interviews.",
          );
  
          expect(
            body,
          ).toContain(
            "TH-001",
          );
  
          expect(
            body,
          ).toContain(
            "VALIDATING",
          );
        },
      );
  
      it(
        "renders passing validation checks",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(),
  
              evidence:
                [],
            });
  
          expect(
            body,
          ).toContain(
            "Overall status: **PASSED**",
          );
  
          expect(
            body,
          ).toContain(
            "PASS: `flutter analyze`",
          );
  
          expect(
            body,
          ).toContain(
            "PASS: `flutter test`",
          );
        },
      );
  
      it(
        "renders failed validation checks",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(
                  false,
                ),
  
              evidence:
                [],
            });
  
          expect(
            body,
          ).toContain(
            "Overall status: **FAILED**",
          );
  
          expect(
            body,
          ).toContain(
            "FAIL: `flutter analyze`",
          );
        },
      );
  
      it(
        "renders structured evidence",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(),
  
              evidence: [
                {
                  requirement:
                    "Interview date is optional.",
  
                  implementation:
                    "Added nullable interviewDate to JobApplication.",
  
                  verification:
                    "Covered by model serialization tests.",
                },
  
                {
                  requirement:
                    "Upcoming interviews are displayed.",
  
                  implementation:
                    "Added upcomingInterviews filtering in ApplicationProvider.",
  
                  verification:
                    "Covered by provider tests.",
                },
              ],
            });
  
          expect(
            body,
          ).toContain(
            "### 1. Interview date is optional.",
          );
  
          expect(
            body,
          ).toContain(
            "Added nullable interviewDate to JobApplication.",
          );
  
          expect(
            body,
          ).toContain(
            "Covered by model serialization tests.",
          );
  
          expect(
            body,
          ).toContain(
            "### 2. Upcoming interviews are displayed.",
          );
        },
      );
  
      it(
        "renders a clear message when there is no evidence",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(),
  
              evidence:
                [],
            });
  
          expect(
            body,
          ).toContain(
            "No structured evidence was recorded.",
          );
        },
      );
  
      it(
        "states that final merge remains human-controlled",
        () => {
          const builder =
            new PullRequestBodyBuilder();
  
          const body =
            builder.build({
              task:
                makeTask(),
  
              validation:
                makeValidation(),
  
              evidence:
                [],
            });
  
          expect(
            body,
          ).toContain(
            "Final approval and merge remain human-controlled.",
          );
        },
      );
    },
  );