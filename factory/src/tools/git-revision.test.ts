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
    resolveGitRevision,
  } from "./git-revision.js";
  
  const execFileAsync =
    promisify(execFile);
  
  async function createTemporaryRepository(): Promise<string> {
    const repositoryRoot =
      await mkdtemp(
        join(
          tmpdir(),
          "factory-git-revision-test-",
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
        "README.md",
      ),
      "initial\n",
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
  
  describe("resolveGitRevision", () => {
    it("resolves a branch to an immutable commit SHA", async () => {
      const repositoryRoot =
        await createTemporaryRepository();
  
      const revision =
        await resolveGitRevision(
          repositoryRoot,
          "main",
        );
  
      expect(revision).toMatch(
        /^[0-9a-f]{40}$/,
      );
  
      const { stdout } =
        await execFileAsync(
          "git",
          [
            "rev-parse",
            "main",
          ],
          {
            cwd: repositoryRoot,
            encoding: "utf8",
          },
        );
  
      expect(revision).toBe(
        stdout.trim(),
      );
    });
  
    it("rejects an unknown revision", async () => {
      const repositoryRoot =
        await createTemporaryRepository();
  
      await expect(
        resolveGitRevision(
          repositoryRoot,
          "missing-branch",
        ),
      ).rejects.toThrow();
    });
  });