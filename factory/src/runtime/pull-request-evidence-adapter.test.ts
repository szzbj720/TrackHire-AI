import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import {
    buildPullRequestEvidence,
  } from "./pull-request-evidence-adapter.js";
  
  function makeBaseResult():
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
            "Upcoming interviews are displayed.",
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
    "buildPullRequestEvidence",
    () => {
      it(
        "uses review requirement coverage when available",
        () => {
          const result =
            makeBaseResult();
  
          result.run.review = {
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
          };
  
          const evidence =
            buildPullRequestEvidence(
              result,
            );
  
          expect(
            evidence,
          ).toHaveLength(2);
  
          expect(
            evidence[0]?.requirement,
          ).toBe(
            "Interview date is optional.",
          );
  
          expect(
            evidence[0]?.implementation,
          ).toContain(
            "lib/models/job_application.dart",
          );
  
          expect(
            evidence[0]?.verification,
          ).toContain(
            "Serialization tests pass.",
          );
  
          expect(
            evidence[1]?.verification,
          ).toContain(
            "Provider filtering tests pass.",
          );
        },
      );
  
      it(
        "falls back to acceptance criteria when review coverage is unavailable",
        () => {
          const result =
            makeBaseResult();
  
          const evidence =
            buildPullRequestEvidence(
              result,
            );
  
          expect(
            evidence,
          ).toHaveLength(2);
  
          expect(
            evidence[0]?.requirement,
          ).toBe(
            "Interview date is optional.",
          );
  
          expect(
            evidence[1]?.requirement,
          ).toBe(
            "Upcoming interviews are displayed.",
          );
  
          expect(
            evidence[0]?.verification,
          ).toContain(
            "PASS flutter analyze",
          );
  
          expect(
            evidence[0]?.verification,
          ).toContain(
            "PASS flutter test",
          );
        },
      );
  
      it(
        "includes implementation file summaries",
        () => {
          const evidence =
            buildPullRequestEvidence(
              makeBaseResult(),
            );
  
          expect(
            evidence[0]?.implementation,
          ).toContain(
            "Added nullable interviewDate.",
          );
  
          expect(
            evidence[0]?.implementation,
          ).toContain(
            "Added upcoming interview filtering.",
          );
        },
      );
  
      it(
        "returns no PR evidence without implementation evidence",
        () => {
          const result =
            makeBaseResult();
  
          delete result.run.implementation;
  
          expect(
            buildPullRequestEvidence(
              result,
            ),
          ).toEqual([]);
        },
      );
  
      it(
        "returns no PR evidence without validation evidence",
        () => {
          const result =
            makeBaseResult();
  
          delete result.run.validation;
  
          expect(
            buildPullRequestEvidence(
              result,
            ),
          ).toEqual([]);
        },
      );
  
      it(
        "uses the implementation summary when there are no changed files",
        () => {
          const result =
            makeBaseResult();
  
          if (
            result.run.implementation
          ) {
            result.run.implementation.changedFiles =
              [];
          }
  
          const evidence =
            buildPullRequestEvidence(
              result,
            );
  
          expect(
            evidence[0]?.implementation,
          ).toBe(
            "Added interview date support.",
          );
        },
      );
    },
  );