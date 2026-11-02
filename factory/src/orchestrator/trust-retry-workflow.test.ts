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
  Repairer,
  RepairerInput,
} from "../agents/repairer.js";
import type {
  EngineeringTask,
  TaskRisk,
} from "../schemas/task.js";
import type {
  Validator,
} from "../validation/validator.js";
import {
  TrustRetryWorkflow,
} from "./trust-retry-workflow.js";

function createTask(
  repairAttempts = 0,
  risk?: TaskRisk,
): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-TRUST-RETRY-001",
    request: "Add optional interview date tracking.",
    status: "AWAITING_FINAL_APPROVAL",
    requirements: [
      "Interview date must be optional.",
    ],
    acceptanceCriteria: [
      "Existing applications continue to work.",
    ],
    constraints: [],
    ...(risk
      ? {
          analysis: {
            complexity: "low" as const,
            risk,
            affectedAreas: [],
            relevantFiles: [],
            ambiguities: [],
            assumptions: [],
            confidence: 0.95,
            requiresHumanInput: false,
            reasoning: "Test analysis.",
          },
          strategy: {
            mode: "sequential" as const,
            reasoning: "Test strategy.",
          },
        }
      : {}),
    plan: {
      summary: "Add interview date support.",
      steps: [
        {
          order: 1,
          description: "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale: "Store an optional interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: ["Run tests."],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    },
    repairAttempts,
    createdAt: now,
    updatedAt: now,
  };
}

async function createInput(
  repairAttempts = 0,
  risk?: TaskRisk,
) {
  const worktreePath = await mkdtemp(
    join(tmpdir(), "trust-retry-test-"),
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

  return {
    task: createTask(repairAttempts, risk),
    implementation: {
      summary: "Added interview date support.",
      changedFiles: [
        {
          path: "lib/models/job_application.dart",
          changeType: "modified" as const,
          summary: "Updated model.",
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
      failedProbes: ["nullable-roundtrip"],
      durationMs: 1,
    },
    review: {
      approved: false,
      summary: "Edge case remains.",
      findings: [
        {
          severity: "MEDIUM" as const,
          summary: "Nullable roundtrip fails.",
          evidence: ["Probe failed."],
          files: [
            "lib/models/job_application.dart",
          ],
          recommendation: "Repair serialization.",
        },
      ],
      requirementCoverage: [],
      requiresHumanInput: false,
      confidence: 0.9,
    },
    trustDecision: {
      action: "RETRY" as const,
      confidence: 0.9,
      reasons: [
        "Independent verification found an actionable failure.",
      ],
      evidence: [
        {
          source: "verification" as const,
          signal: "Probe failed.",
          supportsTrust: false,
        },
      ],
    },
    worktreePath,
  };
}

describe("TrustRetryWorkflow", () => {
  it("repairs trust failures and returns to review after validation passes", async () => {
    let repairInput: RepairerInput | undefined;

    const repairer = {
      async repair(input: RepairerInput) {
        repairInput = input;
        return {
          summary: "Repaired nullable serialization.",
          changedFiles: [
            {
              path: "lib/models/job_application.dart",
              changeType: "modified" as const,
              summary: "Fixed serialization.",
            },
          ],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        };
      },
    } as Repairer;

    const validator = {
      async validate() {
        return {
          passed: true,
          checks: [],
          failedChecks: [],
          durationMs: 1,
        };
      },
    } as Validator;

    const workflow = new TrustRetryWorkflow(
      repairer,
      validator,
    );
    const input = await createInput();
    const result = await workflow.run(input);

    expect(result.task.status).toBe("REVIEWING");
    expect(result.task.repairAttempts).toBe(1);
    expect(result.repair?.requiresHumanInput).toBe(false);
    expect(result.diagnosis.evidence).toContain(
      "Independent verification failed probe: nullable-roundtrip.",
    );
    expect(repairInput?.task.status).toBe("REPAIRING");
  });

  it("returns failed retry validation to normal diagnosis", async () => {
    const repairer = {
      async repair() {
        return {
          summary: "Attempted repair.",
          changedFiles: [],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        };
      },
    } as Repairer;

    const validator = {
      async validate() {
        return {
          passed: false,
          checks: [],
          failedChecks: ["tests"],
          durationMs: 1,
        };
      },
    } as Validator;

    const workflow = new TrustRetryWorkflow(
      repairer,
      validator,
    );
    const result = await workflow.run(
      await createInput(),
    );

    expect(result.task.status).toBe("DIAGNOSING_FAILURE");
    expect(result.task.repairAttempts).toBe(1);
  });

  it("refuses to exceed the repair attempt budget", async () => {
    const workflow = new TrustRetryWorkflow(
      {} as Repairer,
      {} as Validator,
    );

    await expect(
      workflow.run(await createInput(2)),
    ).rejects.toThrow(
      "repair attempt budget is exhausted",
    );
  });

  it("allows both low-risk autonomous trust repairs", async () => {
    const repairer = {
      async repair() {
        return {
          summary: "Repaired low-risk trust failure.",
          changedFiles: [],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        };
      },
    } as Repairer;

    const validator = {
      async validate() {
        return {
          passed: true,
          checks: [],
          failedChecks: [],
          durationMs: 1,
        };
      },
    } as Validator;

    const workflow = new TrustRetryWorkflow(
      repairer,
      validator,
    );

    const result = await workflow.run(
      await createInput(1, "low"),
    );

    expect(result.task.status).toBe("REVIEWING");
    expect(result.task.repairAttempts).toBe(2);
  });

  it("blocks a third low-risk autonomous trust repair", async () => {
    const workflow = new TrustRetryWorkflow(
      {} as Repairer,
      {} as Validator,
    );

    await expect(
      workflow.run(
        await createInput(2, "low"),
      ),
    ).rejects.toThrow(
      "repair attempt budget is exhausted",
    );
  });

  it("allows the first medium-risk autonomous trust repair", async () => {
    const repairer = {
      async repair() {
        return {
          summary: "Repaired medium-risk trust failure.",
          changedFiles: [],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        };
      },
    } as Repairer;

    const validator = {
      async validate() {
        return {
          passed: true,
          checks: [],
          failedChecks: [],
          durationMs: 1,
        };
      },
    } as Validator;

    const workflow = new TrustRetryWorkflow(
      repairer,
      validator,
    );

    const result = await workflow.run(
      await createInput(0, "medium"),
    );

    expect(result.task.status).toBe("REVIEWING");
    expect(result.task.repairAttempts).toBe(1);
  });

  it("limits medium-risk trust retries to one autonomous repair", async () => {
    const workflow = new TrustRetryWorkflow(
      {} as Repairer,
      {} as Validator,
    );

    await expect(
      workflow.run(
        await createInput(1, "medium"),
      ),
    ).rejects.toThrow(
      "repair attempt budget is exhausted",
    );
  });

  it("blocks autonomous trust repair for high-risk work", async () => {
    const workflow = new TrustRetryWorkflow(
      {} as Repairer,
      {} as Validator,
    );

    await expect(
      workflow.run(
        await createInput(0, "high"),
      ),
    ).rejects.toThrow(
      "repair attempt budget is exhausted",
    );
  });
});
