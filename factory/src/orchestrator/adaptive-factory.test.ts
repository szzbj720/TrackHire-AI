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
  SequentialFactoryRun,
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

function createSequentialTrustRetryResult(): AdaptiveFactoryResult {
  const task: EngineeringTask = {
    ...createPlannedTask("sequential"),
    status: "AWAITING_FINAL_APPROVAL",
  };

  const route = routeTask(
    createPlannedTask("sequential"),
  );

  if (route.route !== "SEQUENTIAL") {
    throw new Error(
      "Expected sequential routing decision.",
    );
  }

  return {
    run: {
      task,
      repairs: [],
      trustDecision: {
        action: "RETRY",
        confidence: 0.8,
        reasons: [
          "Independent verification found an actionable failure.",
        ],
        evidence: [],
      },
    },
    route,
    stopReason:
      "TRUST_RETRY_REQUIRED",
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

  async resumeAfterTrustRetry(): Promise<never> {
    throw new Error(
      "resumeAfterTrustRetry should not be called in this test.",
    );
  }

  async resumeAfterFinalApproval(): Promise<never> {
    throw new Error(
      "resumeAfterFinalApproval should not be called in this test.",
    );
  }
}

class FakeTrustRetrySequentialFactory
  implements SequentialFactoryAdapter
{
  calls = 0;

  constructor(
    private readonly retryResult:
      SequentialFactoryResult,
  ) {}

  async start(): Promise<never> {
    throw new Error(
      "start should not be called in this test.",
    );
  }

  async resumeAfterPlanApproval(): Promise<never> {
    throw new Error(
      "resumeAfterPlanApproval should not be called in this test.",
    );
  }

  async resumeAfterTrustRetry(
    _run: SequentialFactoryRun,
  ): Promise<SequentialFactoryResult> {
    this.calls += 1;
    return this.retryResult;
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

  it("resumes sequential trust retry through the adaptive boundary", async () => {
    const retryResult:
      SequentialFactoryResult = {
        run: {
          task: {
            ...createPlannedTask(
              "sequential",
            ),
            status:
              "AWAITING_FINAL_APPROVAL",
            repairAttempts: 1,
          },
          repairs: [],
        },
        stopReason:
          "FINAL_APPROVAL_REQUIRED",
      };

    const sequentialFactory =
      new FakeTrustRetrySequentialFactory(
        retryResult,
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const result =
      await factory.resumeAfterTrustRetry(
        createSequentialTrustRetryResult(),
      );

    expect(
      sequentialFactory.calls,
    ).toBe(1);

    expect(
      result.route?.route,
    ).toBe("SEQUENTIAL");

    expect(
      result.stopReason,
    ).toBe(
      "FINAL_APPROVAL_REQUIRED",
    );

    expect(
      result.run.task.repairAttempts,
    ).toBe(1);
  });

  it("preserves human escalation after sequential trust retry", async () => {
    const retryResult:
      SequentialFactoryResult = {
        run: {
          task: {
            ...createPlannedTask(
              "sequential",
            ),
            status: "NEEDS_HUMAN",
            repairAttempts: 1,
          },
          repairs: [],
          trustDecision: {
            action: "ESCALATE",
            confidence: 0.7,
            reasons: [
              "The autonomous repair boundary was reached.",
            ],
            evidence: [],
          },
        },
        stopReason:
          "HUMAN_INPUT_REQUIRED",
      };

    const sequentialFactory =
      new FakeTrustRetrySequentialFactory(
        retryResult,
      );

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
      );

    const result =
      await factory.resumeAfterTrustRetry(
        createSequentialTrustRetryResult(),
      );

    expect(
      sequentialFactory.calls,
    ).toBe(1);
    expect(result.route?.route).toBe("SEQUENTIAL");
    expect(result.stopReason).toBe("HUMAN_INPUT_REQUIRED");
    expect(result.run.task.status).toBe("NEEDS_HUMAN");
    expect(result.run.trustDecision?.action).toBe("ESCALATE");
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
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelExecution(
        createParallelValidationRequiredResult(),
      );

    expect(validationWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("FINAL_APPROVAL_REQUIRED");
  });

  it("preserves human escalation from parallel validation", async () => {
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
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelExecution(
        createParallelValidationRequiredResult(),
      );

    expect(validationWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("HUMAN_INPUT_REQUIRED");
  });

  it("moves failed parallel validation to diagnosis", async () => {
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
        validationWorkflow,
      );

    const result =
      await factory.resumeAfterParallelExecution(
        createParallelValidationRequiredResult(),
      );

    expect(validationWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("PARALLEL_DIAGNOSIS_REQUIRED");
  });

  it("moves repairable parallel diagnosis to repair", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const diagnosisWorkflow =
      new FakeDiagnosisWorkflow({
        task: {
          ...createPlannedTask("parallel"),
          status: "REPAIRING",
        },
        diagnosis: createRepairableDiagnosis(),
      });

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        diagnosisWorkflow,
      );

    const result =
      await factory.resumeAfterParallelDiagnosis(
        createDiagnosisRequiredResult(),
      );

    expect(diagnosisWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("PARALLEL_REPAIR_REQUIRED");
  });

  it("moves successful parallel repair to review", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const repairWorkflow =
      new FakeRepairWorkflow({
        task: {
          ...createPlannedTask("parallel"),
          status: "REVIEWING",
        },
        implementation: {
          summary: "Repaired parallel implementation.",
          changedFiles: [],
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

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
        undefined,
        undefined,
        undefined,
        undefined,
        repairWorkflow,
      );

    const result =
      await factory.resumeAfterParallelDiagnosis(
        createRepairRequiredResult(),
      );

    expect(repairWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("PARALLEL_REVIEW_REQUIRED");
  });

  it("moves successful parallel review to final approval", async () => {
    const sequentialFactory =
      new FakeSequentialFactory(
        createPlannedResult(
          "parallel",
        ),
      );

    const reviewWorkflow =
      new FakeReviewWorkflow({
        task: {
          ...createPlannedTask("parallel"),
          status: "AWAITING_FINAL_APPROVAL",
        },
        review: {
          approved: true,
          summary: "Parallel work is ready.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.95,
        },
        changeEvidence: {
          approvedFiles: [],
          reportedFiles: [],
          observedFiles: [],
          unreportedFiles: [],
          missingReportedFiles: [],
          unapprovedFiles: [],
          withinApprovedScope: true,
          reportMatchesObserved: true,
          patch: "",
        },
      });

    const factory =
      new AdaptiveFactory(
        sequentialFactory,
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

    expect(reviewWorkflow.calls).toBe(1);
    expect(result.stopReason).toBe("FINAL_APPROVAL_REQUIRED");
  });
});
