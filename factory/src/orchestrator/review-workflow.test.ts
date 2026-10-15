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
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    ReviewWorkflow,
  } from "./review-workflow.js";
  
  const execFileAsync =
    promisify(execFile);
  
  class FakeReviewer implements Reviewer {
    calls = 0;
  
    constructor(
      private readonly result: ReviewResult,
    ) {}
  
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      this.calls += 1;
  
      return this.result;
    }
  }
  
  function createPlan(
    affectedFiles: string[] = [
      "lib/models/job_application.dart",
    ],
  ): ImplementationPlan {
    return {
      summary:
        "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: affectedFiles,
          rationale:
            "The model needs to store the interview date.",
        },
      ],
      affectedFiles,
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
  
  function createTask(
    affectedFiles?: string[],
  ): EngineeringTask {
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
      plan: createPlan(affectedFiles),
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createImplementation(
    changedFiles: string[] = [
      "lib/models/job_application.dart",
    ],
  ): ImplementationResult {
    return {
      summary:
        "Added interview date support.",
      changedFiles:
        changedFiles.map((path) => ({
          path,
          changeType:
            "modified" as const,
          summary:
            `Modified ${path}.`,
        })),
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
  
  async function createTemporaryGitRepository():
    Promise<string> {
    const repositoryPath =
      await mkdtemp(
        join(
          tmpdir(),
          "factory-review-workflow-test-",
        ),
      );
  
    const modelDirectory = join(
      repositoryPath,
      "lib",
      "models",
    );
  
    const providerDirectory = join(
      repositoryPath,
      "lib",
      "providers",
    );
  
    await mkdir(modelDirectory, {
      recursive: true,
    });
  
    await mkdir(providerDirectory, {
      recursive: true,
    });
  
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
  
    await writeFile(
      join(
        providerDirectory,
        "application_provider.dart",
      ),
      "class ApplicationProvider {}\n",
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
  
    return repositoryPath;
  }
  
  async function modifyApprovedFile(
    repositoryPath: string,
  ): Promise<void> {
    await writeFile(
      join(
        repositoryPath,
        "lib",
        "models",
        "job_application.dart",
      ),
      "class JobApplication {\n  final DateTime? interviewDate;\n}\n",
      "utf8",
    );
  }
  
  describe("ReviewWorkflow", () => {
    it("routes clean evidence and a high-confidence approval to AWAITING_FINAL_APPROVAL", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      const reviewer =
        new FakeReviewer(
          createReview(),
        );
  
      const workflow =
        new ReviewWorkflow(reviewer);
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(
        result.changeEvidence
          .withinApprovedScope,
      ).toBe(true);
  
      expect(
        result.changeEvidence
          .reportMatchesObserved,
      ).toBe(true);
  
      expect(result.review).toBeDefined();
  
      expect(
        result.review?.approved,
      ).toBe(true);
  
      expect(result.task.status).toBe(
        "AWAITING_FINAL_APPROVAL",
      );
  
      expect(reviewer.calls).toBe(1);
    });
  
    it("routes a rejected review to NEEDS_HUMAN", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      const reviewer =
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
        );
  
      const workflow =
        new ReviewWorkflow(reviewer);
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(result.review).toBeDefined();
  
      expect(
        result.review?.approved,
      ).toBe(false);
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(reviewer.calls).toBe(1);
    });
  
    it("routes a low-confidence approval to NEEDS_HUMAN", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      const reviewer =
        new FakeReviewer(
          createReview({
            confidence: 0.4,
          }),
        );
  
      const workflow =
        new ReviewWorkflow(
          reviewer,
          0.7,
        );
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(result.review).toBeDefined();
  
      expect(
        result.review?.confidence,
      ).toBe(0.4);
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(reviewer.calls).toBe(1);
    });
  
    it("routes a review requiring human input to NEEDS_HUMAN", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      const reviewer =
        new FakeReviewer(
          createReview({
            requiresHumanInput: true,
          }),
        );
  
      const workflow =
        new ReviewWorkflow(reviewer);
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(result.review).toBeDefined();
  
      expect(
        result.review
          ?.requiresHumanInput,
      ).toBe(true);
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(reviewer.calls).toBe(1);
    });
  
    it("blocks unapproved Git changes before calling the reviewer", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      await writeFile(
        join(
          repositoryPath,
          "lib",
          "providers",
          "application_provider.dart",
        ),
        "class ApplicationProvider {\n  bool unexpectedChange = true;\n}\n",
        "utf8",
      );
  
      const reviewer =
        new FakeReviewer(
          createReview(),
        );
  
      const workflow =
        new ReviewWorkflow(reviewer);
  
      const result = await workflow.run({
        task: createTask(),
        implementation:
          createImplementation(),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(
        result.changeEvidence
          .withinApprovedScope,
      ).toBe(false);
  
      expect(
        result.changeEvidence
          .unapprovedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(
        result.changeEvidence
          .unreportedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(result.review).toBeUndefined();
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(reviewer.calls).toBe(0);
    });
  
    it("blocks an inaccurate agent change report before calling the reviewer", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await modifyApprovedFile(
        repositoryPath,
      );
  
      const reviewer =
        new FakeReviewer(
          createReview(),
        );
  
      const workflow =
        new ReviewWorkflow(reviewer);
  
      const result = await workflow.run({
        task: createTask([
          "lib/models/job_application.dart",
          "lib/providers/application_provider.dart",
        ]),
        implementation:
          createImplementation([
            "lib/models/job_application.dart",
            "lib/providers/application_provider.dart",
          ]),
        validation:
          createValidation(),
        worktreePath:
          repositoryPath,
      });
  
      expect(
        result.changeEvidence
          .withinApprovedScope,
      ).toBe(true);
  
      expect(
        result.changeEvidence
          .reportMatchesObserved,
      ).toBe(false);
  
      expect(
        result.changeEvidence
          .missingReportedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(result.review).toBeUndefined();
  
      expect(result.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(reviewer.calls).toBe(0);
    });
  });