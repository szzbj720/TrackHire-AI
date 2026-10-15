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

import {
  commitWorktreeChanges,
  cherryPickCommits,
} from "./git-integration.js";
import {
  createTaskWorktree,
} from "./git-worktree.js";

const execFileAsync = promisify(execFile);

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot = await mkdtemp(
    join(
      tmpdir(),
      "factory-git-integration-test-",
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
    "original\n",
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

describe("git integration", () => {
  it("commits changes from an isolated worker worktree", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktree =
      await createTaskWorktree({
        repositoryRoot,
        taskId: "worker-a",
        baseBranch: "main",
      });

    await writeFile(
      join(
        worktree.path,
        "worker-a.txt",
      ),
      "worker A\n",
      "utf8",
    );

    const commit =
      await commitWorktreeChanges({
        worktreePath: worktree.path,
        message:
          "factory: complete worker A",
      });

    expect(commit.hash).toMatch(
      /^[0-9a-f]{40}$/,
    );

    const { stdout } =
      await execFileAsync(
        "git",
        [
          "status",
          "--porcelain",
        ],
        {
          cwd: worktree.path,
        },
      );

    expect(stdout.trim()).toBe("");
  });

  it("rejects committing a worktree with no changes", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const worktree =
      await createTaskWorktree({
        repositoryRoot,
        taskId: "worker-empty",
        baseBranch: "main",
      });

    await expect(
      commitWorktreeChanges({
        worktreePath: worktree.path,
        message:
          "factory: empty worker",
      }),
    ).rejects.toThrow(
      "Cannot commit worktree because it contains no changes.",
    );
  });

  it("cherry-picks worker commits into an integration worktree", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const workerA =
      await createTaskWorktree({
        repositoryRoot,
        taskId: "worker-a",
        baseBranch: "main",
      });

    const workerB =
      await createTaskWorktree({
        repositoryRoot,
        taskId: "worker-b",
        baseBranch: "main",
      });

    const integration =
      await createTaskWorktree({
        repositoryRoot,
        taskId: "integration",
        baseBranch: "main",
      });

    await writeFile(
      join(
        workerA.path,
        "worker-a.txt",
      ),
      "worker A\n",
      "utf8",
    );

    await writeFile(
      join(
        workerB.path,
        "worker-b.txt",
      ),
      "worker B\n",
      "utf8",
    );

    const commitA =
      await commitWorktreeChanges({
        worktreePath: workerA.path,
        message:
          "factory: complete worker A",
      });

    const commitB =
      await commitWorktreeChanges({
        worktreePath: workerB.path,
        message:
          "factory: complete worker B",
      });

    await cherryPickCommits({
      repositoryPath:
        integration.path,
      commitHashes: [
        commitA.hash,
        commitB.hash,
      ],
    });

    expect(
      await readFile(
        join(
          integration.path,
          "worker-a.txt",
        ),
        "utf8",
      ),
    ).toBe("worker A\n");

    expect(
      await readFile(
        join(
          integration.path,
          "worker-b.txt",
        ),
        "utf8",
      ),
    ).toBe("worker B\n");
  });
});