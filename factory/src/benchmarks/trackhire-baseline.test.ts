import {
    mkdtemp,
    rm,
  } from "node:fs/promises";
  
  import {
    join,
  } from "node:path";
  
  import {
    tmpdir,
  } from "node:os";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    TrackHireBaseline,
  } from "./trackhire-baseline.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import type {
    BenchmarkCommandResult,
    BenchmarkCommandRunner,
  } from "./trackhire-interview-date-verifier.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  const temporaryDirectories:
    string[] = [];
  
  class BaselineCommandRunner
    implements BenchmarkCommandRunner {
    readonly calls: {
      command: string;
      args: string[];
      cwd: string;
    }[] = [];
  
    async run(
      command: string,
      args: string[],
      cwd: string,
    ): Promise<BenchmarkCommandResult> {
      this.calls.push({
        command,
        args,
        cwd,
      });
  
      const plainNameIndex =
        args.indexOf(
          "--plain-name",
        );
  
      if (
        plainNameIndex !== -1
      ) {
        const criterion =
          args[
            plainNameIndex + 1
          ];
  
        return {
          command,
          args,
          exitCode: 1,
          stdout: "",
          stderr:
            `Baseline does not satisfy ${criterion}.`,
        };
      }
  
      return {
        command,
        args,
        exitCode: 0,
        stdout:
          "Existing TrackHire checks passed.",
        stderr: "",
      };
    }
  }
  
  async function createWorkspace():
    Promise<BenchmarkWorkspace> {
    const path =
      await mkdtemp(
        join(
          tmpdir(),
          "trackhire-baseline-",
        ),
      );
  
    temporaryDirectories.push(
      path,
    );
  
    return {
      scenarioId:
        "trackhire-interview-date",
  
      runId:
        "baseline-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path,
  
      branch:
        "factory/benchmark-baseline-001",
    };
  }
  
  const task:
    EngineeringTask = {
      id:
        "trackhire-interview-date-baseline-001",
  
      request:
        trackHireInterviewDateBenchmark.task,
  
      status:
        "TASK_CREATED",
  
      requirements:
        [],
  
      acceptanceCriteria:
        [],
  
      constraints:
        [],
  
      repairAttempts: 0,
  
      createdAt:
        "2026-10-17T00:00:00.000Z",
  
      updatedAt:
        "2026-10-17T00:00:00.000Z",
    };
  
  afterEach(
    async () => {
      for (
        const directory
        of temporaryDirectories.splice(
          0,
        )
      ) {
        await rm(
          directory,
          {
            recursive: true,
            force: true,
          },
        );
      }
    },
  );
  
  describe(
    "TrackHireBaseline",
    () => {
      it("records the untouched baseline as failing the new feature criteria", async () => {
        const workspace =
          await createWorkspace();
  
        const commandRunner =
          new BaselineCommandRunner();
  
        const baseline =
          new TrackHireBaseline(
            undefined,
            commandRunner,
          );
  
        const result =
          await baseline.run({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace,
  
            task,
          });
  
        expect(
          result.passed,
        ).toBe(false);
  
        expect(
          result.passedCriteria,
        ).toBe(1);
  
        expect(
          result.failedCriteria,
        ).toBe(4);
  
        expect(
          result.criteria,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              criterionId:
                "optional-date",
  
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "persist-date",
  
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "upcoming-interviews",
  
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "edit-date",
  
              passed: false,
            }),
  
            expect.objectContaining({
              criterionId:
                "regression",
  
              passed: true,
            }),
          ]),
        );
      });
  
      it("runs all four feature checks plus regression checks", async () => {
        const workspace =
          await createWorkspace();
  
        const commandRunner =
          new BaselineCommandRunner();
  
        const baseline =
          new TrackHireBaseline(
            undefined,
            commandRunner,
          );
  
        await baseline.run({
          scenario:
            trackHireInterviewDateBenchmark,
  
          workspace,
  
          task,
        });
  
        expect(
          commandRunner.calls,
        ).toHaveLength(6);
      });
  
      it("retains deterministic failure evidence for each feature criterion", async () => {
        const workspace =
          await createWorkspace();
  
        const commandRunner =
          new BaselineCommandRunner();
  
        const baseline =
          new TrackHireBaseline(
            undefined,
            commandRunner,
          );
  
        const result =
          await baseline.run({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace,
  
            task,
          });
  
        const optionalDate =
          result.criteria.find(
            (criterion) =>
              criterion.criterionId ===
              "optional-date",
          );
  
        expect(
          optionalDate?.evidence,
        ).toEqual(
          expect.arrayContaining([
            "Exit code: 1",
            "stderr: Baseline does not satisfy optional-date.",
          ]),
        );
      });
    },
  );