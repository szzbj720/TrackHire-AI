import {
    mkdtemp,
    readFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    RunArtifactStore,
  } from "./run-artifact-store.js";
  
  describe("RunArtifactStore", () => {
    it("writes structured JSON into the run directory", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      await store.writeJson(
        "TH-001",
        "task",
        {
          id: "TH-001",
          status: "TASK_CREATED",
        },
      );
  
      const content = await readFile(
        join(
          factoryRoot,
          "runs",
          "TH-001",
          "task.json",
        ),
        "utf8",
      );
  
      expect(
        JSON.parse(content),
      ).toEqual({
        id: "TH-001",
        status: "TASK_CREATED",
      });
  
      expect(
        content.endsWith("\n"),
      ).toBe(true);
    });
  
    it("reads a previously written JSON artifact", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      const value = {
        passed: true,
        checks: [
          {
            name: "Flutter tests",
            passed: true,
          },
        ],
      };
  
      await store.writeJson(
        "TH-001",
        "validation",
        value,
      );
  
      const result =
        await store.readJson<
          typeof value
        >(
          "TH-001",
          "validation",
        );
  
      expect(result).toEqual(value);
    });
  
    it("keeps artifacts from different runs isolated", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      await store.writeJson(
        "TH-001",
        "task",
        {
          id: "TH-001",
        },
      );
  
      await store.writeJson(
        "TH-002",
        "task",
        {
          id: "TH-002",
        },
      );
  
      const first =
        await store.readJson<{
          id: string;
        }>(
          "TH-001",
          "task",
        );
  
      const second =
        await store.readJson<{
          id: string;
        }>(
          "TH-002",
          "task",
        );
  
      expect(first.id).toBe(
        "TH-001",
      );
  
      expect(second.id).toBe(
        "TH-002",
      );
    });
  
    it("rejects unsafe run IDs", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      await expect(
        store.writeJson(
          "../outside",
          "task",
          {},
        ),
      ).rejects.toThrow(
        "Invalid run ID: ../outside",
      );
  
      await expect(
        store.writeJson(
          "nested/run",
          "task",
          {},
        ),
      ).rejects.toThrow(
        "Invalid run ID: nested/run",
      );
    });
  
    it("rejects unsafe artifact names", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      await expect(
        store.writeJson(
          "TH-001",
          "../task",
          {},
        ),
      ).rejects.toThrow(
        "Invalid artifact name: ../task",
      );
  
      await expect(
        store.writeJson(
          "TH-001",
          "nested/task",
          {},
        ),
      ).rejects.toThrow(
        "Invalid artifact name: nested/task",
      );
    });
  
    it("rejects empty run IDs and artifact names", async () => {
      const factoryRoot = await mkdtemp(
        join(
          tmpdir(),
          "factory-artifacts-",
        ),
      );
  
      const store =
        new RunArtifactStore(factoryRoot);
  
      await expect(
        store.writeJson(
          "",
          "task",
          {},
        ),
      ).rejects.toThrow(
        "Invalid run ID:",
      );
  
      await expect(
        store.writeJson(
          "TH-001",
          "",
          {},
        ),
      ).rejects.toThrow(
        "Invalid artifact name:",
      );
    });
  });