import {
    mkdtemp,
    mkdir,
    rm,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import type { EngineeringTask } from "../schemas/task.js";
  import { buildRepositoryContext } from "./context-builder.js";
  
  const temporaryDirectories: string[] = [];
  
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.map((directory) =>
        rm(directory, {
          recursive: true,
          force: true,
        }),
      ),
    );
  
    temporaryDirectories.length = 0;
  });
  
  async function createTemporaryRepository(): Promise<string> {
    const root = await mkdtemp(
      join(tmpdir(), "factory-context-test-"),
    );
  
    temporaryDirectories.push(root);
  
    await mkdir(join(root, "lib", "models"), {
      recursive: true,
    });
  
    await mkdir(join(root, "lib", "screens"), {
      recursive: true,
    });
  
    await writeFile(
      join(root, "README.md"),
      "# Test repository",
    );
  
    await writeFile(
      join(root, "lib", "models", "application.dart"),
      "class Application {}",
    );
  
    await writeFile(
      join(root, "lib", "screens", "settings.dart"),
      "class SettingsScreen {}",
    );
  
    return root;
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to an application.",
      status: "TASK_CREATED",
      requirements: [
        "Store an interview date for an application.",
      ],
      acceptanceCriteria: [],
      constraints: [],
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  describe("buildRepositoryContext", () => {
    it("builds bounded task-aware repository context", async () => {
      const root = await createTemporaryRepository();
  
      const context = await buildRepositoryContext(
        createTask(),
        root,
        5,
      );
  
      expect(context.summary.totalFiles).toBe(3);
  
      expect(context.summary.topLevelAreas).toEqual([
        "lib",
      ]);
  
      expect(
        context.relevantFiles.map((file) => file.path),
      ).toEqual([
        join("lib", "models", "application.dart"),
      ]);
  
      expect(context.fileContents).toHaveLength(1);
  
      expect(context.fileContents[0]?.content).toBe(
        "class Application {}",
      );
    });
  });