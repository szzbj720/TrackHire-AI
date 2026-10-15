import type { EngineeringTask } from "../schemas/task.js";
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

export async function buildRepositoryContext(
  task: EngineeringTask,
  repositoryRoot: string,
  fileLimit = 10,
): Promise<RepositoryContext> {
  const snapshot = await scanRepository(repositoryRoot);
  const summary = summarizeRepository(snapshot);

  const relevantFiles = selectRelevantFiles(
    task,
    snapshot,
    fileLimit,
  );

  const fileContents = await Promise.all(
    relevantFiles.map((file) =>
      readRepositoryFile(
        repositoryRoot,
        file.path,
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