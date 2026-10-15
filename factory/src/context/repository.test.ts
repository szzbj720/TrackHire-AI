import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { scanRepository } from "./repository.js";

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
    join(tmpdir(), "factory-repository-test-"),
  );

  temporaryDirectories.push(root);

  await mkdir(join(root, "lib"));
  await mkdir(join(root, "node_modules"));
  await mkdir(join(root, ".git"));

  await writeFile(
    join(root, "lib", "main.dart"),
    "void main() {}",
  );

  await writeFile(
    join(root, "README.md"),
    "# Test repository",
  );

  await writeFile(
    join(root, "node_modules", "ignored.js"),
    "ignored",
  );

  await writeFile(
    join(root, ".git", "config"),
    "ignored",
  );

  return root;
}

describe("scanRepository", () => {
  it("returns files from the repository", async () => {
    const root = await createTemporaryRepository();

    const snapshot = await scanRepository(root);

    expect(snapshot.files).toEqual(
      expect.arrayContaining([
        { path: "README.md" },
        { path: join("lib", "main.dart") },
      ]),
    );
  });

  it("ignores generated and internal directories", async () => {
    const root = await createTemporaryRepository();

    const snapshot = await scanRepository(root);

    const paths = snapshot.files.map((file) => file.path);

    expect(paths).not.toContain(
      join("node_modules", "ignored.js"),
    );

    expect(paths).not.toContain(
      join(".git", "config"),
    );
  });
});