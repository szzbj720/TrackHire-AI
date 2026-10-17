import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import {
    DraftPullRequestService,
  } from "./draft-pull-request-service.js";
  
  import type {
    GitHubClient,
  } from "./github-client.js";
  
  class RecordingGitHubClient
    implements GitHubClient
  {
    readonly requests:
      CreateDraftPullRequestRequest[] =
        [];
  
    constructor(
      private readonly result:
        PullRequestResult,
    ) {}
  
    async createDraftPullRequest(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult> {
      this.requests.push(
        request,
      );
  
      return this.result;
    }
  }
  
  function makeValidation(
    passed: boolean,
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
  
  function makeRequest():
    CreateDraftPullRequestRequest {
    return {
      repository:
        "szzbj720/TrackHire-AI",
  
      baseBranch:
        "main",
  
      headBranch:
        "factory/TH-001",
  
      title:
        "feat: add interview date",
  
      body:
        "Adds interview date support.",
    };
  }
  
  function makeDraftResult():
    PullRequestResult {
    return {
      number:
        12,
  
      url:
        "https://github.com/szzbj720/TrackHire-AI/pull/12",
  
      repository:
        "szzbj720/TrackHire-AI",
  
      baseBranch:
        "main",
  
      headBranch:
        "factory/TH-001",
  
      title:
        "feat: add interview date",
  
      status:
        "draft",
  
      isDraft:
        true,
    };
  }
  
  describe(
    "DraftPullRequestService",
    () => {
      it(
        "creates a draft pull request when validation passed",
        async () => {
          const client =
            new RecordingGitHubClient(
              makeDraftResult(),
            );
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          const request =
            makeRequest();
  
          const result =
            await service.create({
              request,
  
              validation:
                makeValidation(
                  true,
                ),
            });
  
          expect(
            client.requests,
          ).toEqual([
            request,
          ]);
  
          expect(
            result.number,
          ).toBe(12);
  
          expect(
            result.isDraft,
          ).toBe(true);
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
        },
      );
  
      it(
        "does not create a pull request when validation failed",
        async () => {
          const client =
            new RecordingGitHubClient(
              makeDraftResult(),
            );
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          await expect(
            service.create({
              request:
                makeRequest(),
  
              validation:
                makeValidation(
                  false,
                ),
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request because validation failed.",
          );
  
          expect(
            client.requests,
          ).toHaveLength(0);
        },
      );
  
      it(
        "rejects a client result that is not a draft",
        async () => {
          const client =
            new RecordingGitHubClient({
              ...makeDraftResult(),
  
              status:
                "open",
  
              isDraft:
                false,
            });
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          await expect(
            service.create({
              request:
                makeRequest(),
  
              validation:
                makeValidation(
                  true,
                ),
            }),
          ).rejects.toThrow(
            "GitHub client returned a non-draft pull request.",
          );
        },
      );
  
      it(
        "rejects an unexpected draft status",
        async () => {
          const client =
            new RecordingGitHubClient({
              ...makeDraftResult(),
  
              status:
                "open",
  
              isDraft:
                true,
            });
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          await expect(
            service.create({
              request:
                makeRequest(),
  
              validation:
                makeValidation(
                  true,
                ),
            }),
          ).rejects.toThrow(
            "GitHub client returned an unexpected pull request status.",
          );
        },
      );
    },
  );