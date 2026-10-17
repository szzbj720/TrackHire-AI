import type {
  EngineeringTask,
} from "../schemas/task.js";

import type {
  RepositorySnapshot,
} from "./repository.js";

export interface RelevantFile {
  path: string;
  score: number;
  matchedTerms: string[];
}

const stopWords =
  new Set([
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

const factoryTaskTerms =
  new Set([
    "factory",
    "benchmark",
    "orchestrator",
    "agent",
    "agents",
    "runtime",
    "provider",
  ]);

function normalizeTerm(
  term: string,
): string {
  if (
    term.endsWith("ies") &&
    term.length > 4
  ) {
    return `${term.slice(
      0,
      -3,
    )}y`;
  }

  if (
    term.endsWith("s") &&
    !term.endsWith("ss") &&
    term.length > 3
  ) {
    return term.slice(
      0,
      -1,
    );
  }

  return term;
}

function extractTerms(
  task: EngineeringTask,
): string[] {
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
        .split(
          /[^a-z0-9]+/,
        )
        .filter(
          (term) =>
            term.length >= 3,
        )
        .filter(
          (term) =>
            !stopWords.has(
              term,
            ),
        )
        .map(
          normalizeTerm,
        ),
    ),
  ];
}

function extractPathTerms(
  path: string,
): string[] {
  return path
    .replaceAll(
      "\\",
      "/",
    )
    .toLowerCase()
    .split(
      /[^a-z0-9]+/,
    )
    .filter(
      (term) =>
        term.length > 0,
    )
    .map(
      normalizeTerm,
    );
}

function isFactoryTask(
  taskTerms: string[],
): boolean {
  return taskTerms.some(
    (term) =>
      factoryTaskTerms.has(
        term,
      ),
  );
}

function termsMatch(
  taskTerm: string,
  pathTerm: string,
): boolean {
  return (
    pathTerm ===
      taskTerm ||
    pathTerm.startsWith(
      `${taskTerm}_`,
    ) ||
    pathTerm.endsWith(
      `_${taskTerm}`,
    )
  );
}

function pathAdjustment(
  path: string,
  factoryTask: boolean,
): number {
  const normalized =
    path
      .replaceAll(
        "\\",
        "/",
      )
      .toLowerCase();

  let adjustment = 0;

  if (
    normalized.startsWith(
      "lib/",
    )
  ) {
    adjustment += 6;
  }

  if (
    normalized.startsWith(
      "test/",
    )
  ) {
    adjustment += 4;
  }

  if (
    normalized.startsWith(
      "src/",
    )
  ) {
    adjustment += 3;
  }

  if (
    !factoryTask &&
    normalized.startsWith(
      "factory/",
    )
  ) {
    adjustment -= 25;
  }

  if (
    !factoryTask &&
    (
      normalized.includes(
        "/benchmarks/",
      ) ||
      normalized.includes(
        "/fixtures/",
      )
    )
  ) {
    adjustment -= 15;
  }

  if (
    normalized.includes(
      "/build/",
    ) ||
    normalized.startsWith(
      "build/",
    ) ||
    normalized.includes(
      "/generated/",
    )
  ) {
    adjustment -= 30;
  }

  return adjustment;
}

export function selectRelevantFiles(
  task: EngineeringTask,
  snapshot: RepositorySnapshot,
  limit = 20,
): RelevantFile[] {
  const taskTerms =
    extractTerms(
      task,
    );

  const factoryTask =
    isFactoryTask(
      taskTerms,
    );

  return snapshot.files
    .map(
      (
        file,
      ) => {
        const pathTerms =
          extractPathTerms(
            file.path,
          );

        const matchedTerms =
          taskTerms.filter(
            (
              taskTerm,
            ) =>
              pathTerms.some(
                (
                  pathTerm,
                ) =>
                  termsMatch(
                    taskTerm,
                    pathTerm,
                  ),
              ),
          );

        const score =
          matchedTerms.length *
            10 +
          pathAdjustment(
            file.path,
            factoryTask,
          );

        return {
          path:
            file.path,

          score,

          matchedTerms,
        };
      },
    )
    .filter(
      (
        file,
      ) =>
        file.matchedTerms
          .length > 0 &&
        file.score > 0,
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.score -
          a.score ||
        a.path.localeCompare(
          b.path,
        ),
    )
    .slice(
      0,
      limit,
    );
}