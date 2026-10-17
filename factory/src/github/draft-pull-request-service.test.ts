import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
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
  
  describe(
    "DraftPullRequestService",
    () => {
      it(
        "creates a draft pull request through the GitHub client",
        async () => {
          const client =
            new RecordingGitHubClient({
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
            });
  
          const service =
            new DraftPullRequestService(
              client,
            );
  
          const request: CreateDraftPullRequestRequest =
            {
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
  
          const result =
            await service.create(
              request,
            );
  
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
        "rejects a client result that is not a draft",
        async () => {
          const client =
            new RecordingGitHubClient({
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
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "",
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
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "",
            }),
          ).rejects.toThrow(
            "GitHub client returned an unexpected pull request status.",
          );
        },
      );
    },
  );