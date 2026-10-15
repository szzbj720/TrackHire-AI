import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    Builder,
    BuilderInput,
  } from "../agents/builder.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    WorkUnit,
  } from "../schemas/work-graph.js";
  import type {
    ParallelWorktree,
  } from "./parallel-worktrees.js";
  import {
    ParallelWorker,
  } from "./parallel-worker.js";
  
  class RecordingBuilder implements Builder {
    readonly inputs: BuilderInput[] = [];
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.inputs.push(input);
  
      return {
        summary: "Implemented work unit.",
        changedFiles:
          input.plan.affectedFiles.map(
            (path) => ({
              path,
              changeType:
                "modified" as const,
              summary: `Updated ${path}.`,
            }),
          ),
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      };
    }
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-PARALLEL-001",
      request:
        "Add an optional interview date.",
      status:
        "AWAITING_PARALLEL_APPROVAL",
      requirements: [],
      acceptanceCriteria: [],
      constraints: [],
      strategy: {
        mode: "parallel",
        reasoning:
          "The task spans independent areas.",
      },
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createPlan(): ImplementationPlan {
    return {
      summary:
        "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The domain model needs the new field.",
        },
        {
          order: 2,
          description:
            "Update the backend.",
          files: [
            "backend/interviews.ts",
          ],
          rationale:
            "The backend must persist the field.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
        "backend/interviews.ts",
      ],
      validationSteps: [
        "Run tests.",
      ],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };
  }
  
  function createUnits(): WorkUnit[] {
    return [
      {
        id: "model",
        description:
          "Update the application model.",
        files: [
          "lib/models/job_application.dart",
        ],
        dependsOn: [],
      },
      {
        id: "backend",
        description:
          "Update the backend.",
        files: [
          "backend/interviews.ts",
        ],
        dependsOn: [],
      },
    ];
  }
  
  function createWorktrees(
    units: WorkUnit[],
  ): ParallelWorktree[] {
    return units.map((unit) => ({
      unit,
      worktree: {
        path: `/tmp/${unit.id}`,
        branch:
          `factory/th-parallel-001-${unit.id}`,
      },
    }));
  }
  
  describe("ParallelWorker", () => {
    it("executes every work unit in the wave", async () => {
      const builder =
        new RecordingBuilder();
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      const results =
        await worker.executeWave({
          task: createTask(),
          plan: createPlan(),
          worktrees:
            createWorktrees(units),
          units,
        });
  
      expect(results).toHaveLength(2);
  
      expect(
        results.map(
          (result) => result.unit.id,
        ),
      ).toEqual([
        "model",
        "backend",
      ]);
  
      expect(builder.inputs).toHaveLength(2);
    });
  
    it("gives each builder only its work unit files", async () => {
      const builder =
        new RecordingBuilder();
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      await worker.executeWave({
        task: createTask(),
        plan: createPlan(),
        worktrees:
          createWorktrees(units),
        units,
      });
  
      const modelInput =
        builder.inputs.find(
          (input) =>
            input.plan.affectedFiles.includes(
              "lib/models/job_application.dart",
            ),
        );
  
      const backendInput =
        builder.inputs.find(
          (input) =>
            input.plan.affectedFiles.includes(
              "backend/interviews.ts",
            ),
        );
  
      expect(modelInput).toBeDefined();
      expect(backendInput).toBeDefined();
  
      expect(
        modelInput?.plan.affectedFiles,
      ).toEqual([
        "lib/models/job_application.dart",
      ]);
  
      expect(
        backendInput?.plan.affectedFiles,
      ).toEqual([
        "backend/interviews.ts",
      ]);
    });
  
    it("filters plan steps to the assigned work unit", async () => {
      const builder =
        new RecordingBuilder();
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      await worker.executeWave({
        task: createTask(),
        plan: createPlan(),
        worktrees:
          createWorktrees(units),
        units,
      });
  
      const modelInput =
        builder.inputs.find(
          (input) =>
            input.plan.affectedFiles.includes(
              "lib/models/job_application.dart",
            ),
        );
  
      expect(
        modelInput?.plan.steps,
      ).toHaveLength(1);
  
      expect(
        modelInput?.plan.steps[0]
          ?.description,
      ).toBe(
        "Update the application model.",
      );
    });
  
    it("uses the isolated worktree assigned to each unit", async () => {
      const builder =
        new RecordingBuilder();
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      await worker.executeWave({
        task: createTask(),
        plan: createPlan(),
        worktrees:
          createWorktrees(units),
        units,
      });
  
      const paths = builder.inputs.map(
        (input) => input.worktreePath,
      );
  
      expect(paths).toContain(
        "/tmp/model",
      );
  
      expect(paths).toContain(
        "/tmp/backend",
      );
    });
  
    it("fails when a work unit has no isolated worktree", async () => {
      const builder =
        new RecordingBuilder();
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      await expect(
        worker.executeWave({
          task: createTask(),
          plan: createPlan(),
          worktrees: [
            createWorktrees(units)[0]!,
          ],
          units,
        }),
      ).rejects.toThrow(
        "No isolated worktree exists for work unit backend.",
      );
    });
  
    it("executes units in the same wave concurrently", async () => {
      let activeBuilders = 0;
      let maximumActiveBuilders = 0;
  
      const builder: Builder = {
        async implement(
          input: BuilderInput,
        ): Promise<ImplementationResult> {
          activeBuilders += 1;
  
          maximumActiveBuilders = Math.max(
            maximumActiveBuilders,
            activeBuilders,
          );
  
          await new Promise<void>(
            (resolve) => {
              setTimeout(resolve, 20);
            },
          );
  
          activeBuilders -= 1;
  
          return {
            summary: "Implemented.",
            changedFiles:
              input.plan.affectedFiles.map(
                (path) => ({
                  path,
                  changeType:
                    "modified" as const,
                  summary:
                    `Updated ${path}.`,
                }),
              ),
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          };
        },
      };
  
      const worker =
        new ParallelWorker(builder);
  
      const units = createUnits();
  
      await worker.executeWave({
        task: createTask(),
        plan: createPlan(),
        worktrees:
          createWorktrees(units),
        units,
      });
  
      expect(
        maximumActiveBuilders,
      ).toBe(2);
    });
  });