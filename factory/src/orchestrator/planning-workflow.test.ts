import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
  } from "vitest";
  import {
    mkdtemp,
    mkdir,
    rm,
    writeFile,
  } from "node:fs/promises";
  import { join } from "node:path";
  import { tmpdir } from "node:os";
  
  import type { TaskAnalyzer } from "../agents/analyzer.js";
  import type { Planner } from "../agents/planner.js";
  import type { RepositoryContext } from "../context/context-builder.js";
  import type { ImplementationPlan } from "../schemas/plan.js";
  import type {
    EngineeringTask,
    TaskAnalysis,
  } from "../schemas/task.js";
  import { PlanningWorkflow } from "./planning-workflow.js";
  
  function createTask(): EngineeringTask {
    const now = new Date().toISOString();
  
    return {
      id: "TH-001",
      request:
        "Add an optional interview date to a TrackHire application.",
      status: "TASK_CREATED",
      requirements: [
        "Store an optional interview date.",
      ],
      acceptanceCriteria: [
        "Applications can exist without an interview date.",
      ],
      constraints: [],
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  function createAnalysis(
    requiresHumanInput = false,
  ): TaskAnalysis {
    return {
      complexity: "medium",
      risk: "medium",
      affectedAreas: ["application model"],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: requiresHumanInput
        ? ["Interview date format is unclear."]
        : [],
      assumptions: [],
      confidence: requiresHumanInput ? 0.5 : 0.9,
      requiresHumanInput,
      reasoning:
        "The task changes application data.",
    };
  }
  
  function createPlan(
    requiresHumanInput = false,
  ): ImplementationPlan {
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
            "The model must represent the interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run Flutter tests.",
      ],
      risks: [],
      assumptions: [],
      requiresHumanInput,
    };
  }
  
  class FakeAnalyzer implements TaskAnalyzer {
    calls = 0;
  
    constructor(
      private readonly analysis: TaskAnalysis,
    ) {}
  
    async analyze(
      _task: EngineeringTask,
      _context: RepositoryContext,
    ): Promise<TaskAnalysis> {
      this.calls += 1;
      return this.analysis;
    }
  }
  
  class FakePlanner implements Planner {
    calls = 0;
  
    constructor(
      private readonly planResult: ImplementationPlan,
    ) {}
  
    async plan(
      _task: EngineeringTask,
      _analysis: TaskAnalysis,
      _context: RepositoryContext,
    ): Promise<ImplementationPlan> {
      this.calls += 1;
      return this.planResult;
    }
  }
  
  describe("PlanningWorkflow", () => {
    let repositoryRoot: string;
  
    beforeEach(async () => {
      repositoryRoot = await mkdtemp(
        join(tmpdir(), "factory-workflow-"),
      );
  
      await mkdir(
        join(repositoryRoot, "lib", "models"),
        {
          recursive: true,
        },
      );
  
      await writeFile(
        join(
          repositoryRoot,
          "lib",
          "models",
          "job_application.dart",
        ),
        "class JobApplication {}",
      );
    });
  
    afterEach(async () => {
      await rm(repositoryRoot, {
        recursive: true,
        force: true,
      });
    });
  
    it("runs analysis and planning before waiting for human approval", async () => {
      const analyzer = new FakeAnalyzer(
        createAnalysis(),
      );
      const planner = new FakePlanner(
        createPlan(),
      );
  
      const workflow = new PlanningWorkflow(
        analyzer,
        planner,
      );
  
      const orchestrator = await workflow.run(
        createTask(),
        repositoryRoot,
      );
  
      expect(orchestrator.getTask().status).toBe(
        "AWAITING_PLAN_APPROVAL",
      );
  
      expect(orchestrator.getTask().analysis).toEqual(
        createAnalysis(),
      );
  
      expect(orchestrator.getTask().plan).toEqual(
        createPlan(),
      );
  
      expect(analyzer.calls).toBe(1);
      expect(planner.calls).toBe(1);
    });
  
    it("stops before planning when analysis requires human input", async () => {
      const analyzer = new FakeAnalyzer(
        createAnalysis(true),
      );
      const planner = new FakePlanner(
        createPlan(),
      );
  
      const workflow = new PlanningWorkflow(
        analyzer,
        planner,
      );
  
      const orchestrator = await workflow.run(
        createTask(),
        repositoryRoot,
      );
  
      expect(orchestrator.getTask().status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(orchestrator.getTask().analysis).toBeDefined();
      expect(orchestrator.getTask().plan).toBeUndefined();
  
      expect(analyzer.calls).toBe(1);
      expect(planner.calls).toBe(0);
    });
  
    it("stops after planning when the plan requires human input", async () => {
      const analyzer = new FakeAnalyzer(
        createAnalysis(),
      );
      const planner = new FakePlanner(
        createPlan(true),
      );
  
      const workflow = new PlanningWorkflow(
        analyzer,
        planner,
      );
  
      const orchestrator = await workflow.run(
        createTask(),
        repositoryRoot,
      );
  
      expect(orchestrator.getTask().status).toBe(
        "NEEDS_HUMAN",
      );
  
      expect(orchestrator.getTask().analysis).toBeDefined();
      expect(orchestrator.getTask().plan).toEqual(
        createPlan(true),
      );
  
      expect(analyzer.calls).toBe(1);
      expect(planner.calls).toBe(1);
    });
  
    it("records the expected workflow transitions", async () => {
      const workflow = new PlanningWorkflow(
        new FakeAnalyzer(createAnalysis()),
        new FakePlanner(createPlan()),
      );
  
      const orchestrator = await workflow.run(
        createTask(),
        repositoryRoot,
      );
  
      const transitions = orchestrator
        .getEvents()
        .map((event) => event.transition);
  
      expect(transitions).toEqual([
        {
          from: "TASK_CREATED",
          to: "ANALYZING",
        },
        {
          from: "ANALYZING",
          to: "PLANNING",
        },
        {
          from: "PLANNING",
          to: "AWAITING_PLAN_APPROVAL",
        },
      ]);
    });
  });