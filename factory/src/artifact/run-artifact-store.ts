import {
    mkdir,
    readFile,
    writeFile,
  } from "node:fs/promises";
  import {
    resolve,
    sep,
  } from "node:path";
  
  export class RunArtifactStore {
    private readonly runsRoot: string;
  
    constructor(factoryRoot: string) {
      this.runsRoot = resolve(
        factoryRoot,
        "runs",
      );
    }
  
    async writeJson(
      runId: string,
      artifactName: string,
      value: unknown,
    ): Promise<void> {
      const runDirectory =
        this.resolveRunDirectory(runId);
  
      const artifactPath =
        this.resolveArtifactPath(
          runDirectory,
          artifactName,
        );
  
      await mkdir(runDirectory, {
        recursive: true,
      });
  
      await writeFile(
        artifactPath,
        `${JSON.stringify(
          value,
          null,
          2,
        )}\n`,
        "utf8",
      );
    }
  
    async readJson<T>(
      runId: string,
      artifactName: string,
    ): Promise<T> {
      const runDirectory =
        this.resolveRunDirectory(runId);
  
      const artifactPath =
        this.resolveArtifactPath(
          runDirectory,
          artifactName,
        );
  
      const content = await readFile(
        artifactPath,
        "utf8",
      );
  
      return JSON.parse(content) as T;
    }
  
    private resolveRunDirectory(
      runId: string,
    ): string {
      this.assertSafeName(runId, "run ID");
  
      const runDirectory = resolve(
        this.runsRoot,
        runId,
      );
  
      this.assertInside(
        this.runsRoot,
        runDirectory,
      );
  
      return runDirectory;
    }
  
    private resolveArtifactPath(
      runDirectory: string,
      artifactName: string,
    ): string {
      this.assertSafeName(
        artifactName,
        "artifact name",
      );
  
      const artifactPath = resolve(
        runDirectory,
        `${artifactName}.json`,
      );
  
      this.assertInside(
        runDirectory,
        artifactPath,
      );
  
      return artifactPath;
    }
  
    private assertSafeName(
      value: string,
      label: string,
    ): void {
      if (
        value.length === 0 ||
        value === "." ||
        value === ".." ||
        value.includes("/") ||
        value.includes("\\")
      ) {
        throw new Error(
          `Invalid ${label}: ${value}`,
        );
      }
    }
  
    private assertInside(
      root: string,
      candidate: string,
    ): void {
      const normalizedRoot =
        root.endsWith(sep)
          ? root
          : `${root}${sep}`;
  
      if (
        candidate !== root &&
        !candidate.startsWith(
          normalizedRoot,
        )
      ) {
        throw new Error(
          `Artifact path escapes root: ${candidate}`,
        );
      }
    }
  }