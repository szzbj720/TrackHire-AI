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

import {
  getGitDiffEvidence,
} from "./git-diff.js";

const execFileAsync =
  promisify(execFile);

async function createTemporaryRepository(): Promise<string> {
  const repositoryRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "factory-git-diff-test-",
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
      "tracked.txt",
    ),
    "original\n",
    "utf8",
  );

  await execFileAsync(
    "git",
    [
      "add",
      "tracked.txt",
    ],
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

  return repositoryRoot;
}

describe("getGitDiffEvidence", () => {
  it("captures uncommitted changes against HEAD", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    await writeFile(
      join(
        repositoryRoot,
        "tracked.txt",
      ),
      "modified\n",
      "utf8",
    );

    const evidence =
      await getGitDiffEvidence(
        repositoryRoot,
      );

    expect(
      evidence.changedFiles,
    ).toEqual([
      "tracked.txt",
    ]);

    expect(
      evidence.patch,
    ).toContain("modified");
  });

  it("captures committed changes against an earlier base ref", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const {
      stdout: baseCommit,
    } = await execFileAsync(
      "git",
      [
        "rev-parse",
        "HEAD",
      ],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
      },
    );

    await writeFile(
      join(
        repositoryRoot,
        "tracked.txt",
      ),
      "committed change\n",
      "utf8",
    );

    await execFileAsync(
      "git",
      [
        "add",
        "tracked.txt",
      ],
      {
        cwd: repositoryRoot,
      },
    );

    await execFileAsync(
      "git",
      [
        "commit",
        "-m",
        "Change tracked file",
      ],
      {
        cwd: repositoryRoot,
      },
    );

    const evidence =
      await getGitDiffEvidence(
        repositoryRoot,
        baseCommit.trim(),
      );

    expect(
      evidence.changedFiles,
    ).toEqual([
      "tracked.txt",
    ]);

    expect(
      evidence.patch,
    ).toContain(
      "committed change",
    );
  });

  it("does not report committed changes when using the default HEAD comparison", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    await writeFile(
      join(
        repositoryRoot,
        "tracked.txt",
      ),
      "committed change\n",
      "utf8",
    );

    await execFileAsync(
      "git",
      [
        "add",
        "tracked.txt",
      ],
      {
        cwd: repositoryRoot,
      },
    );

    await execFileAsync(
      "git",
      [
        "commit",
        "-m",
        "Change tracked file",
      ],
      {
        cwd: repositoryRoot,
      },
    );

    const evidence =
      await getGitDiffEvidence(
        repositoryRoot,
      );

    expect(
      evidence.changedFiles,
    ).toEqual([]);

    expect(
      evidence.patch,
    ).toBe("");
  });
});