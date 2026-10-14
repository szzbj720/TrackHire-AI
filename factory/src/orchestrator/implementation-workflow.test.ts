import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import type {
  Builder,
  BuilderInput,
} from "../agents/builder.js";
import type { ImplementationResult } from "../schemas/implementation.js";
import type { ImplementationPlan } from "../schemas/plan.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { ValidationResult } from "../schemas/validation.js";
import { Workspace } from "../tools/workspace.js";
import type { Validator } from "../validation/validator.js";
import { ImplementationWorkflow } from "./implementation-workflow.js";

const execFileAsync = promisify(execFile);

class FakeBuilder implements Builder {
  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    const workspace = new Workspace(
      input.worktreePath,
    );

    await workspace.write(
      "lib/models/job_application.dart",
      "class JobApplication {\n  DateTime? interviewDate;\n}\n",
    );

    return {
      summary: "Added interview date support.",
      changedFiles: [
        {
          path: "lib/models/job_application.dart",
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

class FakeValidator implements Validator {
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
}

function createPlan(): ImplementationPlan {
  return {
    summary: "Add interview date support.",
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
    status: "IMPLEMENTING",
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

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(
    join(tmpdir(), "factory-implementation-test-"),
  );

  await execFileAsync("git", ["init"], {
    cwd: repositoryRoot,
  });

  await execFileAsync(
    "git",
    ["config", "user.email", "factory@example.com"],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    ["config", "user.name", "Factory Test"],
    {
      cwd: repositoryRoot,
    },
  );

  const modelDirectory = join(
    repositoryRoot,
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
    "class JobApplication {}\n",
    "utf8",
  );

  await execFileAsync("git", ["add", "."], {
    cwd: repositoryRoot,
  });

  await execFileAsync(
    "git",
    ["commit", "-m", "Initial commit"],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    ["branch", "-M", "main"],
    {
      cwd: repositoryRoot,
    },
  );

  return repositoryRoot;
}

function createWorkflow(): ImplementationWorkflow {
  return new ImplementationWorkflow(
    new FakeBuilder(),
    new FakeValidator(),
  );
}

describe("ImplementationWorkflow", () => {
  it("implements and validates a task inside an isolated Git worktree", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const workflow = createWorkflow();

    const result = await workflow.run(
      createTask(),
      repositoryRoot,
      "main",
    );

    expect(result.worktree.branch).toBe(
      "factory/th-001",
    );

    const worktreeContent = await readFile(
      join(
        result.worktree.path,
        "lib",
        "models",
        "job_application.dart",
      ),
      "utf8",
    );

    expect(worktreeContent).toContain(
      "DateTime? interviewDate",
    );

    const originalContent = await readFile(
      join(
        repositoryRoot,
        "lib",
        "models",
        "job_application.dart",
      ),
      "utf8",
    );

    expect(originalContent).toBe(
      "class JobApplication {}\n",
    );

    expect(
      result.implementation.changedFiles,
    ).toHaveLength(1);

    expect(result.validation.passed).toBe(
      true,
    );

    expect(result.validation.checks).toHaveLength(
      1,
    );
  });

  it("rejects implementation before human approval", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const task = createTask();
    task.status = "AWAITING_PLAN_APPROVAL";

    const workflow = createWorkflow();

    await expect(
      workflow.run(
        task,
        repositoryRoot,
        "main",
      ),
    ).rejects.toThrow(
      "Cannot start implementation while task is in state AWAITING_PLAN_APPROVAL",
    );
  });

  it("rejects implementation without a plan", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const taskWithPlan = createTask();

    const { plan: _plan, ...task } =
      taskWithPlan;

    const workflow = createWorkflow();

    await expect(
      workflow.run(
        task,
        repositoryRoot,
        "main",
      ),
    ).rejects.toThrow(
      "Cannot start implementation without an approved plan.",
    );
  });

  it("rejects a plan that still requires human input", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const task = createTask();

    task.plan = {
      ...createPlan(),
      requiresHumanInput: true,
    };

    const workflow = createWorkflow();

    await expect(
      workflow.run(
        task,
        repositoryRoot,
        "main",
      ),
    ).rejects.toThrow(
      "Cannot implement a plan that still requires human input.",
    );
  });
});