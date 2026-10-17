import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    AdaptiveFactory,
    type AdaptiveFactoryResult,
    type SequentialFactoryAdapter,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    SequentialFactoryResult,
    SequentialFactoryRun,
  } from "../orchestrator/sequential-factory.js";
  
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
  
  class FakeSequentialFactory
    implements SequentialFactoryAdapter
  {
    start = vi.fn(
      async (): Promise<never> => {
        throw new Error(
          "start should not be called.",
        );
      },
    );
  
    resumeAfterPlanApproval = vi.fn(
      async (): Promise<never> => {
        throw new Error(
          "resumeAfterPlanApproval should not be called.",
        );
      },
    );
  
    resumeAfterFinalApproval = vi.fn(
      async (
        run: SequentialFactoryRun,
      ): Promise<SequentialFactoryResult> => {
        return {
          run: {
            ...run,
  
            task: {
              ...run.task,
  
              status:
                "COMPLETE",
            },
          },
  
          stopReason:
            "COMPLETE",
        };
      },
    );
  }
  
  function makeValidation():
    ValidationResult {
    return {
      passed:
        true,
  
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
      ],
  
      failedChecks:
        [],
  
      durationMs:
        100,
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
    "draft pull request human approval boundary",
    () => {
      it(
        "keeps the task awaiting human approval after draft PR creation",
        async () => {
          const client =
            new FakeGitHubClient(
              40,
            );
  
          const lifecycle =
            new DraftPullRequestLifecycle(
              new DraftPullRequestWorkflow(
                new PullRequestBodyBuilder(),
  
                new DraftPullRequestService(
                  client,
                ),
              ),
            );
  
          const factoryResult =
            makeFactoryResult();
  
          const pullRequest =
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
  
              evidence:
                [],
            });
  
          expect(
            pullRequest.isDraft,
          ).toBe(true);
  
          expect(
            pullRequest.status,
          ).toBe(
            "draft",
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
  
      it(
        "requires a separate human approval action before completion",
        async () => {
          const sequentialFactory =
            new FakeSequentialFactory();
  
          const adaptiveFactory =
            new AdaptiveFactory(
              sequentialFactory,
            );
  
          const client =
            new FakeGitHubClient();
  
          const lifecycle =
            new DraftPullRequestLifecycle(
              new DraftPullRequestWorkflow(
                new PullRequestBodyBuilder(),
  
                new DraftPullRequestService(
                  client,
                ),
              ),
            );
  
          const factoryResult =
            makeFactoryResult();
  
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
  
            evidence:
              [],
          });
  
          expect(
            factoryResult.run.task.status,
          ).toBe(
            "AWAITING_FINAL_APPROVAL",
          );
  
          const completed =
            await adaptiveFactory
              .resumeAfterFinalApproval(
                factoryResult,
              );
  
          expect(
            sequentialFactory
              .resumeAfterFinalApproval,
          ).toHaveBeenCalledOnce();
  
          expect(
            completed.run.task.status,
          ).toBe(
            "COMPLETE",
          );
  
          expect(
            completed.stopReason,
          ).toBe(
            "COMPLETE",
          );
        },
      );
  
      it(
        "does not expose any merge operation through the fake GitHub client",
        () => {
          const client =
            new FakeGitHubClient();
  
          expect(
            "mergePullRequest" in client,
          ).toBe(false);
        },
      );
    },
  );