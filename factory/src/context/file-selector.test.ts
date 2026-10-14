import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import type { RepositorySnapshot } from "./repository.js";
import { selectRelevantFiles } from "./file-selector.js";

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-001",
    request:
      "Add an optional interview date to an application and display upcoming interviews.",
    status: "TASK_CREATED",
    requirements: [
      "Store an interview date for an application.",
    ],
    acceptanceCriteria: [
      "Applications with interview dates can display as upcoming.",
    ],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("selectRelevantFiles", () => {
  it("ranks files whose paths match task terms", () => {
    const snapshot: RepositorySnapshot = {
      root: "/test/repository",
      files: [
        { path: "lib/models/application.dart" },
        { path: "lib/screens/application_detail.dart" },
        { path: "lib/screens/interview_screen.dart" },
        { path: "lib/utils/date_utils.dart" },
        { path: "lib/screens/settings.dart" },
      ],
    };

    const files = selectRelevantFiles(
      createTask(),
      snapshot,
    );

    expect(files.map((file) => file.path)).toEqual([
      "lib/models/application.dart",
      "lib/screens/application_detail.dart",
      "lib/screens/interview_screen.dart",
      "lib/utils/date_utils.dart",
    ]);

    expect(files[0]?.score).toBeGreaterThan(0);
    expect(files[0]?.matchedTerms).toContain(
      "application",
    );
  });

  it("respects the result limit", () => {
    const snapshot: RepositorySnapshot = {
      root: "/test/repository",
      files: [
        { path: "application_one.dart" },
        { path: "application_two.dart" },
        { path: "application_three.dart" },
      ],
    };

    const files = selectRelevantFiles(
      createTask(),
      snapshot,
      2,
    );

    expect(files).toHaveLength(2);
  });

  it("excludes unrelated files", () => {
    const snapshot: RepositorySnapshot = {
      root: "/test/repository",
      files: [
        { path: "lib/screens/settings.dart" },
        { path: "lib/theme/colors.dart" },
      ],
    };

    const files = selectRelevantFiles(
      createTask(),
      snapshot,
    );

    expect(files).toEqual([]);
  });
});