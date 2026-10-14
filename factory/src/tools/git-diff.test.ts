import {
    mkdtemp,
    readFile,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  import {
    execFile,
  } from "node:child_process";
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
  
  async function createTemporaryGitRepository():
    Promise<string> {
    const repositoryPath =
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
        cwd: repositoryPath,
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
        cwd: repositoryPath,
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
        cwd: repositoryPath,
      },
    );
  
    await writeFile(
      join(
        repositoryPath,
        "changed.txt",
      ),
      "before\n",
      "utf8",
    );
  
    await writeFile(
      join(
        repositoryPath,
        "unchanged.txt",
      ),
      "unchanged\n",
      "utf8",
    );
  
    await execFileAsync(
      "git",
      ["add", "."],
      {
        cwd: repositoryPath,
      },
    );
  
    await execFileAsync(
      "git",
      [
        "commit",
        "-m",
        "initial commit",
      ],
      {
        cwd: repositoryPath,
      },
    );
  
    return repositoryPath;
  }
  
  describe("getGitDiffEvidence", () => {
    it("captures actual modified files and patch evidence", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      await writeFile(
        join(
          repositoryPath,
          "changed.txt",
        ),
        "after\n",
        "utf8",
      );
  
      const evidence =
        await getGitDiffEvidence(
          repositoryPath,
        );
  
      expect(
        evidence.changedFiles,
      ).toEqual([
        "changed.txt",
      ]);
  
      expect(evidence.patch).toContain(
        "changed.txt",
      );
  
      expect(evidence.patch).toContain(
        "-before",
      );
  
      expect(evidence.patch).toContain(
        "+after",
      );
  
      expect(evidence.patch).not.toContain(
        "unchanged.txt",
      );
    });
  
    it("returns empty evidence when the repository has no changes", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      const evidence =
        await getGitDiffEvidence(
          repositoryPath,
        );
  
      expect(
        evidence.changedFiles,
      ).toEqual([]);
  
      expect(evidence.patch).toBe("");
    });
  
    it("does not change repository contents while inspecting the diff", async () => {
      const repositoryPath =
        await createTemporaryGitRepository();
  
      const changedFilePath = join(
        repositoryPath,
        "changed.txt",
      );
  
      await writeFile(
        changedFilePath,
        "after\n",
        "utf8",
      );
  
      await getGitDiffEvidence(
        repositoryPath,
      );
  
      const content = await readFile(
        changedFilePath,
        "utf8",
      );
  
      expect(content).toBe(
        "after\n",
      );
    });
  });