import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    TaskAnalyzer,
  } from "../agents/analyzer.js";
  import type {
    Planner,
  } from "../agents/planner.js";
  import type {
    RepositoryContext,
  } from "../context/context-builder.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import {
    PlanningWorkflow,
  } from "./planning-workflow.js";
  import {
    SequentialFactory,
  } from "./sequential-factory.js";
  
  class FakeAnalyzer implements TaskAnalyzer {
    constructor(
      private readonly analysis:
        TaskAnalysis,
    ) {}
  
    async analyze(
      _task: EngineeringTask,
      _context: RepositoryContext,
    ): Promise<TaskAnalysis> {
      return this.analysis;
    }
  }
  
  class FakePlanner implements Planner {
    constructor(
      private readonly planResult:
        ImplementationPlan,
    ) {}
  
    async plan(
      _task: EngineeringTask,
      _analysis: TaskAnalysis,
      _context: RepositoryContext,
    ): Promise<ImplementationPlan> {
      return this.planResult;
    }
  }
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add optional interview date tracking.",
      status: "TASK_CREATED",
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
  
  function createAnalysis(
    overrides: Partial<TaskAnalysis> = {},
  ): TaskAnalysis {
    return {
      complexity: "medium",
      risk: "medium",
      affectedAreas: [
        "application model",
      ],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: [],
      assumptions: [
        "Interview date is optional.",
      ],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning:
        "The task changes application data.",
      ...overrides,
    };
  }
  
  function createPlan(
    overrides:
      Partial<ImplementationPlan> = {},
  ): ImplementationPlan {
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
      ...overrides,
    };
  }
  
  function createFactory(
    analysis = createAnalysis(),
    plan = createPlan(),
  ): SequentialFactory {
    const planningWorkflow =
      new PlanningWorkflow(
        new FakeAnalyzer(analysis),
        new FakePlanner(plan),
      );
  
    return new SequentialFactory(
      planningWorkflow,
    );
  }
  
  describe("SequentialFactory", () => {
    it("stops for human approval after successful planning", async () => {
      const factory = createFactory();
  
      const result = await factory.start(
        createTask(),
        process.cwd(),
      );
  
      expect(result.stopReason).toBe(
        "PLAN_APPROVAL_REQUIRED",
      );
  
      expect(result.run.task.status).toBe(
        "AWAITING_PLAN_APPROVAL",
      );
  
      expect(
        result.run.task.analysis,
      ).toBeDefined();
  
      expect(
        result.run.task.plan,
      ).toBeDefined();
  
      expect(result.run.repairs).toEqual(
        [],
      );
    });
  
    it("stops for human input when analysis requires it", async () => {
      const factory = createFactory(
        createAnalysis({
          requiresHumanInput: true,
          ambiguities: [
            "Interview date behavior is unclear.",
          ],
        }),
      );
  
      const result = await factory.start(
        createTask(),
        process.cwd(),
      );
  
      expect(result.stopReason).toBe(
        "HUMAN_INPUT_REQUIRED",
      );
  
      expect(result.run.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(
        result.run.task.plan,
      ).toBeUndefined();
    });
  
    it("stops for human input when the plan requires it", async () => {
      const factory = createFactory(
        createAnalysis(),
        createPlan({
          requiresHumanInput: true,
        }),
      );
  
      const result = await factory.start(
        createTask(),
        process.cwd(),
      );
  
      expect(result.stopReason).toBe(
        "HUMAN_INPUT_REQUIRED",
      );
  
      expect(result.run.task.status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(
        result.run.task.plan,
      ).toBeDefined();
    });
  
    it("rejects a task that has already started", async () => {
      const factory = createFactory();
  
      const task = createTask();
      task.status = "ANALYZING";
  
      await expect(
        factory.start(
          task,
          process.cwd(),
        ),
      ).rejects.toThrow(
        "Cannot start sequential factory while task is in state ANALYZING",
      );
    });
  });