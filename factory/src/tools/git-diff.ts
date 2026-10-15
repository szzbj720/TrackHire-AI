import {
  execFile,
} from "node:child_process";
import {
  promisify,
} from "node:util";

const execFileAsync =
  promisify(execFile);

export interface GitDiffEvidence {
  changedFiles: string[];
  patch: string;
}

export async function getGitDiffEvidence(
  worktreePath: string,
  baseRef = "HEAD",
): Promise<GitDiffEvidence> {
  const [
    nameOnlyResult,
    patchResult,
  ] = await Promise.all([
    execFileAsync(
      "git",
      [
        "diff",
        "--name-only",
        "--no-ext-diff",
        baseRef,
      ],
      {
        cwd: worktreePath,
        encoding: "utf8",
      },
    ),
    execFileAsync(
      "git",
      [
        "diff",
        "--no-ext-diff",
        "--no-color",
        baseRef,
      ],
      {
        cwd: worktreePath,
        encoding: "utf8",
      },
    ),
  ]);

  const changedFiles =
    nameOnlyResult.stdout
      .split("\n")
      .map((file) => file.trim())
      .filter(
        (file) => file.length > 0,
      );

  return {
    changedFiles,
    patch: patchResult.stdout,
  };
}