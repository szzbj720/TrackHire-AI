import {
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  import type { Decomposer } from "../agents/decomposer.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type { EngineeringTask } from "../schemas/task.js";
  import type { WorkGraph } from "../schemas/work-graph.js";
  import { ParallelPlanningWorkflow } from "./parallel-planning-workflow.js";
  
  function createPlan(
    requiresHumanInput = false,
  ): ImplementationPlan {
    return {
      summary:
        "Implement a cross-cutting application change.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The domain model must support the change.",
        },
        {
          order: 2,
          description:
            "Update application state handling.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          rationale:
            "State management must support the change.",
        },
        {
          order: 3,
          description:
            "Update the user interface.",
          files: [
            "lib/screens/example.dart",
          ],
          rationale:
            "The feature must be visible to users.",
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
        "The change crosses multiple application layers.",
      ],
      assumptions: [],
      requiresHumanInput,
    };
  }
  
  function createTask(
    options: {
      status?: EngineeringTask["status"];
      mode?:
        | "single-agent"
        | "sequential"
        | "parallel";
      includePlan?: boolean;
      planRequiresHumanInput?: boolean;
    } = {},
  ): EngineeringTask {
    const now = new Date().toISOString();
  
    const task: EngineeringTask = {
      id: "TH-PARALLEL-PLAN-001",
      request:
        "Implement a cross-cutting application change.",
      status:
        options.status ??
        "AWAITING_PLAN_APPROVAL",
      requirements: [
        "Implement the requested change.",
      ],
      acceptanceCriteria: [
        "Deterministic validation passes.",
      ],
      constraints: [],
      strategy: {
        mode: options.mode ?? "parallel",
        reasoning:
          "The task requires decomposition.",
      },
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  
    if (options.includePlan !== false) {
      task.plan = createPlan(
        options.planRequiresHumanInput ?? false,
      );
    }
  
    return task;
  }
  
  function createGraph(): WorkGraph {
    return {
      units: [
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
          id: "provider",
          description:
            "Update application state handling.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          dependsOn: ["model"],
        },
        {
          id: "ui",
          description:
            "Update the user interface.",
          files: [
            "lib/screens/example.dart",
          ],
          dependsOn: ["provider"],
        },
      ],
    };
  }
  
  function createDecomposer(): Decomposer {
    return {
      decompose: vi.fn(
        async () => createGraph(),
      ),
    };
  }
  
  describe("ParallelPlanningWorkflow", () => {
    it("produces a validated work graph for an approved parallel plan", async () => {
      const decomposer = createDecomposer();
  
      const workflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      const task = createTask();
  
      const result = await workflow.run(task);
  
      expect(result.task).toBe(task);
      expect(result.workGraph).toEqual(
        createGraph(),
      );
  
      expect(
        decomposer.decompose,
      ).toHaveBeenCalledWith({
        task,
        plan: task.plan,
      });
    });
  
    it("rejects a non-parallel strategy", async () => {
      const decomposer = createDecomposer();
  
      const workflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      await expect(
        workflow.run(
          createTask({
            mode: "sequential",
          }),
        ),
      ).rejects.toThrow(
        "Parallel planning requires a parallel execution strategy.",
      );
  
      expect(
        decomposer.decompose,
      ).not.toHaveBeenCalled();
    });
  
    it("rejects a task without an implementation plan", async () => {
      const decomposer = createDecomposer();
  
      const workflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      await expect(
        workflow.run(
          createTask({
            includePlan: false,
          }),
        ),
      ).rejects.toThrow(
        "Parallel planning requires an implementation plan.",
      );
  
      expect(
        decomposer.decompose,
      ).not.toHaveBeenCalled();
    });
  
    it("rejects a plan that still requires human input", async () => {
      const decomposer = createDecomposer();
  
      const workflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      await expect(
        workflow.run(
          createTask({
            planRequiresHumanInput: true,
          }),
        ),
      ).rejects.toThrow(
        "Cannot prepare parallel execution from a plan that still requires human input.",
      );
  
      expect(
        decomposer.decompose,
      ).not.toHaveBeenCalled();
    });
  
    it("rejects a task that has not reached plan approval", async () => {
      const decomposer = createDecomposer();
  
      const workflow =
        new ParallelPlanningWorkflow(
          decomposer,
        );
  
      await expect(
        workflow.run(
          createTask({
            status: "PLANNING",
          }),
        ),
      ).rejects.toThrow(
        "Cannot prepare parallel execution while task is in state PLANNING.",
      );
  
      expect(
        decomposer.decompose,
      ).not.toHaveBeenCalled();
    });
  });