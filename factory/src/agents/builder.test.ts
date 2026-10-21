import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
} from "../models/provider.js";

import type {
  ImplementationPlan,
} from "../schemas/plan.js";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import {
  ModelBuilder,
} from "./builder.js";

class FakeProvider
  implements ModelProvider {
  public readonly requests:
    ModelRequest[] = [];

  constructor(
    private readonly response:
      string,
  ) {}

  async generate(
    request: ModelRequest,
  ): Promise<ModelResponse> {
    this.requests.push(
      request,
    );

    return {
      content:
        this.response,

      model:
        "fake-builder",
    };
  }
}

function createTask():
  EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id:
      "TH-001",

    request:
      "Add an optional interview date to a TrackHire application.",

    status:
      "IMPLEMENTING",

    requirements: [
      "Interview date must be optional.",
    ],

    acceptanceCriteria: [
      "Existing applications continue to work.",
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

function createPlan():
  ImplementationPlan {
  return {
    summary:
      "Add interview date support.",

    steps: [
      {
        order:
          1,

        description:
          "Update the application model.",

        files: [
          "lib/models/job_application.dart",
        ],

        rationale:
          "The model needs to store the interview date.",
      },
    ],

    affectedFiles: [
      "lib/models/job_application.dart",
    ],

    validationSteps: [
      "Run flutter analyze.",
      "Run flutter test.",
    ],

    risks:
      [],

    assumptions: [
      "Interview date is optional.",
    ],

    requiresHumanInput:
      false,
  };
}

async function createWorktree():
  Promise<string> {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        "factory-builder-test-",
      ),
    );

  const modelDirectory =
    join(
      root,
      "lib",
      "models",
    );

  await mkdir(
    modelDirectory,
    {
      recursive:
        true,
    },
  );

  await writeFile(
    join(
      modelDirectory,
      "job_application.dart",
    ),
    "class JobApplication {}\n",
    "utf8",
  );

  return root;
}

describe(
  "ModelBuilder",
  () => {
    it(
      "writes plain source returned by the model into the approved file",
      async () => {
        const worktreePath =
          await createWorktree();

        const replacement =
          [
            "class JobApplication {",
            "  DateTime? interviewDate;",
            "}",
            "",
          ].join(
            "\n",
          );

        const provider =
          new FakeProvider(
            replacement,
          );

        const builder =
          new ModelBuilder(
            provider,
          );

        const result =
          await builder.implement({
            task:
              createTask(),

            plan:
              createPlan(),

            worktreePath,
          });

        const content =
          await readFile(
            join(
              worktreePath,
              "lib",
              "models",
              "job_application.dart",
            ),
            "utf8",
          );

        expect(
          content,
        ).toContain(
          "DateTime? interviewDate",
        );

        expect(
          result.changedFiles,
        ).toEqual([
          {
            path:
              "lib/models/job_application.dart",

            changeType:
              "modified",

            summary:
              "Update the application model.",
          },
        ]);

        expect(
          result.requiresHumanInput,
        ).toBe(
          false,
        );

        expect(
          provider.requests,
        ).toHaveLength(
          1,
        );

        expect(
          provider.requests[0]
            ?.responseSchema,
        ).toBeUndefined();

        expect(
          provider.requests[0]
            ?.userPrompt,
        ).toContain(
          "ORIGINAL COMPLETE SOURCE FILE:",
        );
      },
    );

    it(
      "strips a markdown source fence before writing",
      async () => {
        const worktreePath =
          await createWorktree();

        const provider =
          new FakeProvider(
            [
              "```dart",
              "class JobApplication {",
              "  DateTime? interviewDate;",
              "}",
              "```",
            ].join(
              "\n",
            ),
          );

        const builder =
          new ModelBuilder(
            provider,
          );

        await builder.implement({
          task:
            createTask(),

          plan:
            createPlan(),

          worktreePath,
        });

        const content =
          await readFile(
            join(
              worktreePath,
              "lib",
              "models",
              "job_application.dart",
            ),
            "utf8",
          );

        expect(
          content,
        ).toBe(
          [
            "class JobApplication {",
            "  DateTime? interviewDate;",
            "}",
            "",
          ].join(
            "\n",
          ),
        );
      },
    );

    it(
      "rejects a plan step that references a file outside the approved plan",
      async () => {
        const worktreePath =
          await createWorktree();

        const plan =
          createPlan();

        plan.steps[0] = {
          order:
            1,

          description:
            "Modify an unapproved file.",

          files: [
            "lib/unapproved.dart",
          ],

          rationale:
            "Test scope enforcement.",
        };

        const provider =
          new FakeProvider(
            "class BadChange {}\n",
          );

        const builder =
          new ModelBuilder(
            provider,
          );

        await expect(
          builder.implement({
            task:
              createTask(),

            plan,

            worktreePath,
          }),
        ).rejects.toThrow(
          "Builder attempted to modify an unapproved file: lib/unapproved.dart",
        );

        expect(
          provider.requests,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      "rejects JSON instead of source code",
      async () => {
        const worktreePath =
          await createWorktree();

        const originalContent =
          await readFile(
            join(
              worktreePath,
              "lib",
              "models",
              "job_application.dart",
            ),
            "utf8",
          );

        const provider =
          new FakeProvider(
            JSON.stringify({
              writes: [
                {
                  path:
                    "lib/models/job_application.dart",

                  content:
                    "class JobApplication {}",
                },
              ],
            }),
          );

        const builder =
          new ModelBuilder(
            provider,
          );

        await expect(
          builder.implement({
            task:
              createTask(),

            plan:
              createPlan(),

            worktreePath,
          }),
        ).rejects.toThrow(
          "Builder returned JSON instead of source code for lib/models/job_application.dart.",
        );

        const finalContent =
          await readFile(
            join(
              worktreePath,
              "lib",
              "models",
              "job_application.dart",
            ),
            "utf8",
          );

        expect(
          finalContent,
        ).toBe(
          originalContent,
        );
      },
    );

    it(
      "rejects a suspiciously small replacement before writing",
      async () => {
        const worktreePath =
          await createWorktree();

        const path =
          join(
            worktreePath,
            "lib",
            "models",
            "job_application.dart",
          );

        const original =
          [
            "class JobApplication {",
            "  final String company;",
            "  final String position;",
            "  final String status;",
            "  final String notes;",
            "  final DateTime createdAt;",
            "}",
            "",
          ].join(
            "\n",
          );

        await writeFile(
          path,
          original,
          "utf8",
        );

        const provider =
          new FakeProvider(
            "class JobApplication {}\n",
          );

        const builder =
          new ModelBuilder(
            provider,
          );

        await expect(
          builder.implement({
            task:
              createTask(),

            plan:
              createPlan(),

            worktreePath,
          }),
        ).rejects.toThrow(
          "Builder produced a suspiciously small replacement for lib/models/job_application.dart.",
        );

        expect(
          await readFile(
            path,
            "utf8",
          ),
        ).toBe(
          original,
        );
      },
    );
  },
);