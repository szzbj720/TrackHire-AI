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
  VerificationWorkflow,
} from "../verification/verification-workflow.js";
import type {
  ImplementationWorkflow,
} from "./implementation-workflow.js";
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
import {
  TrustDecisionWorkflow,
} from "./trust-decision-workflow.js";

function createHighRiskTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-AUTONOMY-001",
    request: "Change a high-risk application workflow.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: ["Preserve existing behavior."],
    acceptanceCriteria: ["Independent verification passes."],
    constraints: [],
    analysis: {
      complexity: "high",
      risk: "high",
      affectedAreas: [],
      relevantFiles: [],
      ambiguities: [],
      assumptions: [],
      confidence: 0.95,
      requiresHumanInput: false,
      reasoning: "High-risk integration test.",
    },
    strategy: {
      mode: "sequential",
      reasoning: "Use the sequential workflow.",
    },
    plan: {
      summary: "Make the high-risk change.",
      steps: [
        {
          order: 1,
          description: "Update the application model.",
          files: ["lib/models/job_application.dart"],
          rationale: "Exercise the trust boundary.",
        },
      ],
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
}

async function runHighRiskTask(
  verificationPassed: boolean,
  reviewApproved: boolean,
) {
  const worktreePath = await mkdtemp(
    join(tmpdir(), "factory-autonomy-test-"),
  );

  await mkdir(
    join(worktreePath, "lib", "models"),
    { recursive: true },
  );

  await writeFile(
    join(
      worktreePath,
      "lib",
      "models",
      "job_application.dart",
    ),
    "class JobApplication {}\n",
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
          branch: "factory/th-autonomy-001",
        },
        implementation: {
          summary: "Implemented the high-risk change.",
          changedFiles: [
            {
              path: "lib/models/job_application.dart",
              changeType: "modified" as const,
              summary: "Updated model behavior.",
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
      };
    },
  } as unknown as ImplementationWorkflow;

  const verificationWorkflow = {
    async run() {
      return {
        plan: {
          probes: [
            {
              id: "high-risk-probe",
              hypothesis: "Existing behavior remains correct.",
              rationale: "Verify the high-risk change independently.",
              command: "node",
              args: ["probe.js"],
              expectedOutcome: "Probe passes.",
            },
          ],
        },
        verification: {
          passed: verificationPassed,
          probes: [],
          failedProbes: verificationPassed
            ? []
            : ["high-risk-probe"],
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
          approved: reviewApproved,
          summary: reviewApproved
            ? "Implementation is ready."
            : "Implementation still has risk.",
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
    implementationWorkflow,
    undefined,
    undefined,
    reviewWorkflow,
    undefined,
    verificationWorkflow,
    new TrustDecisionWorkflow(),
  );

  const initialRun: SequentialFactoryRun = {
    task: createHighRiskTask(),
    repairs: [],
  };

  return factory.resumeAfterPlanApproval(
    initialRun,
    worktreePath,
    "main",
  );
}

describe("SequentialFactory autonomy boundaries", () => {
  it("keeps verified high-risk work on the final human approval path", async () => {
    const result = await runHighRiskTask(true, true);

    expect(result.stopReason).toBe("FINAL_APPROVAL_REQUIRED");
    expect(result.run.trustDecision?.action).toBe("MERGE");
    expect(result.run.task.status).toBe("AWAITING_FINAL_APPROVAL");
  });

  it("escalates failed high-risk work instead of autonomously retrying", async () => {
    const result = await runHighRiskTask(false, false);

    expect(result.stopReason).toBe("HUMAN_INPUT_REQUIRED");
    expect(result.run.trustDecision?.action).toBe("ESCALATE");
    expect(result.run.task.status).toBe("AWAITING_FINAL_APPROVAL");
  });
});
