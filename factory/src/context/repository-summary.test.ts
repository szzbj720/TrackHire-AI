import { describe, expect, it } from "vitest";

import type { RepositorySnapshot } from "./repository.js";
import { summarizeRepository } from "./repository-summary.js";

describe("summarizeRepository", () => {
  it("summarizes repository structure", () => {
    const snapshot: RepositorySnapshot = {
      root: "/test/repository",
      files: [
        { path: "README.md" },
        { path: "pubspec.yaml" },
        { path: "lib/main.dart" },
        { path: "lib/models/application.dart" },
        { path: "backend/package.json" },
        { path: "backend/src/server.ts" },
        { path: "factory/package.json" },
        { path: "factory/src/index.ts" },
        { path: "test/application_test.dart" },
      ],
    };

    const summary = summarizeRepository(snapshot);

    expect(summary.totalFiles).toBe(9);

    expect(summary.topLevelAreas).toEqual([
      "backend",
      "factory",
      "lib",
      "test",
    ]);

    expect(summary.fileExtensions).toEqual({
      ".md": 1,
      ".yaml": 1,
      ".dart": 3,
      ".json": 2,
      ".ts": 2,
    });

    expect(summary.importantFiles).toEqual([
      "README.md",
      "backend/package.json",
      "factory/package.json",
      "pubspec.yaml",
    ]);
  });
});