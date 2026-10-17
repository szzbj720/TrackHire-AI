import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import {
    buildFactoryRunReport,
  } from "./factory-run-report.js";
  
  function makeResult(
    options?: {
      status?: AdaptiveFactoryResult["run"]["task"]["status"];
      stopReason?: AdaptiveFactoryResult["stopReason"];
      validationPassed?: boolean;
    },
  ): AdaptiveFactoryResult {
    const validationPassed =
      options?.validationPassed ??
      true;
  
    return {
      run: {
        task: {
          id:
            "TH-001",
  
          request:
            "Add an optional interview date.",
  
          status:
            options?.status ??
            "AWAITING_FINAL_APPROVAL",
  
          requirements: [
            "Support an optional interview date.",
          ],
  
          acceptanceCriteria: [
            "Interview date is optional.",
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
            1,
  
          createdAt:
            "2026-10-17T00:00:00.000Z",
  
          updatedAt:
            "2026-10-17T00:00:00.000Z",
        },
  
        validation: {
          passed:
            validationPassed,
  
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
                validationPassed
                  ? 0
                  : 1,
  
              stdout:
                "",
  
              stderr:
                "",
  
              durationMs:
                100,
  
              passed:
                validationPassed,
            },
          ],
  
          failedChecks:
            validationPassed
              ? []
              : [
                  "flutter test",
                ],
  
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
        options?.stopReason ??
        "FINAL_APPROVAL_REQUIRED",
    };
  }
  
  function makePullRequest():
    PullRequestResult {
    return {
      number:
        91,
  
      url:
        "https://github.com/szzbj720/TrackHire-AI/pull/91",
  
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
    "buildFactoryRunReport",
    () => {
      it(
        "summarizes a factory run awaiting final approval",
        () => {
          const report =
            buildFactoryRunReport(
              makeResult(),
            );
  
          expect(
            report,
          ).toEqual({
            taskId:
              "TH-001",
  
            taskStatus:
              "AWAITING_FINAL_APPROVAL",
  
            stopReason:
              "FINAL_APPROVAL_REQUIRED",
  
            executionMode:
              "sequential",
  
            validationPassed:
              true,
  
            repairAttempts:
              1,
  
            requiresHumanAction:
              true,
          });
        },
      );
  
      it(
        "includes a created draft pull request",
        () => {
          const report =
            buildFactoryRunReport(
              makeResult(),
              makePullRequest(),
            );
  
          expect(
            report.pullRequest,
          ).toEqual({
            number:
              91,
  
            url:
              "https://github.com/szzbj720/TrackHire-AI/pull/91",
  
            status:
              "draft",
  
            isDraft:
              true,
          });
        },
      );
  
      it(
        "marks completed work as not requiring human action",
        () => {
          const report =
            buildFactoryRunReport(
              makeResult({
                status:
                  "COMPLETE",
  
                stopReason:
                  "COMPLETE",
              }),
            );
  
          expect(
            report.requiresHumanAction,
          ).toBe(false);
  
          expect(
            report.taskStatus,
          ).toBe(
            "COMPLETE",
          );
        },
      );
  
      it(
        "marks explicit human escalation as requiring action",
        () => {
          const report =
            buildFactoryRunReport(
              makeResult({
                status:
                  "NEEDS_HUMAN",
  
                stopReason:
                  "HUMAN_INPUT_REQUIRED",
              }),
            );
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
        },
      );
  
      it(
        "preserves failed validation evidence",
        () => {
          const report =
            buildFactoryRunReport(
              makeResult({
                validationPassed:
                  false,
  
                status:
                  "FAILED",
  
                stopReason:
                  "FAILED",
              }),
            );
  
          expect(
            report.validationPassed,
          ).toBe(false);
  
          expect(
            report.stopReason,
          ).toBe(
            "FAILED",
          );
  
          expect(
            report.requiresHumanAction,
          ).toBe(false);
        },
      );
  
      it(
        "works when no validation result exists yet",
        () => {
          const result =
            makeResult({
              status:
                "AWAITING_PLAN_APPROVAL",
  
              stopReason:
                "PLAN_APPROVAL_REQUIRED",
            });
  
          delete result.run.validation;
  
          const report =
            buildFactoryRunReport(
              result,
            );
  
          expect(
            report.validationPassed,
          ).toBeUndefined();
  
          expect(
            report.requiresHumanAction,
          ).toBe(true);
        },
      );
    },
  );