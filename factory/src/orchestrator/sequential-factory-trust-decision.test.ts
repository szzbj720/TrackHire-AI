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
  TrustDecision,
} from "../schemas/trust-decision.js";
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
import type {
  TrustDecisionWorkflow,
  TrustDecisionWorkflowInput,
} from "./trust-decision-workflow.js";

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-TRUST-001",
    request: "Add optional interview date tracking.",
    status: "AWAITING_PLAN_APPROVAL",
    requirements: ["Interview date must be optional."],
    acceptanceCriteria: ["Existing applications continue to work."],
    constraints: [],
    plan: {
      summary: "Add interview date support.",
      steps: [
        {
          order: 1,
          description: "Update the application model.",
          files: ["lib/models/job_application.dart"],
          rationale: "Store an optional interview date.",
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

async function runWithDecision(
  decision: TrustDecision,
) {
  const worktreePath = await mkdtemp(
    join(tmpdir(), "factory-trust-test-"),
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
    "class JobApplication { DateTime? interviewDate; }\n",
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
          branch: "factory/th-trust-001",
        },
        implementation: {
          summary: "Added interview date support.",
          changedFiles: [
            {
              path: "lib/models/job_application.dart",
              changeType: "modified" as const,
              summary: "Added optional interviewDate field.",
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
              durationMs: 5,
              passed: true,
            },
          ],
          failedChecks: [],
          durationMs: 5,
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
              id: "edge-case",
              hypothesis: "Optional dates remain compatible.",
              rationale: "Check an independent behavior.",
              command: "node",
              args: ["probe.js"],
              expectedOutcome: "Probe passes.",
            },
          ],
        },
        verification: {
          passed: true,
          probes: [
            {
              probeId: "edge-case",
              command: "node",
              args: ["probe.js"],
              exitCode: 0,
              stdout: "passed",
              stderr: "",
              durationMs: 5,
              passed: true,
            },
          ],
          failedProbes: [],
          durationMs: 5,
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
          summary: "Implementation is ready.",
          findings: [],
          requirementCoverage: [
            {
              requirement: "Interview date must be optional.",
              satisfied: true,
              evidence: ["Field is nullable."],
            },
          ],
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

  let trustInput: TrustDecisionWorkflowInput | undefined;

  const trustDecisionWorkflow = {
    run(input: TrustDecisionWorkflowInput) {
      trustInput = input;
      return decision;
    },
  } as unknown as TrustDecisionWorkflow;

  const factory = new SequentialFactory(
    {} as PlanningWorkflow,
    implementationWorkflow,
    undefined,
    undefined,
    reviewWorkflow,
    undefined,
    verificationWorkflow,
    trustDecisionWorkflow,
  );

  const initialRun: SequentialFactoryRun = {
    task: createTask(),
    repairs: [],
  };

  const result = await factory.resumeAfterPlanApproval(
    initialRun,
    worktreePath,
    "main",
  );

  return { result, trustInput };
}

function decision(action: TrustDecision["action"]): TrustDecision {
  return {
    action,
    confidence: 0.9,
    reasons: [`Trust action is ${action}.`],
    evidence: [
      {
        source: "verification",
        signal: "Independent verification evidence was evaluated.",
        supportsTrust: action === "MERGE",
      },
    ],
  };
}

describe("SequentialFactory trust decisions", () => {
  it("keeps MERGE on the final human approval path", async () => {
    const { result, trustInput } = await runWithDecision(
      decision("MERGE"),
    );

    expect(result.stopReason).toBe("FINAL_APPROVAL_REQUIRED");
    expect(result.run.trustDecision?.action).toBe("MERGE");
    expect(result.run.task.status).toBe("AWAITING_FINAL_APPROVAL");
    expect(trustInput?.verification.passed).toBe(true);
    expect(trustInput?.review.approved).toBe(true);
  });

  it("surfaces RETRY without forcing an invalid lifecycle transition", async () => {
    const { result } = await runWithDecision(
      decision("RETRY"),
    );

    expect(result.stopReason).toBe("TRUST_RETRY_REQUIRED");
    expect(result.run.trustDecision?.action).toBe("RETRY");
    expect(result.run.task.status).toBe("AWAITING_FINAL_APPROVAL");
  });

  it("surfaces ESCALATE as human input required", async () => {
    const { result } = await runWithDecision(
      decision("ESCALATE"),
    );

    expect(result.stopReason).toBe("HUMAN_INPUT_REQUIRED");
    expect(result.run.trustDecision?.action).toBe("ESCALATE");
    expect(result.run.task.status).toBe("AWAITING_FINAL_APPROVAL");
  });
});
