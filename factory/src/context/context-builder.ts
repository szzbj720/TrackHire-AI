import {
  dirname,
  join,
  normalize,
} from "node:path";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import {
  readRepositoryFile,
  type FileContent,
} from "./file-reader.js";

import {
  selectRelevantFiles,
  type RelevantFile,
} from "./file-selector.js";

import {
  scanRepository,
  type RepositorySnapshot,
} from "./repository.js";

import {
  summarizeRepository,
  type RepositorySummary,
} from "./repository-summary.js";

export interface RepositoryContext {
  snapshot: RepositorySnapshot;
  summary: RepositorySummary;
  relevantFiles: RelevantFile[];
  fileContents: FileContent[];
}

const DEFAULT_FILE_LIMIT =
  6;

const DEFAULT_CONTENT_BYTES_PER_FILE =
  2_000;

function normalizeRepositoryPath(
  path: string,
): string {
  return normalize(
    path,
  ).replaceAll(
    "\\",
    "/",
  );
}

function extractRelativeImports(
  path: string,
  content: string,
): string[] {
  const imports =
    new Set<string>();

  const dartImportPattern =
    /import\s+['"]([^'"]+)['"]/g;

  const moduleImportPattern =
    /(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g;

  let dartMatch:
    RegExpExecArray | null;

  while (
    (
      dartMatch =
        dartImportPattern.exec(
          content,
        )
    ) !== null
  ) {
    const importPath =
      dartMatch[1];

    if (!importPath) {
      continue;
    }

    if (
      importPath.startsWith(
        "package:",
      ) ||
      importPath.startsWith(
        "dart:",
      )
    ) {
      continue;
    }

    imports.add(
      normalizeRepositoryPath(
        join(
          dirname(
            path,
          ),
          importPath,
        ),
      ),
    );
  }

  let moduleMatch:
    RegExpExecArray | null;

  while (
    (
      moduleMatch =
        moduleImportPattern.exec(
          content,
        )
    ) !== null
  ) {
    const importPath =
      moduleMatch[1];

    if (!importPath) {
      continue;
    }

    imports.add(
      normalizeRepositoryPath(
        join(
          dirname(
            path,
          ),
          importPath,
        ),
      ),
    );
  }

  return [
    ...imports,
  ];
}

async function expandImportedFiles(
  repositoryRoot: string,
  snapshot: RepositorySnapshot,
  seedFiles: RelevantFile[],
  limit: number,
): Promise<RelevantFile[]> {
  const repositoryFiles =
    new Set(
      snapshot.files.map(
        (
          file,
        ) =>
          normalizeRepositoryPath(
            file.path,
          ),
      ),
    );

  const selected =
    new Map<
      string,
      RelevantFile
    >();

  const queue:
    RelevantFile[] = [];

  for (
    const file of seedFiles
  ) {
    const normalizedPath =
      normalizeRepositoryPath(
        file.path,
      );

    const normalizedFile:
      RelevantFile = {
        ...file,

        path:
          normalizedPath,
      };

    selected.set(
      normalizedPath,
      normalizedFile,
    );

    queue.push(
      normalizedFile,
    );
  }

  while (
    queue.length > 0 &&
    selected.size < limit
  ) {
    const current =
      queue.shift();

    if (!current) {
      break;
    }

    let content:
      FileContent;

    try {
      content =
        await readRepositoryFile(
          repositoryRoot,
          current.path,
          DEFAULT_CONTENT_BYTES_PER_FILE,
        );
    } catch {
      continue;
    }

    const importedPaths =
      extractRelativeImports(
        current.path,
        content.content,
      );

    for (
      const importedPath of importedPaths
    ) {
      if (
        selected.size >=
        limit
      ) {
        break;
      }

      if (
        !repositoryFiles.has(
          importedPath,
        )
      ) {
        continue;
      }

      if (
        selected.has(
          importedPath,
        )
      ) {
        continue;
      }

      const importedFile:
        RelevantFile = {
          path:
            importedPath,

          score:
            0,

          matchedTerms: [
            "import",
          ],
        };

      selected.set(
        importedPath,
        importedFile,
      );

      queue.push(
        importedFile,
      );
    }
  }

  return [
    ...selected.values(),
  ];
}

export async function buildRepositoryContext(
  task: EngineeringTask,
  repositoryRoot: string,
  fileLimit =
    DEFAULT_FILE_LIMIT,
  contentBytesPerFile =
    DEFAULT_CONTENT_BYTES_PER_FILE,
): Promise<RepositoryContext> {
  const snapshot =
    await scanRepository(
      repositoryRoot,
    );

  const summary =
    summarizeRepository(
      snapshot,
    );

  const seedLimit =
    Math.max(
      1,
      Math.min(
        3,
        fileLimit,
      ),
    );

  const initialFiles =
    selectRelevantFiles(
      task,
      snapshot,
      seedLimit,
    );

  const relevantFiles =
    await expandImportedFiles(
      repositoryRoot,
      snapshot,
      initialFiles,
      fileLimit,
    );

  const fileContents =
    await Promise.all(
      relevantFiles.map(
        (
          file,
        ) =>
          readRepositoryFile(
            repositoryRoot,
            file.path,
            contentBytesPerFile,
          ),
      ),
    );

  return {
    snapshot,
    summary,
    relevantFiles,
    fileContents,
  };
}