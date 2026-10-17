import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import type {
  RepositorySnapshot,
} from "./repository.js";

import {
  selectRelevantFiles,
} from "./file-selector.js";

function createTask():
  EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id:
      "TH-001",

    request:
      "Add an optional interview date to job applications and display upcoming interviews.",

    status:
      "TASK_CREATED",

    requirements: [
      "Store an interview date for job applications.",
    ],

    acceptanceCriteria: [
      "Applications with interview dates can display as upcoming.",
    ],

    constraints:
      [],

    repairAttempts:
      0,

    createdAt:
      now,

    updatedAt:
      now,
  };
}

describe(
  "selectRelevantFiles",
  () => {
    it(
      "ranks files whose paths match task terms",
      () => {
        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "lib/models/application.dart",
              },
              {
                path:
                  "lib/screens/application_detail.dart",
              },
              {
                path:
                  "lib/screens/interview_screen.dart",
              },
              {
                path:
                  "lib/utils/date_utils.dart",
              },
              {
                path:
                  "lib/screens/settings.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            createTask(),
            snapshot,
          );

        expect(
          files.map(
            (
              file,
            ) =>
              file.path,
          ),
        ).toEqual([
          "lib/models/application.dart",
          "lib/screens/application_detail.dart",
          "lib/screens/interview_screen.dart",
          "lib/utils/date_utils.dart",
        ]);
      },
    );

    it(
      "matches plural task terms to singular file names",
      () => {
        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "lib/models/job_application.dart",
              },
              {
                path:
                  "lib/providers/application_provider.dart",
              },
              {
                path:
                  "lib/screens/add_edit_job_screen.dart",
              },
              {
                path:
                  "lib/screens/job_detail_screen.dart",
              },
              {
                path:
                  "lib/database/job_database.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            createTask(),
            snapshot,
          );

        expect(
          files.map(
            (
              file,
            ) =>
              file.path,
          ),
        ).toEqual(
          expect.arrayContaining([
            "lib/models/job_application.dart",
            "lib/providers/application_provider.dart",
            "lib/screens/add_edit_job_screen.dart",
            "lib/screens/job_detail_screen.dart",
            "lib/database/job_database.dart",
          ]),
        );
      },
    );

    it(
      "respects the result limit",
      () => {
        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "application_one.dart",
              },
              {
                path:
                  "application_two.dart",
              },
              {
                path:
                  "application_three.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            createTask(),
            snapshot,
            2,
          );

        expect(
          files,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      "excludes unrelated files",
      () => {
        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "lib/screens/settings.dart",
              },
              {
                path:
                  "lib/theme/colors.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            createTask(),
            snapshot,
          );

        expect(
          files,
        ).toEqual(
          [],
        );
      },
    );

    it(
      "prefers application files over factory benchmarks for app tasks",
      () => {
        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "factory/src/benchmarks/trackhire-interview-date.ts",
              },
              {
                path:
                  "lib/models/job_application.dart",
              },
              {
                path:
                  "lib/providers/application_provider.dart",
              },
              {
                path:
                  "lib/screens/interview_screen.dart",
              },
              {
                path:
                  "test/job_application_test.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            createTask(),
            snapshot,
          );

        expect(
          files.some(
            (
              file,
            ) =>
              file.path.startsWith(
                "factory/",
              ),
          ),
        ).toBe(
          false,
        );

        expect(
          files.map(
            (
              file,
            ) =>
              file.path,
          ),
        ).toContain(
          "lib/models/job_application.dart",
        );
      },
    );

    it(
      "still allows factory files for factory-specific tasks",
      () => {
        const now =
          new Date()
            .toISOString();

        const task:
          EngineeringTask = {
            id:
              "FACTORY-001",

            request:
              "Update the factory benchmark runtime.",

            status:
              "TASK_CREATED",

            requirements: [
              "Update the benchmark runtime.",
            ],

            acceptanceCriteria:
              [],

            constraints:
              [],

            repairAttempts:
              0,

            createdAt:
              now,

            updatedAt:
              now,
          };

        const snapshot:
          RepositorySnapshot = {
            root:
              "/test/repository",

            files: [
              {
                path:
                  "factory/src/benchmarks/runtime-benchmark.ts",
              },
              {
                path:
                  "lib/screens/settings.dart",
              },
            ],
          };

        const files =
          selectRelevantFiles(
            task,
            snapshot,
          );

        expect(
          files.map(
            (
              file,
            ) =>
              file.path,
          ),
        ).toContain(
          "factory/src/benchmarks/runtime-benchmark.ts",
        );
      },
    );
  },
);