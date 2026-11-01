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
  PlanningWorkflow,
} from "./planning-workflow.js";
import type {
  ReviewWorkflow,
} from "./review-workflow.js";
import {
  SequentialFactory,
  type SequentialFactoryRun,
} from "./sequential-factory.js";
import type {
  TrustRetryWorkflow,
} from "./trust-retry-workflow.js";
import type {
  VerificationWorkflow,
} from "../verification/verification-workflow.js";

function createRun(
  worktreePath: string,
): SequentialFactoryRun {
  const now = new Date().toISOString();

  const task: EngineeringTask = {
    id: "TH-TRUST-RETRY-001",
    request: "Add optional interview date tracking.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: ["Interview date must be optional."],
    acceptanceCriteria: ["Existing applications continue to work."],
    constraints: [],
    plan: {
      summary: "Add interview date support.",
      steps: [],
      affectedFiles: ["lib/models/job_application.dart"],
      validationSteps: ["Run tests."],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  return {
    task,
    worktree: {
      path: worktreePath,
      branch: "factory/th-trust-retry-001",
    },
    implementation: {
      summary: "Initial implementation.",
      changedFiles: [
        {
          path: "lib/models/job_application.dart",
          changeType: "modified",
          summary: "Added interview date.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    },
    validation: {
      passed: true,
      checks: [],
      failedChecks: [],
      durationMs: 1,
    },
    verification: {
      passed: false,
      probes: [],
      failedProbes: ["edge-case"],
      durationMs: 1,
    },
    review: {
      approved: false,
      summary: "Edge case remains.",
      findings: [],
      requirementCoverage: [],
      requiresHumanInput: false,
      confidence: 0.8,
    },
    trustDecision: {
      action: "RETRY",
      confidence: 0.8,
      reasons: ["Independent verification found an actionable failure."],
      evidence: [
        {
          source: "verification",
          signal: "edge-case failed",
          supportsTrust: false,
        },
      ],
    },
    repairs: [],
  };
}

describe("SequentialFactory trust retry resume", () => {
  it("re-enters verification and review after a successful trust repair", async () => {
    const worktreePath = await mkdtemp(
      join(tmpdir(), "factory-trust-retry-resume-"),
    );

    await mkdir(join(worktreePath, "lib", "models"), {
      recursive: true,
    });
    await writeFile(
      join(worktreePath, "lib", "models", "job_application.dart"),
      "class JobApplication { DateTime? interviewDate; }\n",
      "utf8",
    );

    const trustRetryWorkflow = {
      async run(input: { task: EngineeringTask }) {
        return {
          task: {
            ...input.task,
            status: "REVIEWING" as const,
            repairAttempts: 1,
          },
          repair: {
            summary: "Fixed the edge case.",
            changedFiles: [
              {
                path: "lib/models/job_application.dart",
                changeType: "modified" as const,
                summary: "Fixed optional date handling.",
              },
            ],
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          },
          validation: {
            passed: true,
            checks: [],
            failedChecks: [],
            durationMs: 1,
          },
          diagnosis: {
            category: "INCORRECT_IMPLEMENTATION" as const,
            summary: "Trust evidence identified an edge case.",
            evidence: ["edge-case failed"],
            suspectedFiles: ["lib/models/job_application.dart"],
            recommendedAction: "Repair the edge case.",
            repairable: true,
            confidence: 0.8,
            requiresHumanInput: false,
          },
        };
      },
    } as unknown as TrustRetryWorkflow;

    const verificationWorkflow = {
      async run() {
        return {
          plan: { probes: [] },
          verification: {
            passed: true,
            probes: [],
            failedProbes: [],
            durationMs: 1,
          },
        };
      },
    } as unknown as VerificationWorkflow;

    const reviewWorkflow = {
      async run(input: { task: EngineeringTask }) {
        return {
          task: {
            ...input.task,
            status: "AWAITING_FINAL_APPROVAL" as const,
          },
          review: {
            approved: true,
            summary: "Repair is ready.",
            findings: [],
            requirementCoverage: [],
            requiresHumanInput: false,
            confidence: 0.95,
          },
          changeEvidence: {
            approvedFiles: ["lib/models/job_application.dart"],
            reportedFiles: ["lib/models/job_application.dart"],
            observedFiles: ["lib/models/job_application.dart"],
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
      undefined,
      undefined,
      undefined,
      reviewWorkflow,
      undefined,
      verificationWorkflow,
      undefined,
      trustRetryWorkflow,
    );

    const result = await factory.resumeAfterTrustRetry(
      createRun(worktreePath),
    );

    expect(result.stopReason).toBe("FINAL_APPROVAL_REQUIRED");
    expect(result.run.task.repairAttempts).toBe(1);
    expect(result.run.repairs).toHaveLength(1);
    expect(result.run.verification?.passed).toBe(true);
    expect(result.run.review?.approved).toBe(true);
    expect(result.run.trustDecision).toBeUndefined();
  });
});
