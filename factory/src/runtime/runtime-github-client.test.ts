import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    FakeGitHubClient,
  } from "../github/fake-github-client.js";
  
  import type {
    GitHubFetch,
  } from "../github/github-api-client.js";
  
  import {
    createFactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  import {
    createRuntimeGitHubClient,
  } from "./runtime-github-client.js";
  
  describe(
    "createRuntimeGitHubClient",
    () => {
      it(
        "uses the deterministic fake GitHub client in dry-run mode",
        () => {
          const config =
            createFactoryRuntimeConfig({
              mode:
                "dry-run",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const result =
            createRuntimeGitHubClient(
              config,
            );
  
          expect(
            result.mode,
          ).toBe(
            "dry-run",
          );
  
          expect(
            result.isLive,
          ).toBe(false);
  
          expect(
            result.client,
          ).toBeInstanceOf(
            FakeGitHubClient,
          );
        },
      );
  
      it(
        "does not call the live HTTP layer in dry-run mode",
        async () => {
          let callCount =
            0;
  
          const fetchImpl:
            GitHubFetch =
              async () => {
                callCount +=
                  1;
  
                throw new Error(
                  "Live HTTP should not be called.",
                );
              };
  
          const config =
            createFactoryRuntimeConfig({
              mode:
                "dry-run",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const result =
            createRuntimeGitHubClient(
              config,
              fetchImpl,
            );
  
          await result.client
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
                "Dry-run pull request.",
            });
  
          expect(
            callCount,
          ).toBe(0);
        },
      );
  
      it(
        "uses the real GitHub API client path in live mode",
        async () => {
          const requests:
            string[] =
              [];
  
          const fetchImpl:
            GitHubFetch =
              async (
                url,
              ) => {
                requests.push(
                  url,
                );
  
                return {
                  ok:
                    true,
  
                  status:
                    201,
  
                  async json() {
                    return {
                      number:
                        77,
  
                      html_url:
                        "https://github.com/szzbj720/TrackHire-AI/pull/77",
  
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
  
          const config =
            createFactoryRuntimeConfig({
              mode:
                "live",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
  
              githubToken:
                "test-token",
            });
  
          const result =
            createRuntimeGitHubClient(
              config,
              fetchImpl,
            );
  
          const pullRequest =
            await result.client
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
                  "Validated work.",
              });
  
          expect(
            result.mode,
          ).toBe(
            "live",
          );
  
          expect(
            result.isLive,
          ).toBe(true);
  
          expect(
            requests,
          ).toEqual([
            "https://api.github.com/repos/szzbj720/TrackHire-AI/pulls",
          ]);
  
          expect(
            pullRequest.number,
          ).toBe(77);
  
          expect(
            pullRequest.isDraft,
          ).toBe(true);
        },
      );
  
      it(
        "rejects a live configuration missing its token",
        () => {
          const config = {
            mode:
              "live" as const,
  
            repository:
              "szzbj720/TrackHire-AI",
  
            repositoryRoot:
              "/tmp/trackhire",
  
            baseBranch:
              "main",
          };
  
          expect(() =>
            createRuntimeGitHubClient(
              config,
            ),
          ).toThrow(
            "Live factory mode requires a GitHub token.",
          );
        },
      );
    },
  );