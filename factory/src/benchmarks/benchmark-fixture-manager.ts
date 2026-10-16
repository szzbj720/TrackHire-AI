import {
    mkdir,
    readFile,
    writeFile,
  } from "node:fs/promises";
  
  import {
    dirname,
    resolve,
    sep,
  } from "node:path";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  export interface BenchmarkFixture {
    path: string;
    content: string;
  }
  
  export interface InstalledBenchmarkFixture {
    path: string;
    content: string;
  }
  
  function resolveWorkspacePath(
    workspaceRoot: string,
    relativePath: string,
  ): string {
    const root =
      resolve(workspaceRoot);
  
    const target =
      resolve(
        workspaceRoot,
        relativePath,
      );
  
    if (
      target !== root &&
      !target.startsWith(
        `${root}${sep}`,
      )
    ) {
      throw new Error(
        `Benchmark fixture path escapes workspace: ${relativePath}`,
      );
    }
  
    return target;
  }
  
  export class BenchmarkFixtureManager {
    async install(
      workspace: BenchmarkWorkspace,
      fixtures: BenchmarkFixture[],
    ): Promise<
      InstalledBenchmarkFixture[]
    > {
      const seen =
        new Set<string>();
  
      const installed:
        InstalledBenchmarkFixture[] = [];
  
      for (
        const fixture
        of fixtures
      ) {
        if (
          fixture.path.trim()
            .length === 0
        ) {
          throw new Error(
            "Benchmark fixture path cannot be empty.",
          );
        }
  
        if (
          seen.has(
            fixture.path,
          )
        ) {
          throw new Error(
            `Duplicate benchmark fixture path: ${fixture.path}`,
          );
        }
  
        seen.add(
          fixture.path,
        );
  
        const target =
          resolveWorkspacePath(
            workspace.path,
            fixture.path,
          );
  
        await mkdir(
          dirname(target),
          {
            recursive: true,
          },
        );
  
        await writeFile(
          target,
          fixture.content,
          "utf8",
        );
  
        installed.push({
          path:
            fixture.path,
  
          content:
            fixture.content,
        });
      }
  
      return installed;
    }
  
    async assertUnchanged(
      workspace: BenchmarkWorkspace,
      fixtures:
        InstalledBenchmarkFixture[],
    ): Promise<void> {
      for (
        const fixture
        of fixtures
      ) {
        const target =
          resolveWorkspacePath(
            workspace.path,
            fixture.path,
          );
  
        let actual: string;
  
        try {
          actual =
            await readFile(
              target,
              "utf8",
            );
        } catch {
          throw new Error(
            `Protected benchmark fixture is missing: ${fixture.path}`,
          );
        }
  
        if (
          actual !==
          fixture.content
        ) {
          throw new Error(
            `Protected benchmark fixture was modified: ${fixture.path}`,
          );
        }
      }
    }
  }