import { resolve } from "node:path";

import type {
  TaskAnalyzer,
} from "./agents/analyzer.js";
import type {
  Builder,
  BuilderInput,
} from "./agents/builder.js";
import type {
  Planner,
} from "./agents/planner.js";
import type {
  Reviewer,
  ReviewerInput,
} from "./agents/reviewer.js";
import {
  RunArtifactStore,
} from "./artifact/run-artifact-store.js";
import type {
  RepositoryContext,
} from "./context/context-builder.js";
import {
  ImplementationWorkflow,
} from "./orchestrator/implementation-workflow.js";
import {
  PlanningWorkflow,
} from "./orchestrator/planning-workflow.js";
import {
  ReviewWorkflow,
} from "./orchestrator/review-workflow.js";
import {
  SequentialFactory,
} from "./orchestrator/sequential-factory.js";
import type {
  ImplementationResult,
} from "./schemas/implementation.js";
import type {
  ImplementationPlan,
} from "./schemas/plan.js";
import type {
  ReviewResult,
} from "./schemas/review.js";
import type {
  EngineeringTask,
  TaskAnalysis,
} from "./schemas/task.js";
import type {
  ValidationResult,
} from "./schemas/validation.js";
import {
  Workspace,
} from "./tools/workspace.js";
import type {
  Validator,
} from "./validation/validator.js";

class DemoAnalyzer implements TaskAnalyzer {
  async analyze(
    _task: EngineeringTask,
    _context: RepositoryContext,
  ): Promise<TaskAnalysis> {
    return {
      complexity: "medium",
      risk: "medium",
      affectedAreas: [
        "application model",
      ],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: [],
      assumptions: [
        "Interview date is optional.",
      ],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning:
        "The demo updates the TrackHire application model in an isolated worktree.",
    };
  }
}

class DemoPlanner implements Planner {
  async plan(
    _task: EngineeringTask,
    _analysis: TaskAnalysis,
    _context: RepositoryContext,
  ): Promise<ImplementationPlan> {
    return {
      summary:
        "Add optional interview date support to the application model.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model with an optional interview date.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The application model needs to store the interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Verify the isolated implementation.",
      ],
      risks: [
        "Existing application data must remain compatible.",
      ],
      assumptions: [
        "The interview date remains optional.",
      ],
      requiresHumanInput: false,
    };
  }
}

class DemoBuilder implements Builder {
  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    const workspace =
      new Workspace(input.worktreePath);

    const path =
      "lib/models/job_application.dart";

    const current =
      await workspace.read(path);

    const marker =
      "// AI Software Factory demo evidence";

    if (!current.includes(marker)) {
      await workspace.write(
        path,
        `${current.trimEnd()}\n\n${marker}\n`,
      );
    }

    return {
      summary:
        "Added a deterministic demo change in the isolated worktree.",
      changedFiles: [
        {
          path,
          changeType: "modified",
          summary:
            "Added the AI Software Factory demo evidence marker.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [
        "This executable uses a deterministic demo builder rather than model inference.",
      ],
      requiresHumanInput: false,
    };
  }
}

class DemoValidator implements Validator {
  async validate(
    worktreePath: string,
  ): Promise<ValidationResult> {
    const workspace =
      new Workspace(worktreePath);

    const path =
      "lib/models/job_application.dart";

    const content =
      await workspace.read(path);

    const passed = content.includes(
      "// AI Software Factory demo evidence",
    );

    return {
      passed,
      checks: [
        {
          name:
            "Demo implementation evidence",
          command:
            "deterministic-demo-check",
          args: [path],
          exitCode: passed ? 0 : 1,
          stdout: passed
            ? "Expected demo evidence exists."
            : "",
          stderr: passed
            ? ""
            : "Expected demo evidence is missing.",
          durationMs: 0,
          passed,
        },
      ],
      failedChecks: passed
        ? []
        : [
            "Demo implementation evidence",
          ],
      durationMs: 0,
    };
  }
}

class DemoReviewer implements Reviewer {
  async review(
    input: ReviewerInput,
  ): Promise<ReviewResult> {
    const expectedPath =
      "lib/models/job_application.dart";

    const relevantFile =
      input.relevantFiles.find(
        (file) =>
          file.path === expectedPath,
      );

    const evidencePresent =
      relevantFile?.content.includes(
        "// AI Software Factory demo evidence",
      ) ?? false;

    const approved =
      input.validation.passed &&
      evidencePresent;

    return {
      approved,
      summary: approved
        ? "Deterministic review found matching implementation and validation evidence."
        : "Deterministic review could not verify the expected evidence.",
      findings: approved
        ? []
        : [
            {
              severity: "HIGH",
              summary:
                "Expected implementation evidence is missing.",
              evidence: [
                "The reviewer could not find the expected marker in the approved file.",
              ],
              files: [
                expectedPath,
              ],
              recommendation:
                "Inspect the implementation before approval.",
            },
          ],
      requirementCoverage: [
        {
          requirement:
            "Demonstrate an isolated implementation change.",
          satisfied: approved,
          evidence: evidencePresent
            ? [
                "The expected marker exists in the isolated worktree.",
              ]
            : [
                "The expected marker was not found.",
              ],
        },
      ],
      requiresHumanInput: false,
      confidence: approved ? 0.95 : 0.9,
    };
  }
}

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: `DEMO-${Date.now()}`,
    request:
      "Demonstrate the sequential AI Software Factory on the TrackHire repository.",
    status: "TASK_CREATED",
    requirements: [
      "Make a controlled change in an isolated worktree.",
      "Validate the change deterministically.",
      "Review the observed Git evidence before final approval.",
    ],
    acceptanceCriteria: [
      "The original working tree is not modified.",
      "Validation passes.",
      "Review evidence matches the approved scope.",
    ],
    constraints: [
      "Do not use paid model inference.",
      "Do not merge or modify the main branch.",
    ],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

async function main(): Promise<void> {
  const repositoryRoot = resolve("..");

  const artifactRoot = resolve(
    repositoryRoot,
    ".factory",
  );

  const factory =
    new SequentialFactory(
      new PlanningWorkflow(
        new DemoAnalyzer(),
        new DemoPlanner(),
      ),
      new ImplementationWorkflow(
        new DemoBuilder(),
        new DemoValidator(),
      ),
      undefined,
      undefined,
      new ReviewWorkflow(
        new DemoReviewer(),
      ),
      new RunArtifactStore(
        artifactRoot,
      ),
    );

  const task = createTask();

  console.log(
    "\n=== AI Software Factory: Sequential Demo ===\n",
  );

  console.log(`Task: ${task.id}`);
  console.log(`Request: ${task.request}`);

  console.log("\n[1] Analyze + Plan");

  const planning =
    await factory.start(
      task,
      repositoryRoot,
    );

  console.log(
    `State: ${planning.run.task.status}`,
  );

  console.log(
    `Stop reason: ${planning.stopReason}`,
  );

  if (
    planning.stopReason !==
    "PLAN_APPROVAL_REQUIRED"
  ) {
    console.log(
      "\nDemo stopped before plan approval.",
    );

    return;
  }

  console.log(
    "\n[2] Human Plan Approval",
  );

  console.log(
    "Demo approval granted.",
  );

  console.log(
    "\n[3] Implement + Validate + Review",
  );

  const reviewed =
    await factory.resumeAfterPlanApproval(
      planning.run,
      repositoryRoot,
      "main",
    );

  console.log(
    `State: ${reviewed.run.task.status}`,
  );

  console.log(
    `Stop reason: ${reviewed.stopReason}`,
  );

  if (reviewed.run.worktree) {
    console.log(
      `Worktree: ${reviewed.run.worktree.path}`,
    );
  }

  console.log(
    `Validation passed: ${
      reviewed.run.validation?.passed ??
      false
    }`,
  );

  console.log(
    `Review approved: ${
      reviewed.run.review?.approved ??
      false
    }`,
  );

  console.log(
    `Within approved scope: ${
      reviewed.run.changeEvidence
        ?.withinApprovedScope ?? false
    }`,
  );

  console.log(
    `Report matches observed changes: ${
      reviewed.run.changeEvidence
        ?.reportMatchesObserved ?? false
    }`,
  );

  if (
    reviewed.stopReason !==
    "FINAL_APPROVAL_REQUIRED"
  ) {
    console.log(
      "\nDemo stopped before final approval.",
    );

    return;
  }

  console.log(
    "\n[4] Human Final Approval",
  );

  console.log(
    "Demo approval granted.",
  );

  const completed =
    await factory.resumeAfterFinalApproval(
      reviewed.run,
    );

  console.log(
    "\n[5] Complete",
  );

  console.log(
    `State: ${completed.run.task.status}`,
  );

  console.log(
    `Stop reason: ${completed.stopReason}`,
  );

  console.log(
    `\nEvidence: ${resolve(
      artifactRoot,
      "runs",
      task.id,
    )}`,
  );

  console.log(
    "\nThe original repository working tree was not modified by the builder.",
  );

  console.log(
    "\nNote: analyzer, planner, builder, validator, and reviewer behavior in this executable is deterministic. The orchestration, worktree isolation, evidence checking, approval gates, and persistence infrastructure are real.",
  );
}

main().catch((error) => {
  console.error(
    "\nSequential factory demo failed:",
    error,
  );

  process.exitCode = 1;
});