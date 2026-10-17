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
  
  import {
    finalizeFactoryRun,
  } from "./finalize-factory-run.js";
  
  function makeFactoryResult(
    options?: {
      stopReason?:
        AdaptiveFactoryResult["stopReason"];
  
      status?:
        AdaptiveFactoryResult["run"]["task"]["status"];
    },
  ): AdaptiveFactoryResult {
    return {
      run: {
        task: {
          id:
            "TH-001",
  
          request:
            "Add an optional interview date and display upcoming interviews.",
  
          status:
            options?.status ??
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
              "Sequential execution is appropriate.",
          },
  
          repairAttempts:
            0,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:00:00.000Z",
        },
  
        implementation: {
          summary:
            "Added interview date support.",
  
          changedFiles: [
            {
              path:
                "lib/models/job_application.dart",
  
              changeType:
                "modified",
  
              summary:
                "Added nullable interviewDate.",
            },
  
            {
              path:
                "lib/providers/application_provider.dart",
  
              changeType:
                "modified",
  
              summary:
                "Added upcoming interview filtering.",
            },
          ],
  
          commandsRun:
            [],
  
          assumptions:
            [],
  
          warnings:
            [],
  
          requiresHumanInput:
            false,
        },
  
        validation: {
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
        },
  
        review: {
          approved:
            true,
  
          summary:
            "Implementation satisfies the requested behavior.",
  
          findings:
            [],
  
          requirementCoverage: [
            {
              requirement:
                "Interview date is optional.",
  
              satisfied:
                true,
  
              evidence: [
                "Nullable interviewDate is present.",
                "Serialization tests pass.",
              ],
            },
  
            {
              requirement:
                "Upcoming interviews are displayed.",
  
              satisfied:
                true,
  
              evidence: [
                "Provider filtering tests pass.",
              ],
            },
          ],
  
          requiresHumanInput:
            false,
  
          confidence:
            0.95,
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
        options?.stopReason ??
        "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  describe(
    "finalizeFactoryRun",
    () => {
      it(
        "creates a dry-run draft PR and returns the final report",
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
  
          const report =
            await finalizeFactoryRun({
              runtime,
  
              result:
                makeFactoryResult(),
  
              headBranch:
                "factory/TH-001",
  
              pullRequestTitle:
                "feat: add interview date",
            });
  
          expect(
            report.taskId,
          ).toBe(
            "TH-001",
          );
  
          expect(
            report.stopReason,
          ).toBe(
            "FINAL_APPROVAL_REQUIRED",
          );
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
  
          expect(
            report.pullRequest,
          ).toEqual({
            number:
              1,
  
            url:
              "https://github.com/szzbj720/TrackHire-AI/pull/1",
  
            status:
              "draft",
  
            isDraft:
              true,
          });
        },
      );
  
      it(
        "uses real factory evidence in the draft PR body",
        async () => {
          let requestBody:
            Record<string, unknown> | undefined;
  
          const fetchImpl:
            GitHubFetch =
              async (
                _url,
                init,
              ) => {
                requestBody =
                  JSON.parse(
                    init.body,
                  ) as Record<
                    string,
                    unknown
                  >;
  
                return {
                  ok:
                    true,
  
                  status:
                    201,
  
                  async json() {
                    return {
                      number:
                        100,
  
                      html_url:
                        "https://github.com/szzbj720/TrackHire-AI/pull/100",
  
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
  
          await finalizeFactoryRun({
            runtime,
  
            result:
              makeFactoryResult(),
  
            headBranch:
              "factory/TH-001",
  
            pullRequestTitle:
              "feat: add interview date",
          });
  
          const body =
            String(
              requestBody?.body ??
              "",
            );
  
          expect(
            body,
          ).toContain(
            "Interview date is optional.",
          );
  
          expect(
            body,
          ).toContain(
            "Added nullable interviewDate.",
          );
  
          expect(
            body,
          ).toContain(
            "Serialization tests pass.",
          );
  
          expect(
            body,
          ).toContain(
            "Provider filtering tests pass.",
          );
  
          expect(
            body,
          ).toContain(
            "Final approval and merge remain human-controlled.",
          );
        },
      );
  
      it(
        "does not create a PR when final approval has not been reached",
        async () => {
          let liveCallCount =
            0;
  
          const fetchImpl:
            GitHubFetch =
              async () => {
                liveCallCount +=
                  1;
  
                throw new Error(
                  "GitHub should not be called.",
                );
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
  
          const report =
            await finalizeFactoryRun({
              runtime,
  
              result:
                makeFactoryResult({
                  stopReason:
                    "PLAN_APPROVAL_REQUIRED",
  
                  status:
                    "AWAITING_PLAN_APPROVAL",
                }),
  
              headBranch:
                "factory/TH-001",
  
              pullRequestTitle:
                "feat: add interview date",
            });
  
          expect(
            liveCallCount,
          ).toBe(0);
  
          expect(
            report.pullRequest,
          ).toBeUndefined();
  
          expect(
            report.stopReason,
          ).toBe(
            "PLAN_APPROVAL_REQUIRED",
          );
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
        },
      );
  
      it(
        "rejects an empty head branch when a PR is ready to be created",
        async () => {
          const config =
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const runtime =
            createFactoryRuntime(
              config,
            );
  
          await expect(
            finalizeFactoryRun({
              runtime,
  
              result:
                makeFactoryResult(),
  
              headBranch:
                "   ",
  
              pullRequestTitle:
                "feat: add interview date",
            }),
          ).rejects.toThrow(
            "Draft pull request head branch is required.",
          );
        },
      );
  
      it(
        "rejects an empty PR title when a PR is ready to be created",
        async () => {
          const config =
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const runtime =
            createFactoryRuntime(
              config,
            );
  
          await expect(
            finalizeFactoryRun({
              runtime,
  
              result:
                makeFactoryResult(),
  
              headBranch:
                "factory/TH-001",
  
              pullRequestTitle:
                "   ",
            }),
          ).rejects.toThrow(
            "Draft pull request title is required.",
          );
        },
      );
  
      it(
        "still relies on lifecycle validation safety before PR creation",
        async () => {
          const config =
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          const runtime =
            createFactoryRuntime(
              config,
            );
  
          const result =
            makeFactoryResult();
  
          if (
            result.run.validation
          ) {
            result.run.validation = {
              ...result.run.validation,
  
              passed:
                false,
  
              failedChecks: [
                "flutter test",
              ],
            };
          }
  
          await expect(
            finalizeFactoryRun({
              runtime,
  
              result,
  
              headBranch:
                "factory/TH-001",
  
              pullRequestTitle:
                "feat: add interview date",
            }),
          ).rejects.toThrow(
            "Cannot create a draft pull request because validation failed.",
          );
        },
      );
    },
  );