import type { RepositorySnapshot } from "./repository.js";

export interface RepositorySummary {
  totalFiles: number;
  topLevelAreas: string[];
  fileExtensions: Record<string, number>;
  importantFiles: string[];
}

const importantFileNames = new Set([
  "README.md",
  "pubspec.yaml",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
]);

export function summarizeRepository(
  snapshot: RepositorySnapshot,
): RepositorySummary {
  const topLevelAreas = new Set<string>();
  const fileExtensions: Record<string, number> = {};
  const importantFiles: string[] = [];

  for (const file of snapshot.files) {
    const normalizedPath = file.path.replaceAll("\\", "/");
    const parts = normalizedPath.split("/");

    if (parts.length > 1 && parts[0]) {
      topLevelAreas.add(parts[0]);
    }

    const fileName = parts.at(-1);

    if (fileName && importantFileNames.has(fileName)) {
      importantFiles.push(normalizedPath);
    }

    const dotIndex = fileName?.lastIndexOf(".") ?? -1;

    if (fileName && dotIndex > 0) {
      const extension = fileName.slice(dotIndex);

      fileExtensions[extension] =
        (fileExtensions[extension] ?? 0) + 1;
    }
  }

  return {
    totalFiles: snapshot.files.length,
    topLevelAreas: [...topLevelAreas].sort(),
    fileExtensions,
    importantFiles: importantFiles.sort(),
  };
}