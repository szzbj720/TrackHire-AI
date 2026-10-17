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
    GitHubClient,
  } from "./github-client.js";
  
  class FakeGitHubClient
    implements GitHubClient
  {
    async createDraftPullRequest(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult> {
      return {
        number:
          7,
  
        url:
          "https://github.com/szzbj720/TrackHire-AI/pull/7",
  
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
  
  describe(
    "GitHubClient",
    () => {
      it(
        "supports creating a draft pull request",
        async () => {
          const client =
            new FakeGitHubClient();
  
          const result =
            await client.createDraftPullRequest({
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
            });
  
          expect(
            result.number,
          ).toBe(7);
  
          expect(
            result.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
  
          expect(
            result.baseBranch,
          ).toBe(
            "main",
          );
  
          expect(
            result.headBranch,
          ).toBe(
            "factory/TH-001",
          );
  
          expect(
            result.title,
          ).toBe(
            "feat: add interview date",
          );
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
  
          expect(
            result.isDraft,
          ).toBe(true);
        },
      );
    },
  );