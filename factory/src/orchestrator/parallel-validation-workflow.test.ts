import {
    execFile,
  } from "node:child_process";
  import {
    mkdtemp,
    writeFile,
  } from "node:fs/promises";
  import {
    tmpdir,
  } from "node:os";
  import {
    join,
  } from "node:path";
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
    ReviewResult,
  } from "../schemas/review.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    resolveGitRevision,
  } from "../tools/git-revision.js";
  import {
    createTaskWorktree,
  } from "../tools/git-worktree.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import type {
    ParallelExecutionResult,
  } from "./parallel-execution-workflow.js";
  import {
    ParallelValidationWorkflow,
  } from "./parallel-validation-workflow.js";
  import {
    ReviewWorkflow,
  } from "./review-workflow.js";
  
  const execFileAsync =
    promisify(execFile);
  
  async function createExecution(): Promise<ParallelExecutionResult> {
    const repositoryRoot =
      await mkdtemp(
        join(
          tmpdir(),
          "factory-parallel-validation-",
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
  
    await writeFile(
      join(
        repositoryRoot,
        "model.txt",
      ),
      "base\n",
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
  
    const baseCommit =
      await resolveGitRevision(
        repositoryRoot,
        "main",
      );
  
    const integrationWorktree =
      await createTaskWorktree({
        repositoryRoot,
        taskId:
          "parallel-validation-integration",
        baseBranch: baseCommit,
      });
  
    await writeFile(
      join(
        integrationWorktree.path,
        "model.txt",
      ),
      "implemented\n",
      "utf8",
    );
  
    await execFileAsync(
      "git",
      [
        "add",
        "model.txt",
      ],
      {
        cwd: integrationWorktree.path,
      },
    );
  
    await execFileAsync(
      "git",
      [
        "commit",
        "-m",
        "Implement model",
      ],
      {
        cwd: integrationWorktree.path,
      },
    );
  
    const now =
      new Date().toISOString();
  
    return {
      task: {
        id: "TH-PARALLEL-VALIDATION",
        request: "Update model.",
        status: "VALIDATING",
        requirements: [],
        acceptanceCriteria: [],
        constraints: [],
        strategy: {
          mode: "parallel",
          reasoning:
            "Parallel execution selected.",
        },
        plan: {
          summary: "Update model.",
          steps: [
            {
              order: 1,
              description:
                "Update model.",
              files: [
                "model.txt",
              ],
              rationale:
                "Required change.",
            },
          ],
          affectedFiles: [
            "model.txt",
          ],
          validationSteps: [
            "Validate.",
          ],
          risks: [],
          assumptions: [],
          requiresHumanInput: false,
        },
        repairAttempts: 0,
        createdAt: now,
        updatedAt: now,
      },
      baseCommit,
      integrationWorktree,
      workerResults: [
        {
          unit: {
            id: "model",
            description:
              "Update model.",
            files: [
              "model.txt",
            ],
            dependsOn: [],
          },
          implementation: {
            summary:
              "Updated model.",
            changedFiles: [
              {
                path:
                  "model.txt",
                changeType:
                  "modified",
                summary:
                  "Updated model.",
              },
            ],
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          },
        },
      ],
    };
  }
  
  class PassingValidator
    implements Validator
  {
    async validate(): Promise<ValidationResult> {
      return {
        passed: true,
        checks: [],
        failedChecks: [],
        durationMs: 1,
      };
    }
  }
  
  class FailingValidator
    implements Validator
  {
    async validate(): Promise<ValidationResult> {
      return {
        passed: false,
        checks: [],
        failedChecks: [
          "test",
        ],
        durationMs: 1,
      };
    }
  }
  
  class ApprovingReviewer
    implements Reviewer
  {
    async review(
      _input: ReviewerInput,
    ): Promise<ReviewResult> {
      return {
        approved: true,
        summary:
          "Implementation is correct.",
        findings: [],
        requirementCoverage: [],
        requiresHumanInput: false,
        confidence: 0.95,
      };
    }
  }
  
  describe(
    "ParallelValidationWorkflow",
    () => {
      it("validates and reviews the integrated parallel implementation", async () => {
        const execution =
          await createExecution();
  
        const workflow =
          new ParallelValidationWorkflow(
            new PassingValidator(),
            new ReviewWorkflow(
              new ApprovingReviewer(),
            ),
          );
  
        const result =
          await workflow.run(
            execution,
          );
  
        expect(
          result.task.status,
        ).toBe(
          "AWAITING_FINAL_APPROVAL",
        );
  
        expect(
          result.validation.passed,
        ).toBe(true);
  
        expect(
          result.implementation
            .changedFiles,
        ).toEqual([
          {
            path:
              "model.txt",
            changeType:
              "modified",
            summary:
              "Updated model.",
          },
        ]);
  
        expect(
          result.review
            ?.changeEvidence
            .observedFiles,
        ).toEqual([
          "model.txt",
        ]);
  
        expect(
          result.review
            ?.changeEvidence
            .reportMatchesObserved,
        ).toBe(true);
      });
  
      it("moves to diagnosis when deterministic validation fails", async () => {
        const execution =
          await createExecution();
  
        const workflow =
          new ParallelValidationWorkflow(
            new FailingValidator(),
            new ReviewWorkflow(
              new ApprovingReviewer(),
            ),
          );
  
        const result =
          await workflow.run(
            execution,
          );
  
        expect(
          result.task.status,
        ).toBe(
          "DIAGNOSING_FAILURE",
        );
  
        expect(
          result.validation.passed,
        ).toBe(false);
  
        expect(
          result.review,
        ).toBeUndefined();
      });
  
      it("aggregates implementation evidence from parallel workers", async () => {
        const execution =
          await createExecution();
  
        execution.workerResults.push({
          unit: {
            id: "backend",
            description:
              "Update backend.",
            files: [],
            dependsOn: [],
          },
          implementation: {
            summary:
              "Backend work.",
            changedFiles: [],
            commandsRun: [
              "backend check",
            ],
            assumptions: [
              "backend assumption",
            ],
            warnings: [
              "backend warning",
            ],
            requiresHumanInput: false,
          },
        });
  
        const workflow =
          new ParallelValidationWorkflow(
            new PassingValidator(),
            new ReviewWorkflow(
              new ApprovingReviewer(),
            ),
          );
  
        const result =
          await workflow.run(
            execution,
          );
  
        expect(
          result.implementation
            .commandsRun,
        ).toContain(
          "backend check",
        );
  
        expect(
          result.implementation
            .assumptions,
        ).toContain(
          "backend assumption",
        );
  
        expect(
          result.implementation
            .warnings,
        ).toContain(
          "backend warning",
        );
      });
    },
  );