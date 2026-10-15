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

import type { WorkGraph } from "../schemas/work-graph.js";
import { createParallelWorktrees } from "./parallel-worktrees.js";

const execFileAsync = promisify(execFile);

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(
    join(
      tmpdir(),
      "factory-parallel-worktree-test-",
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
    join(repositoryRoot, "README.md"),
    "original repository\n",
    "utf8",
  );

  await execFileAsync(
    "git",
    ["add", "README.md"],
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

function createGraph(): WorkGraph {
  return {
    units: [
      {
        id: "model",
        description:
          "Update the domain model.",
        files: [
          "lib/models/job_application.dart",
        ],
        dependsOn: [],
      },
      {
        id: "backend",
        description:
          "Update the backend.",
        files: [
          "backend/example.ts",
        ],
        dependsOn: [],
      },
    ],
  };
}

describe("createParallelWorktrees", () => {
  it("creates one isolated worktree per work unit", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktrees =
      await createParallelWorktrees({
        repositoryRoot,
        taskId: "TH-100",
        baseBranch: "main",
        graph: createGraph(),
      });

    expect(worktrees).toHaveLength(2);

    expect(
      worktrees.map(
        (entry) => entry.unit.id,
      ),
    ).toEqual([
      "model",
      "backend",
    ]);

    expect(
      worktrees.map(
        (entry) => entry.worktree.branch,
      ),
    ).toEqual([
      "factory/th-100-model",
      "factory/th-100-backend",
    ]);
  });

  it("creates each worktree on its own branch", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktrees =
      await createParallelWorktrees({
        repositoryRoot,
        taskId: "TH-101",
        baseBranch: "main",
        graph: createGraph(),
      });

    for (const entry of worktrees) {
      const { stdout } =
        await execFileAsync(
          "git",
          [
            "branch",
            "--show-current",
          ],
          {
            cwd: entry.worktree.path,
          },
        );

      expect(stdout.trim()).toBe(
        entry.worktree.branch,
      );
    }
  });

  it("keeps changes isolated between parallel worktrees", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktrees =
      await createParallelWorktrees({
        repositoryRoot,
        taskId: "TH-102",
        baseBranch: "main",
        graph: createGraph(),
      });

    const modelWorktree =
      worktrees.find(
        (entry) =>
          entry.unit.id === "model",
      );

    const backendWorktree =
      worktrees.find(
        (entry) =>
          entry.unit.id === "backend",
      );

    expect(modelWorktree).toBeDefined();
    expect(backendWorktree).toBeDefined();

    if (
      !modelWorktree ||
      !backendWorktree
    ) {
      throw new Error(
        "Expected model and backend worktrees.",
      );
    }

    await writeFile(
      join(
        modelWorktree.worktree.path,
        "README.md",
      ),
      "changed by model worker\n",
      "utf8",
    );

    const modelReadme =
      await readFile(
        join(
          modelWorktree.worktree.path,
          "README.md",
        ),
        "utf8",
      );

    const backendReadme =
      await readFile(
        join(
          backendWorktree.worktree.path,
          "README.md",
        ),
        "utf8",
      );

    const originalReadme =
      await readFile(
        join(
          repositoryRoot,
          "README.md",
        ),
        "utf8",
      );

    expect(modelReadme).toBe(
      "changed by model worker\n",
    );

    expect(backendReadme).toBe(
      "original repository\n",
    );

    expect(originalReadme).toBe(
      "original repository\n",
    );
  });
});