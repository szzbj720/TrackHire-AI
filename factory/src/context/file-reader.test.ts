import {
    mkdtemp,
    mkdir,
    rm,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import { readRepositoryFile } from "./file-reader.js";
  
  const temporaryDirectories: string[] = [];
  
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) =>
        rm(directory, {
          recursive: true,
          force: true,
        }),
      ),
    );
  
    temporaryDirectories.length = 0;
  });
  
  async function createTemporaryRepository(): Promise<string> {
    const root = await mkdtemp(
      join(tmpdir(), "factory-file-reader-test-"),
    );
  
    temporaryDirectories.push(root);
  
    await mkdir(join(root, "lib"));
  
    await writeFile(
      join(root, "lib", "application.dart"),
      "class Application {}",
    );
  
    return root;
  }
  
  describe("readRepositoryFile", () => {
    it("reads a file inside the repository", async () => {
      const root = await createTemporaryRepository();
  
      const result = await readRepositoryFile(
        root,
        join("lib", "application.dart"),
      );
  
      expect(result.path).toBe(
        join("lib", "application.dart"),
      );
      expect(result.content).toBe(
        "class Application {}",
      );
      expect(result.truncated).toBe(false);
    });
  
    it("truncates files that exceed the size limit", async () => {
      const root = await createTemporaryRepository();
  
      await writeFile(
        join(root, "large.txt"),
        "abcdefghij",
      );
  
      const result = await readRepositoryFile(
        root,
        "large.txt",
        5,
      );
  
      expect(result.content).toBe("abcde");
      expect(result.truncated).toBe(true);
    });
  
    it("rejects paths outside the repository", async () => {
      const root = await createTemporaryRepository();
  
      await expect(
        readRepositoryFile(
          root,
          "../outside.txt",
        ),
      ).rejects.toThrow("File is outside repository");
    });
  });