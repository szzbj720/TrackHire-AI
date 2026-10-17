import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    GitHubFetch,
  } from "../github/github-api-client.js";
  
  import {
    createFactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  import {
    createFactoryRuntime,
  } from "./factory-runtime.js";
  
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
          ],
  
          acceptanceCriteria: [
            "Interview date is optional.",
          ],
  
          constraints:
            [],
  
          repairAttempts:
            0,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:00:00.000Z",
        },
  
        validation: {
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
        },
  
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
    "createFactoryRuntime",
    () => {
      it(
        "composes a dry-run runtime",
        async () => {
          const config =
            createFactoryRuntimeConfig({
              mode:
                "dry-run",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const runtime =
            createFactoryRuntime(
              config,
            );
  
          expect(
            runtime.config,
          ).toBe(
            config,
          );
  
          expect(
            runtime.isLiveGitHub,
          ).toBe(false);
  
          const pullRequest =
            await runtime
              .draftPullRequestLifecycle
              .create({
                result:
                  makeFactoryResult(),
  
                repository:
                  config.repository,
  
                baseBranch:
                  config.baseBranch,
  
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
            pullRequest.number,
          ).toBe(1);
        },
      );
  
      it(
        "composes a live runtime through the injected GitHub transport",
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
                        88,
  
                      html_url:
                        "https://github.com/szzbj720/TrackHire-AI/pull/88",
  
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
  
          const runtime =
            createFactoryRuntime(
              config,
              fetchImpl,
            );
  
          expect(
            runtime.isLiveGitHub,
          ).toBe(true);
  
          const pullRequest =
            await runtime
              .draftPullRequestLifecycle
              .create({
                result:
                  makeFactoryResult(),
  
                repository:
                  config.repository,
  
                baseBranch:
                  config.baseBranch,
  
                headBranch:
                  "factory/TH-001",
  
                title:
                  "feat: add interview date",
  
                evidence:
                  [],
              });
  
          expect(
            requests,
          ).toEqual([
            "https://api.github.com/repos/szzbj720/TrackHire-AI/pulls",
          ]);
  
          expect(
            pullRequest.number,
          ).toBe(88);
  
          expect(
            pullRequest.isDraft,
          ).toBe(true);
        },
      );
    },
  );