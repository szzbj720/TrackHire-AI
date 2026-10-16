import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
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
    BenchmarkFixtureManager,
  } from "./benchmark-fixture-manager.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  const temporaryDirectories:
    string[] = [];
  
  async function createWorkspace():
    Promise<BenchmarkWorkspace> {
    const path =
      await mkdtemp(
        join(
          tmpdir(),
          "factory-benchmark-fixture-",
        ),
      );
  
    temporaryDirectories.push(
      path,
    );
  
    return {
      scenarioId:
        "trackhire-interview-date",
  
      runId:
        "benchmark-run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path,
  
      branch:
        "factory/benchmark-sequential",
    };
  }
  
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
    "BenchmarkFixtureManager",
    () => {
      it("installs a frozen fixture inside the isolated benchmark workspace", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        const installed =
          await manager.install(
            workspace,
            [
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "frozen benchmark test",
              },
            ],
          );
  
        const content =
          await readFile(
            join(
              workspace.path,
              "test/factory_benchmark_interview_date_test.dart",
            ),
            "utf8",
          );
  
        expect(
          content,
        ).toBe(
          "frozen benchmark test",
        );
  
        expect(
          installed,
        ).toEqual([
          {
            path:
              "test/factory_benchmark_interview_date_test.dart",
  
            content:
              "frozen benchmark test",
          },
        ]);
      });
  
      it("confirms an installed fixture remains unchanged", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        const installed =
          await manager.install(
            workspace,
            [
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "frozen benchmark test",
              },
            ],
          );
  
        await expect(
          manager.assertUnchanged(
            workspace,
            installed,
          ),
        ).resolves.toBeUndefined();
      });
  
      it("rejects a modified protected fixture", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        const installed =
          await manager.install(
            workspace,
            [
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "frozen benchmark test",
              },
            ],
          );
  
        await writeFile(
          join(
            workspace.path,
            "test/factory_benchmark_interview_date_test.dart",
          ),
          "agent changed benchmark",
          "utf8",
        );
  
        await expect(
          manager.assertUnchanged(
            workspace,
            installed,
          ),
        ).rejects.toThrow(
          "Protected benchmark fixture was modified: test/factory_benchmark_interview_date_test.dart",
        );
      });
  
      it("rejects a deleted protected fixture", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        const installed =
          await manager.install(
            workspace,
            [
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "frozen benchmark test",
              },
            ],
          );
  
        await rm(
          join(
            workspace.path,
            "test/factory_benchmark_interview_date_test.dart",
          ),
        );
  
        await expect(
          manager.assertUnchanged(
            workspace,
            installed,
          ),
        ).rejects.toThrow(
          "Protected benchmark fixture is missing: test/factory_benchmark_interview_date_test.dart",
        );
      });
  
      it("rejects duplicate fixture paths", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        await expect(
          manager.install(
            workspace,
            [
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "first",
              },
  
              {
                path:
                  "test/factory_benchmark_interview_date_test.dart",
  
                content:
                  "second",
              },
            ],
          ),
        ).rejects.toThrow(
          "Duplicate benchmark fixture path: test/factory_benchmark_interview_date_test.dart",
        );
      });
  
      it("rejects fixtures that escape the benchmark workspace", async () => {
        const workspace =
          await createWorkspace();
  
        const manager =
          new BenchmarkFixtureManager();
  
        await expect(
          manager.install(
            workspace,
            [
              {
                path:
                  "../outside.dart",
  
                content:
                  "not allowed",
              },
            ],
          ),
        ).rejects.toThrow(
          "Benchmark fixture path escapes workspace: ../outside.dart",
        );
      });
    },
  );