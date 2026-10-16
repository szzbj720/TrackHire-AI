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
  
    const manager =
      new BenchmarkWorkspaceManager(
        { create },
        { resolve },
      );
  
    return {
      manager,
      create,
      resolve,
    };
  }
  
  describe(
    "BenchmarkWorkspaceManager",
    () => {
      it("resolves the benchmark baseline before creating a worktree", async () => {
        const {
          manager,
          create,
          resolve,
        } = createDependencies();
  
        const workspace =
          await manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "run-001",
            strategyId: "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
          });
  
        expect(resolve).toHaveBeenCalledWith(
          "/repo/trackhire",
          "main",
        );
  
        expect(create).toHaveBeenCalledWith({
          repositoryRoot:
            "/repo/trackhire",
  
          taskId:
            "benchmark-trackhire-interview-date-run-001-sequential",
  
          baseBranch:
            "abc123def456",
        });
  
        expect(workspace).toEqual({
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
      });
  
      it("creates different workspaces for different strategies from the same baseline", async () => {
        const {
          manager,
          create,
        } = createDependencies();
  
        const sequential =
          await manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "run-001",
            strategyId: "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
          });
  
        const exploration =
          await manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "run-001",
            strategyId: "exploration",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
          });
  
        expect(
          sequential.baselineRevision,
        ).toBe(
          exploration.baselineRevision,
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
  
        expect(create).toHaveBeenCalledTimes(
          2,
        );
      });
  
      it("preserves the resolved immutable baseline revision", async () => {
        const {
          manager,
        } = createDependencies();
  
        const workspace =
          await manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "experiment-42",
            strategyId: "parallel",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "feat/trackhire-benchmark",
          });
  
        expect(
          workspace.baselineRevision,
        ).toBe(
          "abc123def456",
        );
      });
  
      it("rejects an empty benchmark run ID", async () => {
        const {
          manager,
          create,
        } = createDependencies();
  
        await expect(
          manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "   ",
            strategyId: "sequential",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
          }),
        ).rejects.toThrow(
          "Benchmark run ID cannot be empty.",
        );
  
        expect(create).not.toHaveBeenCalled();
      });
  
      it("rejects an empty strategy ID", async () => {
        const {
          manager,
          create,
        } = createDependencies();
  
        await expect(
          manager.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId: "run-001",
            strategyId: "",
  
            repositoryRoot:
              "/repo/trackhire",
  
            baseRevision:
              "main",
          }),
        ).rejects.toThrow(
          "Benchmark strategy ID cannot be empty.",
        );
  
        expect(create).not.toHaveBeenCalled();
      });
    },
  );