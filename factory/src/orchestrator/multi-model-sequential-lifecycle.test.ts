import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  TaskAnalyzer,
} from "../agents/analyzer.js";
import type {
  Builder,
  BuilderInput,
} from "../agents/builder.js";
import type {
  Planner,
} from "../agents/planner.js";
import type {
  Reviewer,
  ReviewerInput,
} from "../agents/reviewer.js";
import type {
  RepositoryContext,
} from "../context/context-builder.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import type {
  ReviewResult,
} from "../schemas/review.js";
import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import {
  Workspace,
} from "../tools/workspace.js";
import type {
  Validator,
} from "../validation/validator.js";
import {
  ImplementationWorkflow,
} from "./implementation-workflow.js";
import {
  PlanningWorkflow,
} from "./planning-workflow.js";
import {
  ReviewWorkflow,
} from "./review-workflow.js";
import {
  SequentialFactory,
} from "./sequential-factory.js";

const execFileAsync =
  promisify(execFile);

class FakeAnalyzer implements TaskAnalyzer {
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
        "The task changes application data.",
    };
  }
}

class FakePlanner implements Planner {
  async plan(
    _task: EngineeringTask,
    _analysis: TaskAnalysis,
    _context: RepositoryContext,
  ): Promise<ImplementationPlan> {
    return {
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
            "The model needs to store the interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
      risks: [],
      assumptions: [
        "Interview date is optional.",
      ],
      requiresHumanInput: false,
    };
  }
}

class FakeBuilder implements Builder {
  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    const workspace =
      new Workspace(
        input.worktreePath,
      );

    await workspace.write(
      "lib/models/job_application.dart",
      [
        "class JobApplication {",
        "  DateTime? interviewDate;",
        "}",
        "",
      ].join("\n"),
    );

    return {
      summary:
        "Added interview date support.",
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interviewDate field.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
}

class PassingValidator
  implements Validator
{
  async validate(
    _worktreePath: string,
  ): Promise<ValidationResult> {
    return {
      passed: true,
      checks: [
        {
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
          exitCode: 0,
          stdout:
            "All tests passed.",
          stderr: "",
          durationMs: 100,
          passed: true,
        },
      ],
      failedChecks: [],
      durationMs: 100,
    };
  }
}

class FixedReviewer
  implements Reviewer
{
  constructor(
    private readonly result:
      ReviewResult,
  ) {}

  async review(
    _input: ReviewerInput,
  ): Promise<ReviewResult> {
    return this.result;
  }
}

function createTask():
  EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id: "TH-MULTI-001",
    request:
      "Add optional interview date tracking.",
    status: "TASK_CREATED",
    requirements: [
      "Interview date must be optional.",
    ],
    acceptanceCriteria: [
      "Existing applications continue to work.",
    ],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createReview(
  approved: boolean,
  confidence: number,
): ReviewResult {
  return {
    approved,
    summary: approved
      ? "The implementation is approved."
      : "The implementation has a compatibility concern.",
    findings: approved
      ? []
      : [
          {
            severity: "HIGH",
            summary:
              "Potential compatibility risk.",
            evidence: [
              "The application model changed.",
            ],
            files: [
              "lib/models/job_application.dart",
            ],
            recommendation:
              "Verify existing application loading.",
          },
        ],
    requirementCoverage: [
      {
        requirement:
          "Interview date must be optional.",
        satisfied: true,
        evidence: [
          "The field is optional.",
        ],
      },
    ],
    requiresHumanInput: false,
    confidence,
  };
}

async function createTemporaryRepository():
  Promise<string> {
  const repositoryRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "factory-multi-model-lifecycle-",
      ),
    );

  await execFileAsync(
    "git",
    ["init"],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "config",
      "user.email",
      "factory@example.com",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "config",
      "user.name",
      "Factory Test",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  const modelDirectory = join(
    repositoryRoot,
    "lib",
    "models",
  );

  await mkdir(
    modelDirectory,
    {
      recursive: true,
    },
  );

  await writeFile(
    join(
      modelDirectory,
      "job_application.dart",
    ),
    "class JobApplication {}\n",
    "utf8",
  );

  await execFileAsync(
    "git",
    ["add", "."],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "commit",
      "-m",
      "Initial commit",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "branch",
      "-M",
      "main",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  return repositoryRoot;
}

describe(
  "multi-model sequential lifecycle",
  () => {
    it("escalates model disagreement to a human and preserves the evidence", async () => {
      const repositoryRoot =
        await createTemporaryRepository();

      const planningWorkflow =
        new PlanningWorkflow(
          new FakeAnalyzer(),
          new FakePlanner(),
        );

      const implementationWorkflow =
        new ImplementationWorkflow(
          new FakeBuilder(),
          new PassingValidator(),
        );

      const primaryReviewer =
        new FixedReviewer(
          createReview(
            true,
            0.9,
          ),
        );

      const approvingReviewer =
        new FixedReviewer(
          createReview(
            true,
            0.9,
          ),
        );

      const rejectingReviewer =
        new FixedReviewer(
          createReview(
            false,
            0.85,
          ),
        );

      const reviewWorkflow =
        new ReviewWorkflow(
          primaryReviewer,
          0.7,
          {
            targets: [
              {
                id: "reviewer-a",
                model: "model-a",
                reviewer:
                  approvingReviewer,
              },
              {
                id: "reviewer-b",
                model: "model-b",
                reviewer:
                  rejectingReviewer,
              },
            ],
          },
        );

      const factory =
        new SequentialFactory(
          planningWorkflow,
          implementationWorkflow,
          undefined,
          undefined,
          reviewWorkflow,
        );

      const planned =
        await factory.start(
          createTask(),
          repositoryRoot,
        );

      expect(
        planned.stopReason,
      ).toBe(
        "PLAN_APPROVAL_REQUIRED",
      );

      expect(
        planned.run.task.analysis
          ?.risk,
      ).toBe("medium");

      const result =
        await factory.resumeAfterPlanApproval(
          planned.run,
          repositoryRoot,
          "main",
        );

      expect(
        result.stopReason,
      ).toBe(
        "HUMAN_INPUT_REQUIRED",
      );

      expect(
        result.run.task.status,
      ).toBe("NEEDS_HUMAN");

      expect(
        result.run.multiModelReview,
      ).toBeDefined();

      expect(
        result.run.multiModelReview
          ?.executions,
      ).toHaveLength(2);

      expect(
        result.run.multiModelReview
          ?.disagreement.disagreed,
      ).toBe(true);

      expect(
        result.run.multiModelReview
          ?.disagreement.reasons,
      ).toContain("approval");

      expect(
        result.run.multiModelReview
          ?.escalation
          .requiresHumanInput,
      ).toBe(true);

      expect(
        result.run.multiModelReview
          ?.escalation.reasons,
      ).toContain(
        "material-model-disagreement",
      );

      expect(
        result.run.review?.approved,
      ).toBe(true);
    });
  },
);