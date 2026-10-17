import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    GitHubApiClient,
    type GitHubFetch,
    type GitHubHttpRequestInit,
  } from "./github-api-client.js";
  
  interface RecordedRequest {
    url: string;
    init: GitHubHttpRequestInit;
  }
  
  function createSuccessfulFetch(
    recordedRequests:
      RecordedRequest[],
  ): GitHubFetch {
    return async (
      url,
      init,
    ) => {
      recordedRequests.push({
        url,
        init,
      });
  
      return {
        ok:
          true,
  
        status:
          201,
  
        async json() {
          return {
            number:
              42,
  
            html_url:
              "https://github.com/szzbj720/TrackHire-AI/pull/42",
  
            title:
              "feat: add interview date",
  
            state:
              "open",
  
            draft:
              true,
          };
        },
      };
    };
  }
  
  describe(
    "GitHubApiClient",
    () => {
      it(
        "creates a draft pull request through the GitHub API",
        async () => {
          const recordedRequests:
            RecordedRequest[] =
              [];
  
          const client =
            new GitHubApiClient(
              "test-token",
              createSuccessfulFetch(
                recordedRequests,
              ),
            );
  
          const result =
            await client
              .createDraftPullRequest({
                repository:
                  "szzbj720/TrackHire-AI",
  
                baseBranch:
                  "main",
  
                headBranch:
                  "factory/TH-001",
  
                title:
                  "feat: add interview date",
  
                body:
                  "Validated factory work.",
              });
  
          expect(
            result.number,
          ).toBe(42);
  
          expect(
            result.url,
          ).toBe(
            "https://github.com/szzbj720/TrackHire-AI/pull/42",
          );
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
  
          expect(
            result.isDraft,
          ).toBe(true);
  
          expect(
            result.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
        },
      );
  
      it(
        "sends the required GitHub draft pull request request",
        async () => {
          const recordedRequests:
            RecordedRequest[] =
              [];
  
          const client =
            new GitHubApiClient(
              "test-token",
              createSuccessfulFetch(
                recordedRequests,
              ),
            );
  
          await client
            .createDraftPullRequest({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "Validated factory work.",
            });
  
          expect(
            recordedRequests,
          ).toHaveLength(1);
  
          const request =
            recordedRequests[0];
  
          expect(
            request?.url,
          ).toBe(
            "https://api.github.com/repos/szzbj720/TrackHire-AI/pulls",
          );
  
          expect(
            request?.init.method,
          ).toBe(
            "POST",
          );
  
          expect(
            request?.init.headers.Authorization,
          ).toBe(
            "Bearer test-token",
          );
  
          expect(
            JSON.parse(
              request?.init.body ??
                "{}",
            ),
          ).toEqual({
            title:
              "feat: add interview date",
  
            head:
              "factory/TH-001",
  
            base:
              "main",
  
            body:
              "Validated factory work.",
  
            draft:
              true,
          });
        },
      );
  
      it(
        "rejects an empty GitHub token",
        () => {
          expect(() =>
            new GitHubApiClient(
              "   ",
            ),
          ).toThrow(
            "GitHub token is required.",
          );
        },
      );
  
      it(
        "reports GitHub API failures without exposing the token",
        async () => {
          const fetchImpl:
            GitHubFetch =
              async () => ({
                ok:
                  false,
  
                status:
                  422,
  
                async json() {
                  return {
                    message:
                      "Validation Failed",
                  };
                },
              });
  
          const client =
            new GitHubApiClient(
              "super-secret-token",
              fetchImpl,
            );
  
          await expect(
            client
              .createDraftPullRequest({
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
            "GitHub draft pull request creation failed with status 422: Validation Failed",
          );
  
          try {
            await client
              .createDraftPullRequest({
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
              });
          } catch (error) {
            expect(
              String(error),
            ).not.toContain(
              "super-secret-token",
            );
          }
        },
      );
  
      it(
        "rejects malformed successful GitHub responses",
        async () => {
          const fetchImpl:
            GitHubFetch =
              async () => ({
                ok:
                  true,
  
                status:
                  201,
  
                async json() {
                  return {
                    unexpected:
                      true,
                  };
                },
              });
  
          const client =
            new GitHubApiClient(
              "test-token",
              fetchImpl,
            );
  
          await expect(
            client
              .createDraftPullRequest({
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
          ).rejects.toThrow();
        },
      );
  
      it(
        "does not silently accept a non-draft GitHub response",
        async () => {
          const fetchImpl:
            GitHubFetch =
              async () => ({
                ok:
                  true,
  
                status:
                  201,
  
                async json() {
                  return {
                    number:
                      42,
  
                    html_url:
                      "https://github.com/szzbj720/TrackHire-AI/pull/42",
  
                    title:
                      "feat: add interview date",
  
                    state:
                      "open",
  
                    draft:
                      false,
                  };
                },
              });
  
          const client =
            new GitHubApiClient(
              "test-token",
              fetchImpl,
            );
  
          const result =
            await client
              .createDraftPullRequest({
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
              });
  
          expect(
            result.isDraft,
          ).toBe(false);
  
          expect(
            result.status,
          ).toBe(
            "open",
          );
        },
      );
    },
  );