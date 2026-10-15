import type { EngineeringTask } from "../schemas/task.js";
import type { RepositorySnapshot } from "./repository.js";

export interface RelevantFile {
  path: string;
  score: number;
  matchedTerms: string[];
}

const stopWords = new Set([
  "a",
  "an",
  "and",
  "the",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "without",
  "can",
  "be",
  "as",
  "must",
  "continue",
  "existing",
  "work",
]);

function extractTerms(task: EngineeringTask): string[] {
  const text = [
    task.request,
    ...task.requirements,
    ...task.acceptanceCriteria,
    ...task.constraints,
  ]
    .join(" ")
    .toLowerCase();

  return [
    ...new Set(
      text
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 3)
        .filter((term) => !stopWords.has(term)),
    ),
  ];
}

function extractPathTerms(path: string): string[] {
  return path
    .replaceAll("\\", "/")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 0);
}

export function selectRelevantFiles(
  task: EngineeringTask,
  snapshot: RepositorySnapshot,
  limit = 20,
): RelevantFile[] {
  const taskTerms = extractTerms(task);

  return snapshot.files
    .map((file) => {
      const pathTerms = extractPathTerms(file.path);

      const matchedTerms = taskTerms.filter((taskTerm) =>
        pathTerms.some(
          (pathTerm) =>
            pathTerm === taskTerm ||
            pathTerm.startsWith(`${taskTerm}_`) ||
            pathTerm.endsWith(`_${taskTerm}`),
        ),
      );

      return {
        path: file.path,
        score: matchedTerms.length,
        matchedTerms,
      };
    })
    .filter((file) => file.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.path.localeCompare(b.path),
    )
    .slice(0, limit);
}