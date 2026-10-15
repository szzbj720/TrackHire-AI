import { execFile } from "node:child_process";
import {
  mkdtemp,
  readFile,
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
  Builder,
  BuilderInput,
} from "../agents/builder.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  WorkGraph,
} from "../schemas/work-graph.js";
import {
  ParallelExecutionWorkflow,
} from "./parallel-execution-workflow.js";
import {
  ParallelWorker,
} from "./parallel-worker.js";

const execFileAsync = promisify(execFile);

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(
    join(
      tmpdir(),
      "factory-parallel-execution-test-",
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
    join(repositoryRoot, "model.txt"),
    "base model\n",
    "utf8",
  );

  await writeFile(
    join(repositoryRoot, "backend.txt"),
    "base backend\n",
    "utf8",
  );

  await writeFile(
    join(repositoryRoot, "ui.txt"),
    "base ui\n",
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

function createPlan(): ImplementationPlan {
  return {
    summary: "Implement parallel feature.",
    steps: [
      {
        order: 1,
        description: "Update model.",
        files: ["model.txt"],
        rationale: "Model change.",
      },
      {
        order: 2,
        description: "Update backend.",
        files: ["backend.txt"],
        rationale: "Backend change.",
      },
      {
        order: 3,
        description: "Update UI.",
        files: ["ui.txt"],
        rationale: "UI depends on earlier work.",
      },
    ],
    affectedFiles: [
      "model.txt",
      "backend.txt",
      "ui.txt",
    ],
    validationSteps: [
      "Run validation.",
    ],
    risks: [],
    assumptions: [],
    requiresHumanInput: false,
  };
}

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-MULTIWAVE-001",
    request: "Implement parallel feature.",
    status:
      "AWAITING_PARALLEL_APPROVAL",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    plan: createPlan(),
    strategy: {
      mode: "parallel",
      reasoning:
        "The task contains independent work.",
    },
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createGraph(): WorkGraph {
  return {
    units: [
      {
        id: "model",
        description: "Update model.",
        files: ["model.txt"],
        dependsOn: [],
      },
      {
        id: "backend",
        description: "Update backend.",
        files: ["backend.txt"],
        dependsOn: [],
      },
      {
        id: "ui",
        description: "Update UI.",
        files: ["ui.txt"],
        dependsOn: [
          "model",
          "backend",
        ],
      },
    ],
  };
}

class FileWritingBuilder implements Builder {
  readonly inputs: BuilderInput[] = [];

  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    this.inputs.push(input);

    const path =
      input.plan.affectedFiles[0];

    if (!path) {
      throw new Error(
        "Expected an assigned file.",
      );
    }

    if (path === "ui.txt") {
      const model = await readFile(
        join(
          input.worktreePath,
          "model.txt",
        ),
        "utf8",
      );

      const backend = await readFile(
        join(
          input.worktreePath,
          "backend.txt",
        ),
        "utf8",
      );

      expect(model).toBe(
        "implemented model\n",
      );

      expect(backend).toBe(
        "implemented backend\n",
      );
    }

    await writeFile(
      join(
        input.worktreePath,
        path,
      ),
      `implemented ${path.replace(".txt", "")}\n`,
      "utf8",
    );

    return {
      summary: `Implemented ${path}.`,
      changedFiles: [
        {
          path,
          changeType: "modified",
          summary: `Updated ${path}.`,
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
}

describe("ParallelExecutionWorkflow", () => {
  it("executes dependency waves and integrates their changes", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const builder =
      new FileWritingBuilder();

    const workflow =
      new ParallelExecutionWorkflow(
        new ParallelWorker(builder),
      );

    const result =
      await workflow.run({
        task: createTask(),
        graph: createGraph(),
        repositoryRoot,
        baseBranch: "main",
      });

    expect(result.task.status).toBe(
      "VALIDATING",
    );

    expect(
      result.workerResults.map(
        (workerResult) =>
          workerResult.unit.id,
      ),
    ).toEqual([
      "model",
      "backend",
      "ui",
    ]);

    expect(
      await readFile(
        join(
          result.integrationWorktree.path,
          "model.txt",
        ),
        "utf8",
      ),
    ).toBe("implemented model\n");

    expect(
      await readFile(
        join(
          result.integrationWorktree.path,
          "backend.txt",
        ),
        "utf8",
      ),
    ).toBe("implemented backend\n");

    expect(
      await readFile(
        join(
          result.integrationWorktree.path,
          "ui.txt",
        ),
        "utf8",
      ),
    ).toBe("implemented ui\n");
  });

  it("does not modify the original checkout", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const workflow =
      new ParallelExecutionWorkflow(
        new ParallelWorker(
          new FileWritingBuilder(),
        ),
      );

    await workflow.run({
      task: createTask(),
      graph: createGraph(),
      repositoryRoot,
      baseBranch: "main",
    });

    expect(
      await readFile(
        join(
          repositoryRoot,
          "model.txt",
        ),
        "utf8",
      ),
    ).toBe("base model\n");

    expect(
      await readFile(
        join(
          repositoryRoot,
          "backend.txt",
        ),
        "utf8",
      ),
    ).toBe("base backend\n");

    expect(
      await readFile(
        join(
          repositoryRoot,
          "ui.txt",
        ),
        "utf8",
      ),
    ).toBe("base ui\n");
  });

  it("refuses to execute before parallel approval", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const task = createTask();

    task.status =
      "AWAITING_PLAN_APPROVAL";

    const workflow =
      new ParallelExecutionWorkflow(
        new ParallelWorker(
          new FileWritingBuilder(),
        ),
      );

    await expect(
      workflow.run({
        task,
        graph: createGraph(),
        repositoryRoot,
        baseBranch: "main",
      }),
    ).rejects.toThrow(
      "Cannot execute parallel work while task is in state AWAITING_PLAN_APPROVAL.",
    );
  });
});