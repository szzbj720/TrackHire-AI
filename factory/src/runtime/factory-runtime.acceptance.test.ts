import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    createFactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  import {
    createFactoryRuntime,
  } from "./factory-runtime.js";
  
  import {
    finalizeFactoryRun,
  } from "./finalize-factory-run.js";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  function makeAcceptedResult():
    AdaptiveFactoryResult {
    return {
      run: {
        task: {
          id:
            "TH-ACCEPTANCE",
  
          request:
            "Add an optional interview date and display upcoming interviews.",
  
          status:
            "AWAITING_FINAL_APPROVAL",
  
          requirements: [
            "Store an optional interview date.",
            "Display upcoming interviews.",
          ],
  
          acceptanceCriteria: [
            "Existing applications remain compatible.",
            "Future interviews are displayed.",
          ],
  
          constraints: [
            "Final merge must remain human-controlled.",
          ],
  
          strategy: {
            mode:
              "sequential",
  
            reasoning:
              "The work can be safely completed sequentially.",
          },
  
          repairAttempts:
            0,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:10:00.000Z",
        },
  
        implementation: {
          summary:
            "Added interview date support and upcoming interview filtering.",
  
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
  
          commandsRun: [
            "flutter analyze",
            "flutter test",
          ],
  
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
            "The implementation satisfies the requested behavior.",
  
          findings:
            [],
  
          requirementCoverage: [
            {
              requirement:
                "Existing applications remain compatible.",
  
              satisfied:
                true,
  
              evidence: [
                "interviewDate is nullable.",
              ],
            },
  
            {
              requirement:
                "Future interviews are displayed.",
  
              satisfied:
                true,
  
              evidence: [
                "Upcoming interview filtering is covered by validation.",
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
        "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  describe(
    "factory runtime acceptance",
    () => {
      it(
        "safely delivers validated work as a draft while preserving human control",
        async () => {
          const config =
            createFactoryRuntimeConfig({
              mode:
                "dry-run",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
  
              baseBranch:
                "main",
            });
  
          const runtime =
            createFactoryRuntime(
              config,
            );
  
          const result =
            makeAcceptedResult();
  
          const report =
            await finalizeFactoryRun({
              runtime,
  
              result,
  
              headBranch:
                "factory/TH-ACCEPTANCE",
  
              pullRequestTitle:
                "feat: add interview date",
            });
  
          expect(
            report.validationPassed,
          ).toBe(true);
  
          expect(
            report.pullRequest?.isDraft,
          ).toBe(true);
  
          expect(
            report.pullRequest?.status,
          ).toBe(
            "draft",
          );
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
  
          expect(
            result.run.task.status,
          ).toBe(
            "AWAITING_FINAL_APPROVAL",
          );
  
          expect(
            result.stopReason,
          ).toBe(
            "FINAL_APPROVAL_REQUIRED",
          );
        },
      );
    },
  );