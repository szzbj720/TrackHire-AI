import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import {
    BenchmarkWorkspaceManager,
    type BenchmarkRevisionResolver,
    type BenchmarkWorktreeCleaner,
    type BenchmarkWorktreeCreator,
  } from "./benchmark-workspace-manager.js";
  
  function createDependencies() {
    const create =
      vi.fn<
        BenchmarkWorktreeCreator["create"]
      >(
        async (options) => ({
          path:
            `/tmp/${options.taskId}`,
  
          branch:
            `factory/${options.taskId}`,
        }),
      );
  
    const resolve =
      vi.fn<
        BenchmarkRevisionResolver["resolve"]
      >(
        async () =>
          "abc123def456",
      );
  
    const remove =
      vi.fn<
        BenchmarkWorktreeCleaner["remove"]
      >(
        async () => {},
      );
  
    const manager =
      new BenchmarkWorkspaceManager(
        {
          create,
        },
        {
          resolve,
        },
        {
          remove,
        },
      );
  
    return {
      manager,
      create,
      resolve,
      remove,
    };
  }
  
  describe(
    "BenchmarkWorkspaceManager",
    () => {
      it(
        "resolves the benchmark baseline before creating a worktree",
        async () => {
          const {
            manager,
            create,
            resolve,
          } =
            createDependencies();
  
          const workspace =
            await manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "run-001",
  
              strategyId:
                "sequential",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            });
  
          expect(
            resolve,
          ).toHaveBeenCalledWith(
            "/repo/trackhire",
            "main",
          );
  
          expect(
            create,
          ).toHaveBeenCalledWith({
            repositoryRoot:
              "/repo/trackhire",
  
            taskId:
              "benchmark-trackhire-interview-date-run-001-sequential",
  
            baseBranch:
              "abc123def456",
          });
  
          expect(
            workspace,
          ).toEqual({
            scenarioId:
              "trackhire-interview-date",
  
            runId:
              "run-001",
  
            strategyId:
              "sequential",
  
            baselineRevision:
              "abc123def456",
  
            path:
              "/tmp/benchmark-trackhire-interview-date-run-001-sequential",
  
            branch:
              "factory/benchmark-trackhire-interview-date-run-001-sequential",
          });
        },
      );
  
      it(
        "creates different workspaces for different strategies from the same baseline",
        async () => {
          const {
            manager,
            create,
          } =
            createDependencies();
  
          const sequential =
            await manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "run-001",
  
              strategyId:
                "sequential",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            });
  
          const exploration =
            await manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "run-001",
  
              strategyId:
                "exploration",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            });
  
          expect(
            sequential
              .baselineRevision,
          ).toBe(
            exploration
              .baselineRevision,
          );
  
          expect(
            sequential.path,
          ).not.toBe(
            exploration.path,
          );
  
          expect(
            sequential.branch,
          ).not.toBe(
            exploration.branch,
          );
  
          expect(
            create,
          ).toHaveBeenCalledTimes(
            2,
          );
        },
      );
  
      it(
        "preserves the resolved immutable baseline revision",
        async () => {
          const {
            manager,
          } =
            createDependencies();
  
          const workspace =
            await manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "experiment-42",
  
              strategyId:
                "parallel",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "feat/trackhire-benchmark",
            });
  
          expect(
            workspace
              .baselineRevision,
          ).toBe(
            "abc123def456",
          );
        },
      );
  
      it(
        "cleans up the exact benchmark worktree and branch",
        async () => {
          const {
            manager,
            remove,
          } =
            createDependencies();
  
          const workspace =
            await manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "run-001",
  
              strategyId:
                "sequential",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            });
  
          await manager.cleanup({
            repositoryRoot:
              "/repo/trackhire",
  
            workspace,
          });
  
          expect(
            remove,
          ).toHaveBeenCalledTimes(
            1,
          );
  
          expect(
            remove,
          ).toHaveBeenCalledWith({
            repositoryRoot:
              "/repo/trackhire",
  
            worktreePath:
              "/tmp/benchmark-trackhire-interview-date-run-001-sequential",
  
            branch:
              "factory/benchmark-trackhire-interview-date-run-001-sequential",
          });
        },
      );
  
      it(
        "does not resolve or create anything during cleanup",
        async () => {
          const {
            manager,
            create,
            resolve,
            remove,
          } =
            createDependencies();
  
          await manager.cleanup({
            repositoryRoot:
              "/repo/trackhire",
  
            workspace: {
              scenarioId:
                "trackhire-interview-date",
  
              runId:
                "run-001",
  
              strategyId:
                "sequential",
  
              baselineRevision:
                "abc123def456",
  
              path:
                "/tmp/existing-worktree",
  
              branch:
                "factory/existing-worktree",
            },
          });
  
          expect(
            remove,
          ).toHaveBeenCalledTimes(
            1,
          );
  
          expect(
            create,
          ).not.toHaveBeenCalled();
  
          expect(
            resolve,
          ).not.toHaveBeenCalled();
        },
      );
  
      it(
        "propagates cleanup failures instead of hiding them",
        async () => {
          const create =
            vi.fn<
              BenchmarkWorktreeCreator[
                "create"
              ]
            >();
  
          const resolve =
            vi.fn<
              BenchmarkRevisionResolver[
                "resolve"
              ]
            >();
  
          const remove =
            vi.fn<
              BenchmarkWorktreeCleaner[
                "remove"
              ]
            >(
              async () => {
                throw new Error(
                  "cleanup failed",
                );
              },
            );
  
          const manager =
            new BenchmarkWorkspaceManager(
              {
                create,
              },
              {
                resolve,
              },
              {
                remove,
              },
            );
  
          await expect(
            manager.cleanup({
              repositoryRoot:
                "/repo/trackhire",
  
              workspace: {
                scenarioId:
                  "trackhire-interview-date",
  
                runId:
                  "run-001",
  
                strategyId:
                  "baseline",
  
                baselineRevision:
                  "abc123",
  
                path:
                  "/tmp/worktree",
  
                branch:
                  "factory/worktree",
              },
            }),
          ).rejects.toThrow(
            "cleanup failed",
          );
        },
      );
  
      it(
        "rejects an empty benchmark run ID",
        async () => {
          const {
            manager,
            create,
          } =
            createDependencies();
  
          await expect(
            manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "   ",
  
              strategyId:
                "sequential",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            }),
          ).rejects.toThrow(
            "Benchmark run ID cannot be empty.",
          );
  
          expect(
            create,
          ).not.toHaveBeenCalled();
        },
      );
  
      it(
        "rejects an empty strategy ID",
        async () => {
          const {
            manager,
            create,
          } =
            createDependencies();
  
          await expect(
            manager.create({
              scenario:
                trackHireInterviewDateBenchmark,
  
              runId:
                "run-001",
  
              strategyId:
                "",
  
              repositoryRoot:
                "/repo/trackhire",
  
              baseRevision:
                "main",
            }),
          ).rejects.toThrow(
            "Benchmark strategy ID cannot be empty.",
          );
  
          expect(
            create,
          ).not.toHaveBeenCalled();
        },
      );
    },
  );