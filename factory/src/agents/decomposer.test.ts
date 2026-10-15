import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import type { WorkGraph } from "../schemas/work-graph.js";
  import {
    ModelDecomposer,
    type WorkGraphGenerator,
  } from "./decomposer.js";
  
  function createTask(
    mode:
      | "single-agent"
      | "sequential"
      | "parallel" = "parallel",
  ): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-DECOMPOSE-001",
      request:
        "Add an optional interview date and display upcoming interviews.",
      status: "AWAITING_PLAN_APPROVAL",
      requirements: [
        "Store an optional interview date.",
        "Display upcoming interviews.",
      ],
      acceptanceCriteria: [
        "Existing applications remain valid.",
        "Upcoming interviews are visible.",
      ],
      constraints: [],
      strategy: {
        mode,
        reasoning:
          "The task crosses multiple areas and requires decomposition.",
      },
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createPlan(
    requiresHumanInput = false,
  ): ImplementationPlan {
    return {
      summary:
        "Add interview-date support across the application.",
      steps: [
        {
          order: 1,
          description:
            "Add the optional interview date to the model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The domain model must represent the new field.",
        },
        {
          order: 2,
          description:
            "Update application state handling.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          rationale:
            "State management must preserve the new field.",
        },
        {
          order: 3,
          description:
            "Display upcoming interviews.",
          files: [
            "lib/screens/example.dart",
          ],
          rationale:
            "Users need to see upcoming interviews.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
        "lib/providers/application_provider.dart",
        "lib/screens/example.dart",
      ],
      validationSteps: [
        "Run deterministic validation.",
      ],
      risks: [
        "Existing persisted applications must remain compatible.",
      ],
      assumptions: [],
      requiresHumanInput,
    };
  }
  
  function createValidGraph(): WorkGraph {
    return {
      units: [
        {
          id: "model",
          description:
            "Add interview date to the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          dependsOn: [],
        },
        {
          id: "provider",
          description:
            "Update state handling for interview dates.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          dependsOn: ["model"],
        },
        {
          id: "ui",
          description:
            "Display upcoming interviews.",
          files: [
            "lib/screens/example.dart",
          ],
          dependsOn: ["provider"],
        },
      ],
    };
  }
  
  function createGenerator(
    graph: WorkGraph,
  ): WorkGraphGenerator {
    return {
      generateWorkGraph: vi.fn(
        async () => graph,
      ),
    };
  }
  
  describe("ModelDecomposer", () => {
    it("returns a valid work graph for a parallel task", async () => {
      const generator = createGenerator(
        createValidGraph(),
      );
  
      const decomposer =
        new ModelDecomposer(generator);
  
      const graph = await decomposer.decompose({
        task: createTask(),
        plan: createPlan(),
      });
  
      expect(graph).toEqual(createValidGraph());
  
      expect(
        generator.generateWorkGraph,
      ).toHaveBeenCalledOnce();
    });
  
    it("rejects decomposition for a sequential strategy", async () => {
      const generator = createGenerator(
        createValidGraph(),
      );
  
      const decomposer =
        new ModelDecomposer(generator);
  
      await expect(
        decomposer.decompose({
          task: createTask("sequential"),
          plan: createPlan(),
        }),
      ).rejects.toThrow(
        "Work decomposition requires a parallel execution strategy.",
      );
  
      expect(
        generator.generateWorkGraph,
      ).not.toHaveBeenCalled();
    });
  
    it("rejects a plan that still requires human input", async () => {
      const generator = createGenerator(
        createValidGraph(),
      );
  
      const decomposer =
        new ModelDecomposer(generator);
  
      await expect(
        decomposer.decompose({
          task: createTask(),
          plan: createPlan(true),
        }),
      ).rejects.toThrow(
        "Cannot decompose a plan that still requires human input.",
      );
  
      expect(
        generator.generateWorkGraph,
      ).not.toHaveBeenCalled();
    });
  
    it("rejects a generated graph with an unknown dependency", async () => {
      const generator = createGenerator({
        units: [
          {
            id: "ui",
            description:
              "Display upcoming interviews.",
            files: [
              "lib/screens/example.dart",
            ],
            dependsOn: ["missing"],
          },
        ],
      });
  
      const decomposer =
        new ModelDecomposer(generator);
  
      await expect(
        decomposer.decompose({
          task: createTask(),
          plan: createPlan(),
        }),
      ).rejects.toThrow(
        "Generated work graph is invalid: Work unit ui depends on unknown unit missing.",
      );
    });
  
    it("rejects a generated graph containing a cycle", async () => {
      const generator = createGenerator({
        units: [
          {
            id: "model",
            description:
              "Update the model.",
            files: [
              "lib/models/job_application.dart",
            ],
            dependsOn: ["provider"],
          },
          {
            id: "provider",
            description:
              "Update the provider.",
            files: [
              "lib/providers/application_provider.dart",
            ],
            dependsOn: ["model"],
          },
        ],
      });
  
      const decomposer =
        new ModelDecomposer(generator);
  
      await expect(
        decomposer.decompose({
          task: createTask(),
          plan: createPlan(),
        }),
      ).rejects.toThrow(
        "Generated work graph is invalid: Work graph contains a dependency cycle.",
      );
    });
  });