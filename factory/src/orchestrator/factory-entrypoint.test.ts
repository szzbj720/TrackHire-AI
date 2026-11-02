import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import { FactoryEntrypoint } from "./factory-entrypoint.js";
import type { FactoryRunner } from "./factory-runner.js";
import type { PlanningWorkflow } from "./planning-workflow.js";

function createTask(
  status: EngineeringTask["status"] = "TASK_CREATED",
): EngineeringTask {
  const now = "2026-11-02T21:00:00.000Z";

  return {
    id: "TH-E2E-001",
    request: "Add interview date support.",
    status,
    requirements: ["Store an optional interview date."],
    acceptanceCriteria: ["Existing applications remain valid."],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createPlanningWorkflow(
  plannedTask: EngineeringTask,
): PlanningWorkflow {
  return {
    run: vi.fn().mockResolvedValue({
      getTask: () => plannedTask,
    }),
  } as unknown as PlanningWorkflow;
}

function createFactoryRunner(): FactoryRunner {
  return {
    run: vi.fn(),
  } as unknown as FactoryRunner;
}

describe("FactoryEntrypoint", () => {
  it("returns the plan approval boundary without starting execution", async () => {
    const plannedTask = createTask("AWAITING_PLAN_APPROVAL");
    const planningWorkflow = createPlanningWorkflow(plannedTask);
    const factoryRunner = createFactoryRunner();
    const entrypoint = new FactoryEntrypoint(
      planningWorkflow,
      factoryRunner,
    );

    const result = await entrypoint.plan(
      createTask(),
      "/repo",
    );

    expect(result).toEqual({
      plannedTask,
      stopReason: "PLAN_APPROVAL_REQUIRED",
    });
    expect(factoryRunner.run).not.toHaveBeenCalled();
  });

  it("preserves the human input boundary from planning", async () => {
    const plannedTask = createTask("NEEDS_HUMAN");
    const entrypoint = new FactoryEntrypoint(
      createPlanningWorkflow(plannedTask),
      createFactoryRunner(),
    );

    const result = await entrypoint.plan(
      createTask(),
      "/repo",
    );

    expect(result).toEqual({
      plannedTask,
      stopReason: "HUMAN_INPUT_REQUIRED",
    });
  });

  it("delegates approved planned tasks to the factory runner", async () => {
    const plannedTask: EngineeringTask = {
      ...createTask("AWAITING_PLAN_APPROVAL"),
      strategy: {
        mode: "sequential",
        reasoning: "Use the full sequential workflow.",
      },
    };
    const factoryRunner = createFactoryRunner();
    const execution = {
      decision: {
        route: "SEQUENTIAL" as const,
        policy: {
          disposition: "SUPPORTED_SEQUENTIAL" as const,
          reasoning: "Sequential strategy is supported.",
        },
      },
      trace: {
        taskId: plannedTask.id,
        startedAt: "2026-11-02T21:01:00.000Z",
        observations: [],
      },
    };
    vi.mocked(factoryRunner.run).mockResolvedValue(
      execution,
    );
    const entrypoint = new FactoryEntrypoint(
      createPlanningWorkflow(plannedTask),
      factoryRunner,
    );

    const result = await entrypoint.resumeAfterPlanApproval(
      plannedTask,
      "/repo",
      "2026-11-02T21:01:00.000Z",
      "develop",
    );

    expect(factoryRunner.run).toHaveBeenCalledOnce();
    expect(factoryRunner.run).toHaveBeenCalledWith(
      plannedTask,
      "/repo",
      "2026-11-02T21:01:00.000Z",
      "develop",
    );
    expect(result).toBe(execution);
  });

  it("rejects execution before the plan approval boundary", async () => {
    const entrypoint = new FactoryEntrypoint(
      createPlanningWorkflow(createTask()),
      createFactoryRunner(),
    );

    await expect(
      entrypoint.resumeAfterPlanApproval(
        createTask("NEEDS_HUMAN"),
        "/repo",
      ),
    ).rejects.toThrow(
      "FactoryEntrypoint requires an approved planned task, received NEEDS_HUMAN.",
    );
  });
});
