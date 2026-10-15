import {
    mkdtemp,
    readFile,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import { describe, expect, it } from "vitest";
  
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import { ModelBuilder } from "./builder.js";
  
  class FakeProvider implements ModelProvider {
    constructor(
      private readonly response: unknown,
    ) {}
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return {
        content: JSON.stringify(this.response),
        model: "fake-builder",
      };
    }
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to a TrackHire application.",
      status: "IMPLEMENTING",
      requirements: [
        "Interview date must be optional.",
      ],
      acceptanceCriteria: [
        "Existing applications continue to work.",
      ],
      constraints: [],
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createPlan(): ImplementationPlan {
    return {
      summary: "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The model needs to store the interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
      risks: [],
      assumptions: [
        "Interview date is optional.",
      ],
      requiresHumanInput: false,
    };
  }
  
  async function createWorktree(): Promise<string> {
    const root = await mkdtemp(
      join(tmpdir(), "factory-builder-test-"),
    );
  
    await writeFile(
      join(root, "placeholder.txt"),
      "placeholder",
      "utf8",
    );
  
    const modelDirectory = join(
      root,
      "lib",
      "models",
    );
  
    const { mkdir } = await import(
      "node:fs/promises"
    );
  
    await mkdir(modelDirectory, {
      recursive: true,
    });
  
    await writeFile(
      join(
        modelDirectory,
        "job_application.dart",
      ),
      "class JobApplication {}\n",
      "utf8",
    );
  
    return root;
  }
  
  describe("ModelBuilder", () => {
    it("writes an approved model change into the workspace", async () => {
      const worktreePath =
        await createWorktree();
  
      const provider = new FakeProvider({
        summary:
          "Added optional interview date support.",
        writes: [
          {
            path: "lib/models/job_application.dart",
            content:
              "class JobApplication {\n  DateTime? interviewDate;\n}\n",
            summary:
              "Added optional interviewDate field.",
          },
        ],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      });
  
      const builder = new ModelBuilder(provider);
  
      const result = await builder.implement({
        task: createTask(),
        plan: createPlan(),
        worktreePath,
      });
  
      const content = await readFile(
        join(
          worktreePath,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );
  
      expect(content).toContain(
        "DateTime? interviewDate",
      );
  
      expect(result.changedFiles).toEqual([
        {
          path: "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interviewDate field.",
        },
      ]);
  
      expect(result.requiresHumanInput).toBe(
        false,
      );
    });
  
    it("rejects a write to a file outside the approved plan", async () => {
      const worktreePath =
        await createWorktree();
  
      const provider = new FakeProvider({
        summary: "Changed an unrelated file.",
        writes: [
          {
            path: "lib/unapproved.dart",
            content: "bad change\n",
            summary:
              "Modified an unapproved file.",
          },
        ],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      });
  
      const builder = new ModelBuilder(provider);
  
      await expect(
        builder.implement({
          task: createTask(),
          plan: createPlan(),
          worktreePath,
        }),
      ).rejects.toThrow(
        "Builder attempted to modify an unapproved file: lib/unapproved.dart",
      );
    });
  
    it("can request human input without modifying files", async () => {
      const worktreePath =
        await createWorktree();
  
      const originalContent = await readFile(
        join(
          worktreePath,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );
  
      const provider = new FakeProvider({
        summary:
          "The expected interview date behavior is ambiguous.",
        writes: [],
        assumptions: [],
        warnings: [
          "Need clarification before implementation.",
        ],
        requiresHumanInput: true,
      });
  
      const builder = new ModelBuilder(provider);
  
      const result = await builder.implement({
        task: createTask(),
        plan: createPlan(),
        worktreePath,
      });
  
      const finalContent = await readFile(
        join(
          worktreePath,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );
  
      expect(finalContent).toBe(
        originalContent,
      );
  
      expect(result.changedFiles).toEqual([]);
      expect(result.requiresHumanInput).toBe(
        true,
      );
    });
  });