import { readFile, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";

export interface FileContent {
  path: string;
  content: string;
  truncated: boolean;
}

const DEFAULT_MAX_BYTES = 50_000;

export async function readRepositoryFile(
  repositoryRoot: string,
  filePath: string,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<FileContent> {
  const root = resolve(repositoryRoot);
  const absolutePath = resolve(root, filePath);
  const relativePath = relative(root, absolutePath);

  if (
    relativePath.startsWith("..") ||
    relativePath === "" ||
    relativePath.startsWith("/")
  ) {
    throw new Error(
      `File is outside repository: ${filePath}`,
    );
  }

  const fileStats = await stat(absolutePath);

  if (!fileStats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  const buffer = await readFile(absolutePath);

  const truncated = buffer.length > maxBytes;
  const content = buffer
    .subarray(0, maxBytes)
    .toString("utf8");

  return {
    path: relativePath,
    content,
    truncated,
  };
}