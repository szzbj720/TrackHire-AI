import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface Worktree {
  path: string;
  branch: string;
}

export interface WorktreeOptions {
  repositoryRoot: string;
  taskId: string;
  baseBranch: string;
}

function sanitizeTaskId(taskId: string): string {
  return taskId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeRepositoryName(
  repositoryRoot: string,
): string {
  return basename(repositoryRoot)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTaskWorktree(
  options: WorktreeOptions,
): Promise<Worktree> {
  const taskName = sanitizeTaskId(options.taskId);

  if (!taskName) {
    throw new Error(
      "Cannot create worktree for an empty task ID.",
    );
  }

  const repositoryName =
    sanitizeRepositoryName(options.repositoryRoot);

  if (!repositoryName) {
    throw new Error(
      "Cannot determine repository name.",
    );
  }

  const branch = `factory/${taskName}`;

  const worktreePath = resolve(
    options.repositoryRoot,
    "..",
    ".factory-worktrees",
    repositoryName,
    taskName,
  );

  await mkdir(dirname(worktreePath), {
    recursive: true,
  });

  await execFileAsync(
    "git",
    [
      "worktree",
      "add",
      "-b",
      branch,
      worktreePath,
      options.baseBranch,
    ],
    {
      cwd: options.repositoryRoot,
    },
  );

  return {
    path: worktreePath,
    branch,
  };
}