import {
  mkdir,
  mkdtemp,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import type {
  VerificationWorkflow,
  VerificationWorkflowInput,
} from "../verification/verification-workflow.js";
import type {
  ImplementationWorkflow,
} from "./implementation-workflow.js";
import type {
  PlanningWorkflow,
} from "./planning-workflow.js";
import type {
  ReviewWorkflow,
  ReviewWorkflowInput,
} from "./review-workflow.js";
import {
  SequentialFactory,
  type SequentialFactoryRun,
} from "./sequential-factory.js";

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-VERIFY-001",
    request:
      "Add optional interview date tracking.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: [
      "Interview date must be optional.",
    ],
    acceptanceCriteria: [
      "Existing applications continue to work.",
    ],
    constraints: [],
    plan: {
      summary:
        "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The model needs to store an optional interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run tests.",
      ],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

const verification: VerificationResult = {
  passed: false,
  probes: [
    {
      probeId: "edge-case",
      command: "node",
      args: ["probe.js"],
      exitCode: 1,
      stdout: "",
      stderr: "edge case failed",
      durationMs: 10,
      passed: false,
    },
  ],
  failedProbes: ["edge-case"],
  durationMs: 10,
};

describe(
  "SequentialFactory independent verification",
  () => {
    it(
      "verifies final worktree contents and passes verification evidence into review",
      async () => {
        const worktreePath =
          await mkdtemp(
            join(
              tmpdir(),
              "factory-verification-test-",
            ),
          );

        await mkdir(
          join(
            worktreePath,
            "lib",
            "models",
          ),
          { recursive: true },
        );

        const fileContent =
          "class JobApplication {\n  DateTime? interviewDate;\n}\n";

        await writeFile(
          join(
            worktreePath,
            "lib",
            "models",
            "job_application.dart",
          ),
          fileContent,
          "utf8",
        );

        const implementationWorkflow = {
          async run(task: EngineeringTask) {
            return {
              task: {
                ...task,
                status: "REVIEWING" as const,
              },
              worktree: {
                path: worktreePath,
                branch:
                  "factory/th-verify-001",
              },
              implementation: {
                summary:
                  "Added interview date support.",
                changedFiles: [
                  {
                    path:
                      "lib/models/job_application.dart",
                    changeType:
                      "modified" as const,
                    summary:
                      "Added optional interviewDate field.",
                  },
                ],
                commandsRun: [],
                assumptions: [],
                warnings: [],
                requiresHumanInput: false,
              },
              validation: {
                passed: true,
                checks: [
                  {
                    name: "tests",
                    command: "npm",
                    args: ["test"],
                    exitCode: 0,
                    stdout: "passed",
                    stderr: "",
                    durationMs: 10,
                    passed: true,
                  },
                ],
                failedChecks: [],
                durationMs: 10,
              },
            };
          },
        } as unknown as ImplementationWorkflow;

        let verificationInput:
          VerificationWorkflowInput | undefined;

        const verificationWorkflow = {
          async run(
            input: VerificationWorkflowInput,
          ) {
            verificationInput = input;

            return {
              plan: {
                probes: [
                  {
                    id: "edge-case",
                    hypothesis:
                      "An edge case may still fail.",
                    rationale:
                      "Deterministic validation does not cover it.",
                    command: "node",
                    args: ["probe.js"],
                    expectedOutcome:
                      "The edge case passes.",
                  },
                ],
              },
              verification,
            };
          },
        } as unknown as VerificationWorkflow;

        let reviewInput:
          ReviewWorkflowInput | undefined;

        const reviewWorkflow = {
          async run(input: ReviewWorkflowInput) {
            reviewInput = input;

            return {
              task: {
                ...input.task,
                status:
                  "AWAITING_FINAL_APPROVAL" as const,
              },
              review: {
                approved: true,
                summary:
                  "Review considered verification evidence.",
                findings: [],
                requirementCoverage: [
                  {
                    requirement:
                      "Interview date must be optional.",
                    satisfied: true,
                    evidence: [
                      "Field is nullable.",
                    ],
                  },
                ],
                requiresHumanInput: false,
                confidence: 0.9,
              },
              changeEvidence: {
                approvedFiles: [
                  "lib/models/job_application.dart",
                ],
                reportedFiles: [
                  "lib/models/job_application.dart",
                ],
                observedFiles: [
                  "lib/models/job_application.dart",
                ],
                unreportedFiles: [],
                missingReportedFiles: [],
                unapprovedFiles: [],
                withinApprovedScope: true,
                reportMatchesObserved: true,
                patch: "",
              },
            };
          },
        } as unknown as ReviewWorkflow;

        const factory = new SequentialFactory(
          {} as PlanningWorkflow,
          implementationWorkflow,
          undefined,
          undefined,
          reviewWorkflow,
          undefined,
          verificationWorkflow,
        );

        const initialRun:
          SequentialFactoryRun = {
            task: createTask(),
            repairs: [],
          };

        const result =
          await factory.resumeAfterPlanApproval(
            initialRun,
            worktreePath,
            "main",
          );

        expect(result.stopReason).toBe(
          "FINAL_APPROVAL_REQUIRED",
        );

        expect(
          verificationInput?.changedFiles,
        ).toEqual([
          {
            path:
              "lib/models/job_application.dart",
            content: fileContent,
          },
        ]);

        expect(
          result.run.verification,
        ).toEqual(verification);

        expect(
          result.run.verificationPlan
            ?.probes[0]?.id,
        ).toBe("edge-case");

        expect(
          reviewInput?.verification,
        ).toEqual(verification);
      },
    );
  },
);
