import {
    mkdir,
    mkdtemp,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  import {
    execFile,
  } from "node:child_process";
  import {
    promisify,
  } from "node:util";
  
  import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Reviewer,
    ReviewerInput,
  } from "../agents/reviewer.js";
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
    TaskRisk,
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    ReviewWorkflow,
  } from "./review-workflow.js";
  
  const execFileAsync =
    promisify(execFile);
  
  class FakeReviewer
    implements Reviewer
  {
    calls = 0;
  
    constructor(
      private readonly result:
        ReviewResult,
    ) {}
  
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      this.calls += 1;
      return this.result;
    }
  }
  
  class FailingReviewer
    implements Reviewer
  {
    calls = 0;
  
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      this.calls += 1;
  
      throw new Error(
        "Independent reviewer unavailable",
      );
    }
  }
  
  function createPlan():
    ImplementationPlan {
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
            "Store the optional interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run flutter test.",
      ],
      risks: [],
      assumptions: [
        "Interview date is optional.",
      ],
      requiresHumanInput: false,
    };
  }
  
  function createTask(
    risk: TaskRisk,
  ): EngineeringTask {
    const now =
      new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date.",
      status: "REVIEWING",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
      constraints: [],
      analysis: {
        complexity:
          risk === "high"
            ? "high"
            : "medium",
        risk,
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
      },
      plan: createPlan(),
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createImplementation():
    ImplementationResult {
    return {
      summary:
        "Added interview date support.",
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interview date.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createValidation():
    ValidationResult {
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
  
  function createReview(
    overrides: Partial<ReviewResult> = {},
  ): ReviewResult {
    return {
      approved: true,
      summary:
        "The implementation is approved.",
      findings: [],
      requirementCoverage: [
        {
          requirement:
            "Interview date must be optional.",
          satisfied: true,
          evidence: [
            "The field is nullable.",
          ],
        },
      ],
      requiresHumanInput: false,
      confidence: 0.9,
      ...overrides,
    };
  }
  
  async function createRepository():
    Promise<string> {
    const repositoryPath =
      await mkdtemp(
        join(
          tmpdir(),
          "factory-multi-model-review-",
        ),
      );
  
    const modelDirectory =
      join(
        repositoryPath,
        "lib",
        "models",
      );
  
    await mkdir(
      modelDirectory,
      {
        recursive: true,
      },
    );
  
    await execFileAsync(
      "git",
      ["init"],
      {
        cwd: repositoryPath,
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
        cwd: repositoryPath,
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
        cwd: repositoryPath,
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
        cwd: repositoryPath,
      },
    );
  
    await execFileAsync(
      "git",
      [
        "commit",
        "-m",
        "initial commit",
      ],
      {
        cwd: repositoryPath,
      },
    );
  
    await writeFile(
      join(
        modelDirectory,
        "job_application.dart",
      ),
      [
        "class JobApplication {",
        "  final DateTime? interviewDate;",
        "}",
        "",
      ].join("\n"),
      "utf8",
    );
  
    return repositoryPath;
  }
  
  describe(
    "ReviewWorkflow multi-model review",
    () => {
      it("allows medium-risk work to continue when independent reviewers agree", async () => {
        const repositoryPath =
          await createRepository();
  
        const fallbackReviewer =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerA =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerB =
          new FakeReviewer(
            createReview({
              confidence: 0.85,
            }),
          );
  
        const workflow =
          new ReviewWorkflow(
            fallbackReviewer,
            0.7,
            {
              targets: [
                {
                  id: "reviewer-a",
                  model: "model-a",
                  reviewer: reviewerA,
                },
                {
                  id: "reviewer-b",
                  model: "model-b",
                  reviewer: reviewerB,
                },
              ],
            },
          );
  
        const result =
          await workflow.run({
            task:
              createTask("medium"),
            implementation:
              createImplementation(),
            validation:
              createValidation(),
            worktreePath:
              repositoryPath,
          });
  
        expect(
          result.task.status,
        ).toBe(
          "AWAITING_FINAL_APPROVAL",
        );
  
        expect(
          result.multiModelReview,
        ).toBeDefined();
  
        expect(
          result.multiModelReview
            ?.disagreement.disagreed,
        ).toBe(false);
  
        expect(
          reviewerA.calls,
        ).toBe(1);
  
        expect(
          reviewerB.calls,
        ).toBe(1);
  
        expect(
          fallbackReviewer.calls,
        ).toBe(0);
      });
  
      it("escalates high-risk work when independent reviewers disagree", async () => {
        const repositoryPath =
          await createRepository();
  
        const reviewerA =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerB =
          new FakeReviewer(
            createReview({
              approved: false,
              summary:
                "The implementation has a regression risk.",
            }),
          );
  
        const workflow =
          new ReviewWorkflow(
            reviewerA,
            0.7,
            {
              targets: [
                {
                  id: "reviewer-a",
                  model: "model-a",
                  reviewer: reviewerA,
                },
                {
                  id: "reviewer-b",
                  model: "model-b",
                  reviewer: reviewerB,
                },
              ],
            },
          );
  
        const result =
          await workflow.run({
            task:
              createTask("high"),
            implementation:
              createImplementation(),
            validation:
              createValidation(),
            worktreePath:
              repositoryPath,
          });
  
        expect(
          result.task.status,
        ).toBe("NEEDS_HUMAN");
  
        expect(
          result.multiModelReview
            ?.disagreement.disagreed,
        ).toBe(true);
  
        expect(
          result.multiModelReview
            ?.escalation.reasons,
        ).toContain(
          "material-model-disagreement",
        );
      });
  
      it("escalates when required independent review evidence is missing", async () => {
        const repositoryPath =
          await createRepository();
  
        const reviewerA =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerB =
          new FailingReviewer();
  
        const workflow =
          new ReviewWorkflow(
            reviewerA,
            0.7,
            {
              targets: [
                {
                  id: "reviewer-a",
                  model: "model-a",
                  reviewer: reviewerA,
                },
                {
                  id: "reviewer-b",
                  model: "model-b",
                  reviewer: reviewerB,
                },
              ],
            },
          );
  
        const result =
          await workflow.run({
            task:
              createTask("high"),
            implementation:
              createImplementation(),
            validation:
              createValidation(),
            worktreePath:
              repositoryPath,
          });
  
        expect(
          result.task.status,
        ).toBe("NEEDS_HUMAN");
  
        expect(
          result.multiModelReview
            ?.executions,
        ).toHaveLength(2);
  
        expect(
          result.multiModelReview
            ?.executions[1],
        ).toEqual({
          targetId: "reviewer-b",
          model: "model-b",
          status: "error",
          error:
            "Independent reviewer unavailable",
        });
      });
  
      it("keeps low-risk work on the existing single-review path", async () => {
        const repositoryPath =
          await createRepository();
  
        const fallbackReviewer =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerA =
          new FakeReviewer(
            createReview(),
          );
  
        const reviewerB =
          new FakeReviewer(
            createReview(),
          );
  
        const workflow =
          new ReviewWorkflow(
            fallbackReviewer,
            0.7,
            {
              targets: [
                {
                  id: "reviewer-a",
                  model: "model-a",
                  reviewer: reviewerA,
                },
                {
                  id: "reviewer-b",
                  model: "model-b",
                  reviewer: reviewerB,
                },
              ],
            },
          );
  
        const task =
          createTask("medium");
  
        if (!task.analysis) {
          throw new Error(
            "Expected task analysis.",
          );
        }
  
        task.analysis.risk = "low";
  
        const result =
          await workflow.run({
            task,
            implementation:
              createImplementation(),
            validation:
              createValidation(),
            worktreePath:
              repositoryPath,
          });
  
        expect(
          result.task.status,
        ).toBe(
          "AWAITING_FINAL_APPROVAL",
        );
  
        expect(
          result.multiModelReview,
        ).toBeUndefined();
  
        expect(
          fallbackReviewer.calls,
        ).toBe(1);
  
        expect(
          reviewerA.calls,
        ).toBe(0);
  
        expect(
          reviewerB.calls,
        ).toBe(0);
      });
    },
  );