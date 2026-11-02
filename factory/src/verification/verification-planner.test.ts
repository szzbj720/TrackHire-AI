import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  ModelProvider,
} from "../models/provider.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  ModelVerificationPlanner,
} from "./verification-planner.js";

class FakeModelProvider
  implements ModelProvider
{
  async generate() {
    return {
      content: JSON.stringify({
        probes: [
          {
            id: "whitespace-edge-case",
            hypothesis:
              "Whitespace-only input may bypass the changed validation.",
            rationale:
              "The task modifies required-field validation behavior.",
            command: "flutter",
            args: [
              "test",
              "test/whitespace_probe_test.dart",
            ],
            expectedOutcome:
              "Whitespace-only input is rejected.",
            requirement:
              "Reject whitespace-only required fields.",
          },
        ],
      }),
      model: "fake-model",
      usage: {
        inputTokens: 100,
        outputTokens: 50,
      },
    };
  }
}

const task = {
  id: "task-1",
  request:
    "Reject whitespace-only required fields.",
  requirements: [
    "Reject whitespace-only required fields.",
  ],
  acceptanceCriteria: [],
  constraints: [],
} as unknown as EngineeringTask;

describe(
  "ModelVerificationPlanner",
  () => {
    it(
      "creates targeted probes from independent analysis",
      async () => {
        const planner =
          new ModelVerificationPlanner(
            new FakeModelProvider(),
          );

        const result =
          await planner.plan({
            task,
            changedFiles: [
              {
                path:
                  "lib/screens/add_edit_job_screen.dart",
                content:
                  "final company = controller.text.trim();",
              },
            ],
          });

        expect(
          result.probes,
        ).toHaveLength(1);

        expect(
          result.probes[0]?.id,
        ).toBe(
          "whitespace-edge-case",
        );
      },
    );

    it(
      "rejects an empty probe plan",
      async () => {
        const provider: ModelProvider = {
          async generate() {
            return {
              content:
                JSON.stringify({
                  probes: [],
                }),
              model: "fake-model",
              usage: {
                inputTokens: 1,
                outputTokens: 1,
              },
            };
          },
        };

        const planner =
          new ModelVerificationPlanner(
            provider,
          );

        await expect(
          planner.plan({
            task,
            changedFiles: [],
          }),
        ).rejects.toThrow();
      },
    );
  },
);
