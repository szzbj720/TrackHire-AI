import { execFile } from "node:child_process";
import {
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { createTaskWorktree } from "./git-worktree.js";

const execFileAsync = promisify(execFile);

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(
    join(tmpdir(), "factory-worktree-test-"),
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

  await writeFile(
    join(repositoryRoot, "README.md"),
    "original repository\n",
    "utf8",
  );

  await execFileAsync("git", ["add", "README.md"], {
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

describe("createTaskWorktree", () => {
  it("creates an isolated worktree on a task branch", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktree = await createTaskWorktree({
      repositoryRoot,
      taskId: "TH-001",
      baseBranch: "main",
    });

    expect(worktree.branch).toBe("factory/th-001");

    const { stdout } = await execFileAsync(
      "git",
      ["branch", "--show-current"],
      {
        cwd: worktree.path,
      },
    );

    expect(stdout.trim()).toBe("factory/th-001");

    const readme = await readFile(
      join(worktree.path, "README.md"),
      "utf8",
    );

    expect(readme).toBe("original repository\n");
  });

  it("keeps worktree changes isolated from the original checkout", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktree = await createTaskWorktree({
      repositoryRoot,
      taskId: "TH-002",
      baseBranch: "main",
    });

    await writeFile(
      join(worktree.path, "README.md"),
      "changed inside worktree\n",
      "utf8",
    );

    const originalReadme = await readFile(
      join(repositoryRoot, "README.md"),
      "utf8",
    );

    const worktreeReadme = await readFile(
      join(worktree.path, "README.md"),
      "utf8",
    );

    expect(originalReadme).toBe(
      "original repository\n",
    );

    expect(worktreeReadme).toBe(
      "changed inside worktree\n",
    );
  });

  it("rejects an empty task ID", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    await expect(
      createTaskWorktree({
        repositoryRoot,
        taskId: "   ",
        baseBranch: "main",
      }),
    ).rejects.toThrow(
      "Cannot create worktree for an empty task ID.",
    );
  });
});