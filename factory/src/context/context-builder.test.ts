import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import {
  buildRepositoryContext,
} from "./context-builder.js";

const temporaryDirectories:
  string[] = [];

afterEach(
  async () => {
    await Promise.all(
      temporaryDirectories.map(
        (
          directory,
        ) =>
          rm(
            directory,
            {
              recursive:
                true,

              force:
                true,
            },
          ),
      ),
    );

    temporaryDirectories.length =
      0;
  },
);

async function createTemporaryRepository():
  Promise<string> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "factory-context-test-",
      ),
    );

  temporaryDirectories.push(
    root,
  );

  await mkdir(
    join(
      root,
      "lib",
      "models",
    ),
    {
      recursive:
        true,
    },
  );

  await mkdir(
    join(
      root,
      "lib",
      "providers",
    ),
    {
      recursive:
        true,
    },
  );

  await mkdir(
    join(
      root,
      "lib",
      "database",
    ),
    {
      recursive:
        true,
    },
  );

  await mkdir(
    join(
      root,
      "lib",
      "screens",
    ),
    {
      recursive:
        true,
    },
  );

  await writeFile(
    join(
      root,
      "README.md",
    ),
    "# Test repository",
  );

  await writeFile(
    join(
      root,
      "lib",
      "models",
      "application.dart",
    ),
    "class Application {}",
  );

  await writeFile(
    join(
      root,
      "lib",
      "screens",
      "settings.dart",
    ),
    "class SettingsScreen {}",
  );

  return root;
}

function createTask():
  EngineeringTask {
  const now =
    new Date()
      .toISOString();

  return {
    id:
      "TH-001",

    request:
      "Add an optional interview date to an application.",

    status:
      "TASK_CREATED",

    requirements: [
      "Store an interview date for an application.",
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
}

describe(
  "buildRepositoryContext",
  () => {
    it(
      "builds bounded task-aware repository context",
      async () => {
        const root =
          await createTemporaryRepository();

        const context =
          await buildRepositoryContext(
            createTask(),
            root,
            5,
          );

        expect(
          context.summary.totalFiles,
        ).toBe(
          3,
        );

        expect(
          context.summary.topLevelAreas,
        ).toEqual([
          "lib",
        ]);

        expect(
          context.relevantFiles.map(
            (
              file,
            ) =>
              file.path,
          ),
        ).toEqual([
          join(
            "lib",
            "models",
            "application.dart",
          ),
        ]);

        expect(
          context.fileContents,
        ).toHaveLength(
          1,
        );

        expect(
          context.fileContents[0]
            ?.content,
        ).toBe(
          "class Application {}",
        );
      },
    );

    it(
      "expands repository context through relative imports",
      async () => {
        const root =
          await createTemporaryRepository();

        await writeFile(
          join(
            root,
            "lib",
            "screens",
            "application_screen.dart",
          ),
          [
            "import '../models/application.dart';",
            "import '../providers/application_provider.dart';",
            "import 'job_detail_screen.dart';",
            "",
            "class ApplicationScreen {}",
          ].join(
            "\n",
          ),
        );

        await writeFile(
          join(
            root,
            "lib",
            "providers",
            "application_provider.dart",
          ),
          [
            "import '../database/job_database.dart';",
            "",
            "class ApplicationProvider {}",
          ].join(
            "\n",
          ),
        );

        await writeFile(
          join(
            root,
            "lib",
            "database",
            "job_database.dart",
          ),
          "class JobDatabase {}",
        );

        await writeFile(
          join(
            root,
            "lib",
            "screens",
            "job_detail_screen.dart",
          ),
          "class JobDetailScreen {}",
        );

        const now =
          new Date()
            .toISOString();

        const task:
          EngineeringTask = {
            id:
              "TH-IMPORTS",

            request:
              "Update the application screen.",

            status:
              "TASK_CREATED",

            requirements: [
              "Update the application screen.",
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

        const context =
          await buildRepositoryContext(
            task,
            root,
            10,
          );

        const paths =
          context.relevantFiles.map(
            (
              file,
            ) =>
              file.path.replaceAll(
                "\\",
                "/",
              ),
          );

        expect(
          paths,
        ).toEqual(
          expect.arrayContaining([
            "lib/screens/application_screen.dart",
            "lib/models/application.dart",
            "lib/providers/application_provider.dart",
            "lib/screens/job_detail_screen.dart",
            "lib/database/job_database.dart",
          ]),
        );

        expect(
          context.fileContents.map(
            (
              file,
            ) =>
              file.path.replaceAll(
                "\\",
                "/",
              ),
          ),
        ).toEqual(
          expect.arrayContaining([
            "lib/screens/application_screen.dart",
            "lib/models/application.dart",
            "lib/providers/application_provider.dart",
            "lib/screens/job_detail_screen.dart",
            "lib/database/job_database.dart",
          ]),
        );
      },
    );

    it(
      "respects the context file limit while expanding imports",
      async () => {
        const root =
          await createTemporaryRepository();

        await writeFile(
          join(
            root,
            "lib",
            "screens",
            "application_screen.dart",
          ),
          [
            "import '../models/application.dart';",
            "import '../providers/application_provider.dart';",
            "import 'job_detail_screen.dart';",
            "",
            "class ApplicationScreen {}",
          ].join(
            "\n",
          ),
        );

        await writeFile(
          join(
            root,
            "lib",
            "providers",
            "application_provider.dart",
          ),
          "class ApplicationProvider {}",
        );

        await writeFile(
          join(
            root,
            "lib",
            "screens",
            "job_detail_screen.dart",
          ),
          "class JobDetailScreen {}",
        );

        const now =
          new Date()
            .toISOString();

        const task:
          EngineeringTask = {
            id:
              "TH-LIMIT",

            request:
              "Update the application screen.",

            status:
              "TASK_CREATED",

            requirements: [
              "Update the application screen.",
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

        const context =
          await buildRepositoryContext(
            task,
            root,
            2,
          );

        expect(
          context.relevantFiles.length,
        ).toBeLessThanOrEqual(
          2,
        );

        expect(
          context.fileContents.length,
        ).toBeLessThanOrEqual(
          2,
        );
      },
    );
  },
);