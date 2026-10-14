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
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    ReviewWorkflow,
  } from "./review-workflow.js";
  
  class FakeReviewer implements Reviewer {
    constructor(
      private readonly result: ReviewResult,
    ) {}
  
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      return this.result;
    }
  }
  
  function createPlan(): ImplementationPlan {
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
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to a TrackHire application.",
      status: "REVIEWING",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
      constraints: [],
      repairAttempts: 0,
      plan: createPlan(),
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
            "Added optional interviewDate.",
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
          stdout: "All tests passed.",
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
        "The implementation satisfies the approved task.",
      findings: [],
      requirementCoverage: [
        {
          requirement:
            "Interview date must be optional.",
          satisfied: true,
          evidence: [
            "JobApplication.interviewDate is nullable.",
          ],
        },
      ],
      requiresHumanInput: false,
      confidence: 0.9,
      ...overrides,
    };
  }
  
  async function createTemporaryWorkspace():
    Promise<string> {
    const workspaceRoot = await mkdtemp(
      join(
        tmpdir(),
        "factory-review-workflow-test-",
      ),
    );
  
    const modelDirectory = join(
      workspaceRoot,
      "lib",
      "models",
    );
  
    await mkdir(modelDirectory, {
      recursive: true,
    });
  
    await writeFile(
      join(
        modelDirectory,
        "job_application.dart",
      ),
      "class JobApplication {\n  final DateTime? interviewDate;\n}\n",
      "utf8",
    );
  
    return workspaceRoot;
  }
  
  describe("ReviewWorkflow", () => {
    it("routes a high-confidence approval to AWAITING_FINAL_APPROVAL", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new ReviewWorkflow(
          new FakeReviewer(
            createReview(),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath: workspacePath,
      });
  
      expect(result.review.approved).toBe(
        true,
      );
  
      expect(result.task.status).toBe(
        "AWAITING_FINAL_APPROVAL",
      );
    });
  
    it("routes a rejected review to NEEDS_HUMAN", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new ReviewWorkflow(
          new FakeReviewer(
            createReview({
              approved: false,
              summary:
                "A regression risk was found.",
              findings: [
                {
                  severity: "HIGH",
                  summary:
                    "Existing behavior may have changed.",
                  evidence: [
                    "Constructor behavior differs from the previous implementation.",
                  ],
                  files: [
                    "lib/models/job_application.dart",
                  ],
                  recommendation:
                    "Preserve backwards compatibility.",
                },
              ],
              confidence: 0.9,
            }),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath: workspacePath,
      });
  
      expect(result.review.approved).toBe(
        false,
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
    });
  
    it("routes a low-confidence approval to NEEDS_HUMAN", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new ReviewWorkflow(
          new FakeReviewer(
            createReview({
              confidence: 0.4,
            }),
          ),
          0.7,
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath: workspacePath,
      });
  
      expect(result.review.approved).toBe(
        true,
      );
  
      expect(result.review.confidence).toBe(
        0.4,
      );
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
    });
  
    it("routes a review requiring human input to NEEDS_HUMAN", async () => {
      const workspacePath =
        await createTemporaryWorkspace();
  
      const workflow =
        new ReviewWorkflow(
          new FakeReviewer(
            createReview({
              requiresHumanInput: true,
            }),
          ),
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath: workspacePath,
      });
  
      expect(
        result.review.requiresHumanInput,
      ).toBe(true);
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
    });
  });