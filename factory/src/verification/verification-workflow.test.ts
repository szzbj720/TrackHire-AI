import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import type {
  VerificationExecutor,
} from "./verification-executor.js";
import type {
  VerificationPlanner,
} from "./verification-planner.js";
import {
  VerificationWorkflow,
} from "./verification-workflow.js";

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

const passedValidation: ValidationResult = {
  passed: true,
  checks: [
    {
      name: "Flutter tests",
      command: "flutter",
      args: ["test"],
      exitCode: 0,
      stdout: "",
      stderr: "",
      durationMs: 10,
      passed: true,
    },
  ],
  failedChecks: [],
  durationMs: 10,
};

describe(
  "VerificationWorkflow",
  () => {
    it(
      "plans and executes independent verification after validation passes",
      async () => {
        const planner: VerificationPlanner = {
          async plan() {
            return {
              probes: [
                {
                  id: "whitespace-edge",
                  hypothesis:
                    "Whitespace-only input may still be accepted.",
                  rationale:
                    "Required-field validation changed.",
                  command: "flutter",
                  args: [
                    "test",
                    "test/whitespace_probe_test.dart",
                  ],
                  expectedOutcome:
                    "Whitespace-only input is rejected.",
                },
              ],
            };
          },
        };

        const verificationResult:
          VerificationResult = {
            passed: true,
            probes: [
              {
                probeId:
                  "whitespace-edge",
                command: "flutter",
                args: [
                  "test",
                  "test/whitespace_probe_test.dart",
                ],
                exitCode: 0,
                stdout: "passed",
                stderr: "",
                durationMs: 20,
                passed: true,
              },
            ],
            failedProbes: [],
            durationMs: 20,
          };

        const executor = {
          async execute() {
            return verificationResult;
          },
        } as unknown as VerificationExecutor;

        const workflow =
          new VerificationWorkflow(
            planner,
            executor,
          );

        const result =
          await workflow.run({
            task,
            validation:
              passedValidation,
            changedFiles: [
              {
                path:
                  "lib/screens/add_edit_job_screen.dart",
                content:
                  "changed code",
              },
            ],
            worktreePath:
              "/tmp/worktree",
          });

        expect(
          result.plan.probes,
        ).toHaveLength(1);

        expect(
          result.verification,
        ).toEqual(
          verificationResult,
        );
      },
    );

    it(
      "refuses to verify an implementation that failed deterministic validation",
      async () => {
        const planner = {
          async plan() {
            throw new Error(
              "should not run",
            );
          },
        } as VerificationPlanner;

        const executor = {
          async execute() {
            throw new Error(
              "should not run",
            );
          },
        } as unknown as VerificationExecutor;

        const workflow =
          new VerificationWorkflow(
            planner,
            executor,
          );

        await expect(
          workflow.run({
            task,
            validation: {
              ...passedValidation,
              passed: false,
              failedChecks: [
                "Flutter tests",
              ],
            },
            changedFiles: [],
            worktreePath:
              "/tmp/worktree",
          }),
        ).rejects.toThrow(
          "Cannot run independent verification after failed deterministic validation.",
        );
      },
    );
  },
);
