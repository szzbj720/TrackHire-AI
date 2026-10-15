import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  routeTask,
} from "./adaptive-routing.js";
import {
  AdaptiveFactory,
  type AdaptiveFactoryResult,
  type ParallelValidationWorkflowAdapter,
  type SequentialFactoryAdapter,
} from "./adaptive-factory.js";
import type {
  ParallelExecutionResult,
} from "./parallel-execution-workflow.js";
import type {
  ParallelValidationResult,
} from "./parallel-validation-workflow.js";
import type {
  SequentialFactoryResult,
} from "./sequential-factory.js";

function createTask(): EngineeringTask {
  const now =
    new Date().toISOString();

  return {
    id: "TH-ADAPTIVE-001",
    request:
      "Test adaptive execution.",
    status: "TASK_CREATED",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createPlannedTask(
  mode:
    | "single-agent"
    | "sequential"
    | "parallel",
): EngineeringTask {
  return {
    ...createTask(),
    status:
      "AWAITING_PLAN_APPROVAL",
    strategy: {
      mode,
      reasoning:
        `Selected ${mode}.`,
    },
  };
}

function createPlannedResult(
  mode:
    | "single-agent"
    | "sequential"
    | "parallel",
): SequentialFactoryResult {
  return {
    run: {
      task:
        createPlannedTask(mode),
      repairs: [],
    },
    stopReason:
      "PLAN_APPROVAL_REQUIRED",
  };
}

function createParallelExecution(
  status:
    | "VALIDATING"
    | "NEEDS_HUMAN" =
      "VALIDATING",
): ParallelExecutionResult {
  return {
    task: {
      ...createPlannedTask(
        "parallel",
      ),
      status,
    },
    baseCommit:
      "1111111111111111111111111111111111111111",
    integrationWorktree: {
      path:
        "/repository-integration",
      branch:
        "factory/parallel-integration",
    },
    workerResults: [],
  };
}

function createParallelValidation(
  status:
    | "AWAITING_FINAL_APPROVAL"
    | "NEEDS_HUMAN"
    | "DIAGNOSING_FAILURE",
): ParallelValidationResult {
  const passed =
    status !==
    "DIAGNOSING_FAILURE";

  return {
    task: {
      ...createPlannedTask(
        "parallel",
      ),
      status,
    },
    implementation: {
      summary:
        "Integrated parallel implementation.",
      changedFiles: [],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    },
    validation: {
      passed,
      checks: [],
      failedChecks:
        passed
          ? []
          : ["test"],
      durationMs: 1,
    },
  };
}

function createParallelValidationRequiredResult(): AdaptiveFactoryResult {
  const parallelExecution =
    createParallelExecution();

  const route =
    routeTask(
      createPlannedTask(
        "parallel",
      ),
    );

  if (
    route.route !== "PARALLEL"
  ) {
    throw new Error(
      "Expected parallel routing decision.",
    );
  }

  return {
    run: {
      task:
        parallelExecution.task,
      worktree:
        parallelExecution.integrationWorktree,
      repairs: [],
    },
    route,
    workGraph: {
      units: [],
    },
    parallelExecution,
    stopReason:
      "PARALLEL_VALIDATION_REQUIRED",
  };
}

class FakeSequentialFactory
  implements SequentialFactoryAdapter
{
  calls = 0;

  constructor(
    private readonly result:
      SequentialFactoryResult,
  ) {}

  async start(): Promise<SequentialFactoryResult> {
    this.calls += 1;

    return this.result;
  }

  async resumeAfterPlanApproval(): Promise<never> {
    throw new Error(
      "resumeAfterPlanApproval should not be called in this test.",
    );
  }

  async resumeAfterFinalApproval(): Promise<never> {
    throw new Error(
      "resumeAfterFinalApproval should not be called in this test.",
    );
  }
}

class FakeParallelValidationWorkflow
  implements ParallelValidationWorkflowAdapter
{
  calls = 0;

  constructor(
    private readonly result:
      ParallelValidationResult,
  ) {}

  async run(
    _execution:
      ParallelExecutionResult,
  ): Promise<ParallelValidationResult> {
    this.calls += 1;

    return this.result;
  }
}

describe("AdaptiveFactory", () => {
  it("preserves the sequential approval path for sequential tasks", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "sequential",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const result =
      await factory.start(
        createTask(),
        "/repository",
      );

    expect(
      result.stopReason,
    ).toBe(
      "PLAN_APPROVAL_REQUIRED",
    );

    expect(
      result.route?.route,
    ).toBe(
      "SEQUENTIAL",
    );

    expect(
      sequentialFactory.calls,
    ).toBe(1);
  });

  it("routes low-risk tasks toward lightweight execution", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "single-agent",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const result =
      await factory.start(
        createTask(),
        "/repository",
      );

    expect(
      result.stopReason,
    ).toBe(
      "LIGHTWEIGHT_EXECUTION_REQUIRED",
    );

    expect(
      result.route?.route,
    ).toBe(
      "LIGHTWEIGHT",
    );
  });

  it("routes parallel tasks toward controlled parallel planning", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const result =
      await factory.start(
        createTask(),
        "/repository",
      );

    expect(
      result.stopReason,
    ).toBe(
      "PLAN_APPROVAL_REQUIRED",
    );

    expect(
      result.route?.route,
    ).toBe(
      "PARALLEL",
    );

    expect(
      result.route?.policy
        .disposition,
    ).toBe(
      "SUPPORTED_PARALLEL",
    );

    expect(
      result.run.worktree,
    ).toBeUndefined();

    expect(
      result.run.implementation,
    ).toBeUndefined();
  });

  it("preserves human escalation when planning already requires human input", async () => {
    const result:
      SequentialFactoryResult = {
        run: {
          task: {
            ...createTask(),
            status:
              "NEEDS_HUMAN",
          },
          repairs: [],
        },
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };

    const sequentialFactory =
      new FakeSequentialFactory(
        result,
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const adaptiveResult =
      await factory.start(
        createTask(),
        "/repository",
      );

    expect(
      adaptiveResult.stopReason,
    ).toBe(
      "HUMAN_INPUT_REQUIRED",
    );

    expect(
      adaptiveResult.route,
    ).toBeUndefined();
  });

  it("preserves planning failure", async () => {
    const result:
      SequentialFactoryResult = {
        run: {
          task: {
            ...createTask(),
            status: "FAILED",
          },
          repairs: [],
        },
        stopReason: "FAILED",
      };

    const sequentialFactory =
      new FakeSequentialFactory(
        result,
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const adaptiveResult =
      await factory.start(
        createTask(),
        "/repository",
      );

    expect(
      adaptiveResult.stopReason,
    ).toBe("FAILED");

    expect(
      adaptiveResult.route,
    ).toBeUndefined();
  });

  it("moves successful parallel validation to final approval", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const validationWorkflow =
      new FakeParallelValidationWorkflow(
        createParallelValidation(
          "AWAITING_FINAL_APPROVAL",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelValidation(
        createParallelValidationRequiredResult(),
      );

    expect(
      validationWorkflow.calls,
    ).toBe(1);

    expect(
      result.stopReason,
    ).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );

    expect(
      result.run.task.status,
    ).toBe(
      "AWAITING_FINAL_APPROVAL",
    );

    expect(
      result.run.implementation
        ?.summary,
    ).toBe(
      "Integrated parallel implementation.",
    );

    expect(
      result.run.validation
        ?.passed,
    ).toBe(true);
  });

  it("preserves parallel human escalation after validation and review", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const validationWorkflow =
      new FakeParallelValidationWorkflow(
        createParallelValidation(
          "NEEDS_HUMAN",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelValidation(
        createParallelValidationRequiredResult(),
      );

    expect(
      result.stopReason,
    ).toBe(
      "HUMAN_INPUT_REQUIRED",
    );

    expect(
      result.run.task.status,
    ).toBe(
      "NEEDS_HUMAN",
    );
  });

  it("preserves failed parallel validation for diagnosis instead of pretending it needs human input", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const validationWorkflow =
      new FakeParallelValidationWorkflow(
        createParallelValidation(
          "DIAGNOSING_FAILURE",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelValidation(
        createParallelValidationRequiredResult(),
      );

    expect(
      result.stopReason,
    ).toBe(
      "PARALLEL_DIAGNOSIS_REQUIRED",
    );

    expect(
      result.run.task.status,
    ).toBe(
      "DIAGNOSING_FAILURE",
    );

    expect(
      result.run.validation
        ?.passed,
    ).toBe(false);
  });

  it("allows final human approval to complete a reviewed parallel task", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const validationWorkflow =
      new FakeParallelValidationWorkflow(
        createParallelValidation(
          "AWAITING_FINAL_APPROVAL",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        validationWorkflow,
      );

    const validated =
      await factory.resumeAfterParallelValidation(
        createParallelValidationRequiredResult(),
      );

    const completed =
      await factory.resumeAfterFinalApproval(
        validated,
      );

    expect(
      validated.stopReason,
    ).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );

    expect(
      completed.stopReason,
    ).toBe(
      "COMPLETE",
    );

    expect(
      completed.run.task.status,
    ).toBe(
      "COMPLETE",
    );

    expect(
      completed.parallelExecution,
    ).toBeDefined();

    expect(
      completed.parallelValidation,
    ).toBeDefined();
  });
});