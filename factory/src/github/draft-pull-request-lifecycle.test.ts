import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
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
  
  import {
    FakeGitHubClient,
  } from "./fake-github-client.js";
  
  import {
    PullRequestBodyBuilder,
  } from "./pull-request-body-builder.js";
  
  function makeValidation(
    passed = true,
  ): ValidationResult {
    return {
      passed,
  
      checks: [
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
            100,
  
          passed,
        },
      ],
  
      failedChecks:
        passed
          ? []
          : [
              "flutter test",
            ],
  
      durationMs:
        100,
    };
  }
  
  function makeFactoryResult(
    options?: {
      stopReason?:
        AdaptiveFactoryResult["stopReason"];
  
      taskStatus?:
        AdaptiveFactoryResult["run"]["task"]["status"];
  
      includeValidation?: boolean;
  
      validationPassed?: boolean;
    },
  ): AdaptiveFactoryResult {
    const validationPassed =
      options?.validationPassed ??
      true;
  
    return {
      run: {
        task: {
          id:
            "TH-001",
  
          request:
            "Add an optional interview date and display upcoming interviews.",
  
          status:
            options?.taskStatus ??
            "AWAITING_FINAL_APPROVAL",
  
          requirements: [
            "Support an optional interview date.",
            "Display upcoming interviews.",
          ],
  
          acceptanceCriteria: [
            "Interview date is optional.",
            "Upcoming interviews are displayed.",
          ],
  
          constraints: [],
  
          repairAttempts:
            0,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:00:00.000Z",
        },
  
        repairs: [],
  
        ...(options?.includeValidation ===
        false
          ? {}
          : {
              validation:
                makeValidation(
                  validationPassed,
                ),
            }),
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
        options?.stopReason ??
        "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  function makeLifecycle(
    client:
      FakeGitHubClient,
  ): DraftPullRequestLifecycle {
    const service =
      new DraftPullRequestService(
        client,
      );
  
    const workflow =
      new DraftPullRequestWorkflow(
        new PullRequestBodyBuilder(),
        service,
      );
  
    return new DraftPullRequestLifecycle(
      workflow,
    );
  }
  
  describe(
    "DraftPullRequestLifecycle",
    () => {
      it(
        "creates a draft pull request at the final approval boundary",
        async () => {
          const client =
            new FakeGitHubClient(
              30,
            );
  
          const lifecycle =
            makeLifecycle(
              client,
            );
  
          const result =
            await lifecycle.create({
              result:
                makeFactoryResult(),
  
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
                    "Added nullable interviewDate.",
  
                  verification:
                    "Validated by tests.",
                },
              ],
            });
  
          expect(
            result.number,
          ).toBe(30);
  
          expect(
            result.isDraft,
          ).toBe(true);
  
          expect(
            client.listCreatedPullRequests(),
          ).toHaveLength(1);
        },
      );
  
      it(
        "rejects creation before the final approval stop reason",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const lifecycle =
            makeLifecycle(
              client,
            );
  
          await expect(
            lifecycle.create({
              result:
                makeFactoryResult({
                  stopReason:
                    "PLAN_APPROVAL_REQUIRED",
                }),
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              evidence:
                [],
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request from stop reason PLAN_APPROVAL_REQUIRED.",
          );
  
          expect(
            client.listCreatedPullRequests(),
          ).toHaveLength(0);
        },
      );
  
      it(
        "rejects creation from the wrong task state",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const lifecycle =
            makeLifecycle(
              client,
            );
  
          await expect(
            lifecycle.create({
              result:
                makeFactoryResult({
                  taskStatus:
                    "REVIEWING",
                }),
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              evidence:
                [],
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request from task state REVIEWING.",
          );
  
          expect(
            client.listCreatedPullRequests(),
          ).toHaveLength(0);
        },
      );
  
      it(
        "rejects creation without validation evidence",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const lifecycle =
            makeLifecycle(
              client,
            );
  
          await expect(
            lifecycle.create({
              result:
                makeFactoryResult({
                  includeValidation:
                    false,
                }),
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              evidence:
                [],
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request without validation evidence.",
          );
  
          expect(
            client.listCreatedPullRequests(),
          ).toHaveLength(0);
        },
      );
  
      it(
        "rejects creation when validation failed",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const lifecycle =
            makeLifecycle(
              client,
            );
  
          await expect(
            lifecycle.create({
              result:
                makeFactoryResult({
                  validationPassed:
                    false,
                }),
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
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