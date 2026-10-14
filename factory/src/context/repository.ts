import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export interface RepositoryFile {
  path: string;
}

export interface RepositorySnapshot {
  root: string;
  files: RepositoryFile[];
}

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "build",
  ".dart_tool",
  ".idea",
]);

export async function scanRepository(
  root: string,
): Promise<RepositorySnapshot> {
  const files: RepositoryFile[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        ignoredDirectories.has(entry.name)
      ) {
        continue;
      }

      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        files.push({
          path: relative(root, absolutePath),
        });
      }
    }
  }

  await walk(root);

  return {
    root,
    files,
  };
}