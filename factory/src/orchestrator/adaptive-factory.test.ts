import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  FailureDiagnosis,
} from "../schemas/diagnosis.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  routeTask,
} from "./adaptive-routing.js";
import {
  AdaptiveFactory,
  type AdaptiveFactoryResult,
  type DiagnosisWorkflowAdapter,
  type ParallelValidationWorkflowAdapter,
  type RepairWorkflowAdapter,
  type ReviewWorkflowAdapter,
  type SequentialFactoryAdapter,
} from "./adaptive-factory.js";
import type {
  DiagnosisWorkflowInput,
  DiagnosisWorkflowResult,
} from "./diagnosis-workflow.js";
import type {
  ParallelExecutionResult,
} from "./parallel-execution-workflow.js";
import type {
  ParallelValidationResult,
} from "./parallel-validation-workflow.js";
import type {
  RepairWorkflowInput,
  RepairWorkflowResult,
} from "./repair-workflow.js";
import type {
  ReviewWorkflowInput,
  ReviewWorkflowResult,
} from "./review-workflow.js";
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

function createRepairableDiagnosis(): FailureDiagnosis {
  return {
    category:
      "TEST_REGRESSION",
    summary:
      "The implementation caused a test regression.",
    evidence: [
      "The deterministic test check failed.",
    ],
    suspectedFiles: [
      "lib/example.dart",
    ],
    recommendedAction:
      "Repair the implementation and rerun validation.",
    repairable: true,
    confidence: 0.9,
    requiresHumanInput: false,
  };
}

function createDiagnosisRequiredResult(): AdaptiveFactoryResult {
  const result =
    createParallelValidationRequiredResult();

  return {
    ...result,
    run: {
      ...result.run,
      task: {
        ...result.run.task,
        status:
          "DIAGNOSING_FAILURE",
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
        passed: false,
        checks: [],
        failedChecks: [
          "test",
        ],
        durationMs: 1,
      },
    },
    stopReason:
      "PARALLEL_DIAGNOSIS_REQUIRED",
  };
}

function createRepairRequiredResult(): AdaptiveFactoryResult {
  const result =
    createDiagnosisRequiredResult();

  const diagnosis =
    createRepairableDiagnosis();

  return {
    ...result,
    run: {
      ...result.run,
      task: {
        ...result.run.task,
        status: "REPAIRING",
      },
      diagnosis,
    },
    diagnosis,
    stopReason:
      "PARALLEL_REPAIR_REQUIRED",
  };
}

function createReviewRequiredResult(): AdaptiveFactoryResult {
  const result =
    createRepairRequiredResult();

  return {
    ...result,
    run: {
      ...result.run,
      task: {
        ...result.run.task,
        status: "REVIEWING",
      },
      validation: {
        passed: true,
        checks: [],
        failedChecks: [],
        durationMs: 1,
      },
    },
    stopReason:
      "PARALLEL_REVIEW_REQUIRED",
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

class FakeDiagnosisWorkflow
  implements DiagnosisWorkflowAdapter
{
  calls = 0;

  constructor(
    private readonly result:
      DiagnosisWorkflowResult,
  ) {}

  async run(
    _input:
      DiagnosisWorkflowInput,
  ): Promise<DiagnosisWorkflowResult> {
    this.calls += 1;

    return this.result;
  }
}

class FakeRepairWorkflow
  implements RepairWorkflowAdapter
{
  calls = 0;

  constructor(
    private readonly result:
      RepairWorkflowResult,
  ) {}

  async run(
    _input:
      RepairWorkflowInput,
  ): Promise<RepairWorkflowResult> {
    this.calls += 1;

    return this.result;
  }
}

class FakeReviewWorkflow
  implements ReviewWorkflowAdapter
{
  calls = 0;

  lastInput:
    ReviewWorkflowInput | undefined;

  constructor(
    private readonly result:
      ReviewWorkflowResult,
  ) {}

  async run(
    input:
      ReviewWorkflowInput,
  ): Promise<ReviewWorkflowResult> {
    this.calls += 1;
    this.lastInput = input;

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

  it("routes a repairable parallel diagnosis into repair", async () => {
    const diagnosis =
      createRepairableDiagnosis();

    const diagnosisWorkflow =
      new FakeDiagnosisWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status: "REPAIRING",
        },
        diagnosis,
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        diagnosisWorkflow,
      );

    const result =
      await factory.resumeAfterParallelDiagnosis(
        createDiagnosisRequiredResult(),
      );

    expect(
      diagnosisWorkflow.calls,
    ).toBe(1);

    expect(
      result.stopReason,
    ).toBe(
      "PARALLEL_REPAIR_REQUIRED",
    );

    expect(
      result.run.task.status,
    ).toBe("REPAIRING");

    expect(
      result.diagnosis,
    ).toEqual(diagnosis);

    expect(
      result.run.diagnosis,
    ).toEqual(diagnosis);
  });

  it("preserves human escalation when diagnosis cannot continue automatically", async () => {
    const diagnosis:
      FailureDiagnosis = {
        category:
          "REQUIREMENT_AMBIGUITY",
        summary:
          "The failure depends on an ambiguous requirement.",
        evidence: [
          "The expected behavior cannot be determined from the task.",
        ],
        suspectedFiles: [],
        recommendedAction:
          "Ask a human to clarify the requirement.",
        repairable: false,
        confidence: 0.9,
        requiresHumanInput: true,
      };

    const diagnosisWorkflow =
      new FakeDiagnosisWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "NEEDS_HUMAN",
        },
        diagnosis,
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        diagnosisWorkflow,
      );

    const result =
      await factory.resumeAfterParallelDiagnosis(
        createDiagnosisRequiredResult(),
      );

    expect(
      diagnosisWorkflow.calls,
    ).toBe(1);

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

    expect(
      result.diagnosis,
    ).toEqual(diagnosis);
  });

  it("moves a successful parallel repair into review", async () => {
    const repairWorkflow =
      new FakeRepairWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status: "REVIEWING",
        },
        repair: {
          summary:
            "Repaired the failing implementation.",
          changedFiles: [
            {
              path:
                "lib/example.dart",
              changeType:
                "modified",
              summary:
                "Fixed the regression.",
            },
          ],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        },
        validation: {
          passed: true,
          checks: [],
          failedChecks: [],
          durationMs: 1,
        },
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        repairWorkflow,
      );

    const result =
      await factory.resumeAfterParallelRepair(
        createRepairRequiredResult(),
      );

    expect(
      repairWorkflow.calls,
    ).toBe(1);

    expect(
      result.stopReason,
    ).toBe(
      "PARALLEL_REVIEW_REQUIRED",
    );

    expect(
      result.run.task.status,
    ).toBe("REVIEWING");

    expect(
      result.run.validation
        ?.passed,
    ).toBe(true);

    expect(
      result.run.repairs,
    ).toHaveLength(1);
  });

  it("returns a failed parallel repair to diagnosis", async () => {
    const repairWorkflow =
      new FakeRepairWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "DIAGNOSING_FAILURE",
        },
        repair: {
          summary:
            "Attempted to repair the implementation.",
          changedFiles: [
            {
              path:
                "lib/example.dart",
              changeType:
                "modified",
              summary:
                "Attempted regression repair.",
            },
          ],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        },
        validation: {
          passed: false,
          checks: [],
          failedChecks: [
            "test",
          ],
          durationMs: 1,
        },
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        repairWorkflow,
      );

    const result =
      await factory.resumeAfterParallelRepair(
        createRepairRequiredResult(),
      );

    expect(
      repairWorkflow.calls,
    ).toBe(1);

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

    expect(
      result.run.repairs,
    ).toHaveLength(1);
  });

  it("preserves human escalation when bounded repair stops", async () => {
    const repairWorkflow =
      new FakeRepairWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "NEEDS_HUMAN",
        },
        validation: {
          passed: false,
          checks: [],
          failedChecks: [
            "test",
          ],
          durationMs: 1,
        },
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        repairWorkflow,
      );

    const result =
      await factory.resumeAfterParallelRepair(
        createRepairRequiredResult(),
      );

    expect(
      repairWorkflow.calls,
    ).toBe(1);

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

    expect(
      result.run.repairs,
    ).toHaveLength(0);
  });

  it("moves an approved post-repair review to final approval", async () => {
    const reviewWorkflow =
      new FakeReviewWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "AWAITING_FINAL_APPROVAL",
        },
        review: {
          approved: true,
          summary:
            "The repaired implementation is ready for final approval.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.95,
        },
        changeEvidence: {
          approvedFiles: [
            "lib/example.dart",
          ],
          reportedFiles: [
            "lib/example.dart",
          ],
          observedFiles: [
            "lib/example.dart",
          ],
          unreportedFiles: [],
          missingReportedFiles: [],
          unapprovedFiles: [],
          withinApprovedScope: true,
          reportMatchesObserved: true,
          patch:
            "diff --git a/lib/example.dart b/lib/example.dart",
        },
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        reviewWorkflow,
      );

    const result =
      await factory.resumeAfterParallelReview(
        createReviewRequiredResult(),
      );

    expect(
      reviewWorkflow.calls,
    ).toBe(1);

    expect(
      reviewWorkflow.lastInput
        ?.baseRef,
    ).toBe(
      "1111111111111111111111111111111111111111",
    );

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
      result.run.review
        ?.approved,
    ).toBe(true);

    expect(
      result.run.changeEvidence
        ?.withinApprovedScope,
    ).toBe(true);
  });

  it("preserves human escalation from post-repair review", async () => {
    const reviewWorkflow =
      new FakeReviewWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "NEEDS_HUMAN",
        },
        review: {
          approved: false,
          summary:
            "The reviewer found uncertainty that requires human judgment.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: true,
          confidence: 0.5,
        },
        changeEvidence: {
          approvedFiles: [
            "lib/example.dart",
          ],
          reportedFiles: [
            "lib/example.dart",
          ],
          observedFiles: [
            "lib/example.dart",
          ],
          unreportedFiles: [],
          missingReportedFiles: [],
          unapprovedFiles: [],
          withinApprovedScope: true,
          reportMatchesObserved: true,
          patch:
            "diff --git a/lib/example.dart b/lib/example.dart",
        },
      });

    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        reviewWorkflow,
      );

    const result =
      await factory.resumeAfterParallelReview(
        createReviewRequiredResult(),
      );

    expect(
      reviewWorkflow.calls,
    ).toBe(1);

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

  it("completes the full adaptive parallel recovery lifecycle", async () => {
    const diagnosis =
      createRepairableDiagnosis();

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

    const diagnosisWorkflow =
      new FakeDiagnosisWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status: "REPAIRING",
        },
        diagnosis,
      });

    const repairWorkflow =
      new FakeRepairWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status: "REVIEWING",
        },
        repair: {
          summary:
            "Repaired the failing parallel implementation.",
          changedFiles: [
            {
              path:
                "lib/example.dart",
              changeType:
                "modified",
              summary:
                "Fixed the test regression.",
            },
          ],
          commandsRun: [],
          assumptions: [],
          warnings: [],
          requiresHumanInput: false,
        },
        validation: {
          passed: true,
          checks: [],
          failedChecks: [],
          durationMs: 1,
        },
      });

    const reviewWorkflow =
      new FakeReviewWorkflow({
        task: {
          ...createPlannedTask(
            "parallel",
          ),
          status:
            "AWAITING_FINAL_APPROVAL",
        },
        review: {
          approved: true,
          summary:
            "The repaired implementation passed independent review.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.95,
        },
        changeEvidence: {
          approvedFiles: [
            "lib/example.dart",
          ],
          reportedFiles: [
            "lib/example.dart",
          ],
          observedFiles: [
            "lib/example.dart",
          ],
          unreportedFiles: [],
          missingReportedFiles: [],
          unapprovedFiles: [],
          withinApprovedScope: true,
          reportMatchesObserved: true,
          patch:
            "diff --git a/lib/example.dart b/lib/example.dart",
        },
      });

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        validationWorkflow,
        diagnosisWorkflow,
        repairWorkflow,
        reviewWorkflow,
      );

    const validationRequired =
      createParallelValidationRequiredResult();

    const diagnosed =
      await factory.resumeAfterParallelValidation(
        validationRequired,
      );

    expect(
      diagnosed.stopReason,
    ).toBe(
      "PARALLEL_DIAGNOSIS_REQUIRED",
    );

    expect(
      diagnosed.run.task.status,
    ).toBe(
      "DIAGNOSING_FAILURE",
    );

    const repairRequired =
      await factory.resumeAfterParallelDiagnosis(
        diagnosed,
      );

    expect(
      repairRequired.stopReason,
    ).toBe(
      "PARALLEL_REPAIR_REQUIRED",
    );

    expect(
      repairRequired.run.task.status,
    ).toBe(
      "REPAIRING",
    );

    const reviewRequired =
      await factory.resumeAfterParallelRepair(
        repairRequired,
      );

    expect(
      reviewRequired.stopReason,
    ).toBe(
      "PARALLEL_REVIEW_REQUIRED",
    );

    expect(
      reviewRequired.run.task.status,
    ).toBe(
      "REVIEWING",
    );

    expect(
      reviewRequired.run.validation
        ?.passed,
    ).toBe(true);

    expect(
      reviewRequired.run.repairs,
    ).toHaveLength(1);

    const finalApprovalRequired =
      await factory.resumeAfterParallelReview(
        reviewRequired,
      );

    expect(
      finalApprovalRequired.stopReason,
    ).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );

    expect(
      finalApprovalRequired.run.task.status,
    ).toBe(
      "AWAITING_FINAL_APPROVAL",
    );

    expect(
      finalApprovalRequired.run.review
        ?.approved,
    ).toBe(true);

    expect(
      finalApprovalRequired.run.changeEvidence
        ?.withinApprovedScope,
    ).toBe(true);

    const completed =
      await factory.resumeAfterFinalApproval(
        finalApprovalRequired,
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
      validationWorkflow.calls,
    ).toBe(1);

    expect(
      diagnosisWorkflow.calls,
    ).toBe(1);

    expect(
      repairWorkflow.calls,
    ).toBe(1);

    expect(
      reviewWorkflow.calls,
    ).toBe(1);

    expect(
      completed.run.repairs,
    ).toHaveLength(1);

    expect(
      completed.parallelExecution,
    ).toBeDefined();
  });
});