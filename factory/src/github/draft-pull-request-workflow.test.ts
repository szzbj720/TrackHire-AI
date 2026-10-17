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
    DraftPullRequestService,
  } from "./draft-pull-request-service.js";
  
  import {
    DraftPullRequestWorkflow,
  } from "./draft-pull-request-workflow.js";
  
  import {
    FakeGitHubClient,
  } from "./fake-github-client.js";
  
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
        "AWAITING_FINAL_APPROVAL",
  
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
    passed: boolean,
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
            passed
              ? 0
              : 1,
  
          stdout:
            "",
  
          stderr:
            "",
  
          durationMs:
            200,
  
          passed,
        },
      ],
  
      failedChecks:
        passed
          ? []
          : [
              "flutter analyze",
              "flutter test",
            ],
  
      durationMs:
        300,
    };
  }
  
  describe(
    "DraftPullRequestWorkflow",
    () => {
      it(
        "builds the body and creates a validated draft pull request",
        async () => {
          const client =
            new FakeGitHubClient(
              20,
            );
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          const workflow =
            new DraftPullRequestWorkflow(
              new PullRequestBodyBuilder(),
              service,
            );
  
          const result =
            await workflow.run({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              task:
                makeTask(),
  
              validation:
                makeValidation(
                  true,
                ),
  
              evidence: [
                {
                  requirement:
                    "Interview date is optional.",
  
                  implementation:
                    "Added nullable interviewDate to JobApplication.",
  
                  verification:
                    "Covered by model serialization tests.",
                },
              ],
            });
  
          expect(
            result.number,
          ).toBe(20);
  
          expect(
            result.isDraft,
          ).toBe(true);
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
  
          const created =
            client.listCreatedPullRequests();
  
          expect(
            created,
          ).toHaveLength(1);
  
          expect(
            created[0]?.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
  
          expect(
            created[0]?.baseBranch,
          ).toBe(
            "main",
          );
  
          expect(
            created[0]?.headBranch,
          ).toBe(
            "factory/TH-001",
          );
  
          expect(
            created[0]?.title,
          ).toBe(
            "feat: add interview date",
          );
        },
      );
  
      it(
        "does not create a pull request when validation failed",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          const workflow =
            new DraftPullRequestWorkflow(
              new PullRequestBodyBuilder(),
              service,
            );
  
          await expect(
            workflow.run({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              task:
                makeTask(),
  
              validation:
                makeValidation(
                  false,
                ),
  
              evidence:
                [],
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request because validation failed.",
          );
  
          expect(
            client.listCreatedPullRequests(),
          ).toHaveLength(0);
        },
      );
    },
  );