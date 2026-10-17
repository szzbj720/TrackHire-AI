import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import {
    DraftPullRequestLifecycle,
  } from "./draft-pull-request-lifecycle.js";
  
  import {
    DraftPullRequestService,
  } from "./draft-pull-request-service.js";
  
  import {
    DraftPullRequestWorkflow,
  } from "./draft-pull-request-workflow.js";
  
  import type {
    GitHubClient,
  } from "./github-client.js";
  
  import {
    PullRequestBodyBuilder,
  } from "./pull-request-body-builder.js";
  
  class RecordingGitHubClient
    implements GitHubClient
  {
    readonly requests:
      CreateDraftPullRequestRequest[] =
        [];
  
    async createDraftPullRequest(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult> {
      this.requests.push(
        request,
      );
  
      return {
        number:
          50,
  
        url:
          "https://github.com/szzbj720/TrackHire-AI/pull/50",
  
        repository:
          request.repository,
  
        baseBranch:
          request.baseBranch,
  
        headBranch:
          request.headBranch,
  
        title:
          request.title,
  
        status:
          "draft",
  
        isDraft:
          true,
      };
    }
  }
  
  function makeValidation():
    ValidationResult {
    return {
      passed:
        true,
  
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
            0,
  
          stdout:
            "",
  
          stderr:
            "",
  
          durationMs:
            100,
  
          passed:
            true,
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
        [],
  
      durationMs:
        300,
    };
  }
  
  function makeFactoryResult():
    AdaptiveFactoryResult {
    return {
      run: {
        task: {
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
  
          constraints:
            [],
  
          strategy: {
            mode:
              "sequential",
  
            reasoning:
              "Cross-stack engineering work.",
          },
  
          repairAttempts:
            0,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:00:00.000Z",
        },
  
        validation:
          makeValidation(),
  
        repairs:
          [],
      },
  
      route: {
        route:
          "SEQUENTIAL",
  
        policy: {
          mode:
            "sequential",
  
          disposition:
            "SUPPORTED_SEQUENTIAL",
  
          reasoning:
            "Sequential execution is supported.",
        },
      },
  
      stopReason:
        "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  describe(
    "draft pull request integration",
    () => {
      it(
        "turns validated factory work into a reviewable draft pull request",
        async () => {
          const client =
            new RecordingGitHubClient();
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          const workflow =
            new DraftPullRequestWorkflow(
              new PullRequestBodyBuilder(),
              service,
            );
  
          const lifecycle =
            new DraftPullRequestLifecycle(
              workflow,
            );
  
          const factoryResult =
            makeFactoryResult();
  
          const result =
            await lifecycle.create({
              result:
                factoryResult,
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
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
                    "Added upcoming interview filtering.",
  
                  verification:
                    "Covered by provider tests.",
                },
              ],
            });
  
          expect(
            result.number,
          ).toBe(50);
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
  
          expect(
            result.isDraft,
          ).toBe(true);
  
          expect(
            client.requests,
          ).toHaveLength(1);
  
          const request =
            client.requests[0];
  
          expect(
            request?.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
  
          expect(
            request?.baseBranch,
          ).toBe(
            "main",
          );
  
          expect(
            request?.headBranch,
          ).toBe(
            "factory/TH-001",
          );
  
          expect(
            request?.title,
          ).toBe(
            "feat: add interview date",
          );
  
          expect(
            request?.body,
          ).toContain(
            "Add an optional interview date and display upcoming interviews.",
          );
  
          expect(
            request?.body,
          ).toContain(
            "Overall status: **PASSED**",
          );
  
          expect(
            request?.body,
          ).toContain(
            "PASS: `flutter analyze`",
          );
  
          expect(
            request?.body,
          ).toContain(
            "PASS: `flutter test`",
          );
  
          expect(
            request?.body,
          ).toContain(
            "Added nullable interviewDate to JobApplication.",
          );
  
          expect(
            request?.body,
          ).toContain(
            "Added upcoming interview filtering.",
          );
  
          expect(
            request?.body,
          ).toContain(
            "Final approval and merge remain human-controlled.",
          );
  
          expect(
            factoryResult.run.task.status,
          ).toBe(
            "AWAITING_FINAL_APPROVAL",
          );
  
          expect(
            factoryResult.stopReason,
          ).toBe(
            "FINAL_APPROVAL_REQUIRED",
          );
        },
      );
    },
  );