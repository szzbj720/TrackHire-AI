import { mkdtemp, mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
        let discoveredTests: string[] = [];
        const planner: VerificationPlanner = {
          async plan(input) {
            discoveredTests = input.availableTestFiles ?? [];
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

        const worktreePath = await mkdtemp(join(tmpdir(), "verification-workflow-"));
        await mkdir(join(worktreePath, "test"));
        await writeFile(join(worktreePath, "test/whitespace_probe_test.dart"), "void main() {}");

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
            worktreePath,
          });

        expect(discoveredTests).toContain("test/whitespace_probe_test.dart");

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

    it("rejects an invented test file before execution", async () => {
      const worktreePath = await mkdtemp(join(tmpdir(), "verification-missing-"));
      let executed = false;
      const planner: VerificationPlanner = {
        async plan() {
          return {
            probes: [{
              id: "invented",
              hypothesis: "A regression may exist.",
              rationale: "Check a targeted test.",
              command: "flutter",
              args: ["test", "test/does_not_exist_test.dart"],
              expectedOutcome: "Pass",
            }],
          };
        },
      };
      const executor = {
        async execute() {
          executed = true;
          throw new Error("must not execute");
        },
      } as unknown as VerificationExecutor;
      await expect(new VerificationWorkflow(planner, executor).run({
        task,
        validation: passedValidation,
        changedFiles: [],
        worktreePath,
      })).rejects.toThrow("This is a verification-plan error, not an implementation failure.");
      expect(executed).toBe(false);
    });

    it("runs and removes the held-out Flutter fixture using a set-style provider method", async () => {
      const worktreePath = await mkdtemp(join(tmpdir(), "verification-case-search-"));
      await mkdir(join(worktreePath, "lib/providers"), { recursive: true });
      await mkdir(join(worktreePath, "test"), { recursive: true });
      await writeFile(
        join(worktreePath, "lib/providers/application_provider.dart"),
        "class ApplicationProvider { void setCaseSensitiveSearchEnabled(bool value) {} }",
      );
      const taskWithToggle = {
        ...task,
        request: "Add a case-sensitive search toggle to application search.",
      };
      const planner = {
        async plan() {
          return {
            probes: [{
              id: "existing",
              hypothesis: "Check existing behavior.",
              rationale: "Existing validation.",
              command: "flutter",
              args: ["test"],
              expectedOutcome: "Pass",
            }],
          };
        },
      } as VerificationPlanner;
      let fixtureText = "";
      const executor = {
        async execute(probes: Array<{ id: string }>) {
          if (probes[0]?.id === "case-sensitive-search-behavior") {
            fixtureText = await readFile(
              join(worktreePath, "test/factory_case_sensitive_search_test.dart"),
              "utf8",
            );
          }
          return {
            passed: true,
            probes: probes.map((probe) => ({
              probeId: probe.id,
              command: "flutter",
              args: ["test"],
              exitCode: 0,
              stdout: "",
              stderr: "",
              durationMs: 1,
              passed: true,
            })),
            failedProbes: [],
            durationMs: 1,
          };
        },
      } as unknown as VerificationExecutor;
      const result = await new VerificationWorkflow(planner, executor).run({
        task: taskWithToggle,
        validation: passedValidation,
        changedFiles: [],
        worktreePath,
      });
      expect(result.verification.probes).toHaveLength(2);
      expect(fixtureText).toContain("provider.setCaseSensitiveSearchEnabled(true);");
      expect(fixtureText).toContain("provider.setCaseSensitiveSearchEnabled(false);");
      expect(await stat(join(worktreePath, "test/factory_case_sensitive_search_test.dart")).catch(() => null)).toBeNull();
    });

    it("records behavioral test failures and removes the fixture", async () => {
      const worktreePath = await mkdtemp(join(tmpdir(), "verification-case-failure-"));
      await mkdir(join(worktreePath, "lib/providers"), { recursive: true });
      await mkdir(join(worktreePath, "test"), { recursive: true });
      await writeFile(
        join(worktreePath, "lib/providers/application_provider.dart"),
        "class ApplicationProvider { void toggleCaseSensitiveSearch() {} }",
      );
      const planner = {
        async plan() {
          return { probes: [{
            id: "existing",
            hypothesis: "Baseline check.",
            rationale: "Check regression.",
            command: "flutter",
            args: ["test"],
            expectedOutcome: "Pass",
          }] };
        },
      } as VerificationPlanner;
      const executor = {
        async execute(probes: Array<{ id: string }>) {
          const failed = probes[0]?.id === "case-sensitive-search-behavior";
          return {
            passed: !failed,
            probes: probes.map((probe) => ({
              probeId: probe.id,
              command: "flutter",
              args: ["test"],
              exitCode: failed ? 1 : 0,
              stdout: "",
              stderr: failed ? "behavior mismatch" : "",
              durationMs: 1,
              passed: !failed,
            })),
            failedProbes: failed ? ["case-sensitive-search-behavior"] : [],
            durationMs: 1,
          };
        },
      } as unknown as VerificationExecutor;
      const result = await new VerificationWorkflow(planner, executor).run({
        task: {
          ...task,
          request: "Add a case-sensitive search toggle to application search.",
        },
        validation: passedValidation,
        changedFiles: [],
        worktreePath,
      });
      expect(result.verification.passed).toBe(false);
      expect(result.verification.failedProbes).toContain("case-sensitive-search-behavior");
      expect(result.verification.probes).toHaveLength(2);
      expect(await stat(join(worktreePath, "test/factory_case_sensitive_search_test.dart")).catch(() => null)).toBeNull();
    });

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
