import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CommitWorktreeOptions {
  worktreePath: string;
  message: string;
}

export interface WorktreeCommit {
  hash: string;
}

export interface CherryPickOptions {
  repositoryPath: string;
  commitHashes: string[];
}

export async function commitWorktreeChanges(
  options: CommitWorktreeOptions,
): Promise<WorktreeCommit> {
  await execFileAsync(
    "git",
    ["add", "-A"],
    {
      cwd: options.worktreePath,
    },
  );

  const { stdout: status } =
    await execFileAsync(
      "git",
      ["status", "--porcelain"],
      {
        cwd: options.worktreePath,
      },
    );

  if (!status.trim()) {
    throw new Error(
      "Cannot commit worktree because it contains no changes.",
    );
  }

  await execFileAsync(
    "git",
    [
      "commit",
      "-m",
      options.message,
    ],
    {
      cwd: options.worktreePath,
    },
  );

  const { stdout } =
    await execFileAsync(
      "git",
      ["rev-parse", "HEAD"],
      {
        cwd: options.worktreePath,
      },
    );

  return {
    hash: stdout.trim(),
  };
}

export async function cherryPickCommits(
  options: CherryPickOptions,
): Promise<void> {
  for (const hash of options.commitHashes) {
    try {
      await execFileAsync(
        "git",
        [
          "cherry-pick",
          hash,
        ],
        {
          cwd: options.repositoryPath,
        },
      );
    } catch (error) {
      await execFileAsync(
        "git",
        [
          "cherry-pick",
          "--abort",
        ],
        {
          cwd: options.repositoryPath,
        },
      ).catch(() => undefined);

      throw new Error(
        `Failed to integrate commit ${hash}.`,
        {
          cause: error,
        },
      );
    }
  }
}