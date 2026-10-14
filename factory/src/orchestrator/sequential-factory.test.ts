import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  TaskAnalyzer,
} from "../agents/analyzer.js";
import type {
  Builder,
  BuilderInput,
} from "../agents/builder.js";
import type {
  Diagnostician,
  DiagnosticianInput,
} from "../agents/diagnostician.js";
import type {
  Planner,
} from "../agents/planner.js";
import type {
  Repairer,
  RepairerInput,
} from "../agents/repairer.js";
import type {
  RepositoryContext,
} from "../context/context-builder.js";
import type {
  FailureDiagnosis,
} from "../schemas/diagnosis.js";
import type {
  ImplementationResult,
} from "../schemas/implementation.js";
import type {
  ImplementationPlan,
} from "../schemas/plan.js";
import type {
  EngineeringTask,
  TaskAnalysis,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import {
  Workspace,
} from "../tools/workspace.js";
import type {
  Validator,
} from "../validation/validator.js";
import {
  DiagnosisWorkflow,
} from "./diagnosis-workflow.js";
import {
  ImplementationWorkflow,
} from "./implementation-workflow.js";
import {
  PlanningWorkflow,
} from "./planning-workflow.js";
import {
  RepairWorkflow,
} from "./repair-workflow.js";
import {
  SequentialFactory,
} from "./sequential-factory.js";

const execFileAsync =
  promisify(execFile);

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

class FakeBuilder implements Builder {
  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    const workspace = new Workspace(
      input.worktreePath,
    );

    await workspace.write(
      "lib/models/job_application.dart",
      "class JobApplication {\n  DateTime? interviewDate;\n}\n",
    );

    return {
      summary:
        "Added interview date support.",
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interviewDate field.",
        },
      ],
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
}

class FakeValidator implements Validator {
  constructor(
    private readonly passed = true,
  ) {}

  async validate(
    _worktreePath: string,
  ): Promise<ValidationResult> {
    return createValidation(
      this.passed,
    );
  }
}

class SequenceValidator
  implements Validator {
  private index = 0;

  constructor(
    private readonly results:
      ValidationResult[],
  ) {}

  async validate(
    _worktreePath: string,
  ): Promise<ValidationResult> {
    const result =
      this.results[this.index];

    if (!result) {
      throw new Error(
        "SequenceValidator ran out of validation results.",
      );
    }

    this.index += 1;

    return result;
  }
}

class FakeDiagnostician
  implements Diagnostician {
  constructor(
    private readonly diagnosis:
      FailureDiagnosis,
  ) {}

  async diagnose(
    _input: DiagnosticianInput,
  ): Promise<FailureDiagnosis> {
    return this.diagnosis;
  }
}

class FakeRepairer implements Repairer {
  constructor(
    private readonly result:
      ImplementationResult =
        createRepair(),
  ) {}

  async repair(
    _input: RepairerInput,
  ): Promise<ImplementationResult> {
    return this.result;
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

function createRepairableDiagnosis():
  FailureDiagnosis {
  return {
    category: "TEST_REGRESSION",
    summary:
      "The implementation caused a test regression.",
    evidence: [
      "Flutter tests exited with code 1.",
    ],
    suspectedFiles: [
      "lib/models/job_application.dart",
    ],
    recommendedAction:
      "Repair the implementation and rerun validation.",
    repairable: true,
    confidence: 0.9,
    requiresHumanInput: false,
  };
}

function createHumanDiagnosis():
  FailureDiagnosis {
  return {
    category:
      "REQUIREMENT_AMBIGUITY",
    summary:
      "The failure cannot be repaired safely without clarification.",
    evidence: [
      "The expected behavior is ambiguous.",
    ],
    suspectedFiles: [
      "lib/models/job_application.dart",
    ],
    recommendedAction:
      "Ask a human to clarify the requirement.",
    repairable: false,
    confidence: 0.8,
    requiresHumanInput: true,
  };
}

function createRepair(
  requiresHumanInput = false,
): ImplementationResult {
  return {
    summary:
      requiresHumanInput
        ? "Repair requires clarification."
        : "Repaired the implementation.",
    changedFiles:
      requiresHumanInput
        ? []
        : [
            {
              path:
                "lib/models/job_application.dart",
              changeType: "modified",
              summary:
                "Repaired the application model.",
            },
          ],
    commandsRun: [],
    assumptions: [],
    warnings: [],
    requiresHumanInput,
  };
}

function createValidation(
  passed: boolean,
): ValidationResult {
  return {
    passed,
    checks: [
      {
        name: "Flutter tests",
        command: "flutter",
        args: ["test"],
        exitCode: passed ? 0 : 1,
        stdout:
          passed
            ? "All tests passed."
            : "",
        stderr:
          passed
            ? ""
            : "Tests failed.",
        durationMs: 100,
        passed,
      },
    ],
    failedChecks:
      passed
        ? []
        : ["Flutter tests"],
    durationMs: 100,
  };
}

function createFactory(
  analysis = createAnalysis(),
  plan = createPlan(),
  validator?: Validator,
  diagnostician?: Diagnostician,
  repairer?: Repairer,
): SequentialFactory {
  const planningWorkflow =
    new PlanningWorkflow(
      new FakeAnalyzer(analysis),
      new FakePlanner(plan),
    );

  const implementationWorkflow =
    validator
      ? new ImplementationWorkflow(
          new FakeBuilder(),
          validator,
        )
      : undefined;

  const diagnosisWorkflow =
    diagnostician
      ? new DiagnosisWorkflow(
          diagnostician,
        )
      : undefined;

  const repairWorkflow =
    repairer && validator
      ? new RepairWorkflow(
          repairer,
          validator,
        )
      : undefined;

  return new SequentialFactory(
    planningWorkflow,
    implementationWorkflow,
    diagnosisWorkflow,
    repairWorkflow,
  );
}

async function createTemporaryRepository():
  Promise<string> {
  const repositoryRoot =
    await mkdtemp(
      join(
        tmpdir(),
        "factory-sequential-test-",
      ),
    );

  await execFileAsync(
    "git",
    ["init"],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "config",
      "user.email",
      "factory@example.com",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "config",
      "user.name",
      "Factory Test",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  const modelDirectory = join(
    repositoryRoot,
    "lib",
    "models",
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

  await execFileAsync(
    "git",
    ["add", "."],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "commit",
      "-m",
      "Initial commit",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  await execFileAsync(
    "git",
    [
      "branch",
      "-M",
      "main",
    ],
    {
      cwd: repositoryRoot,
    },
  );

  return repositoryRoot;
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

  it("resumes after plan approval and reaches review when validation passes", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      new FakeValidator(true),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "READY_FOR_REVIEW",
    );

    expect(result.run.task.status).toBe(
      "REVIEWING",
    );

    expect(
      result.run.worktree,
    ).toBeDefined();

    expect(
      result.run.implementation,
    ).toBeDefined();

    expect(
      result.run.validation?.passed,
    ).toBe(true);

    expect(result.run.repairs).toEqual(
      [],
    );

    const worktreePath =
      result.run.worktree?.path;

    expect(worktreePath).toBeDefined();

    if (!worktreePath) {
      throw new Error(
        "Expected worktree path.",
      );
    }

    const worktreeContent =
      await readFile(
        join(
          worktreePath,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );

    expect(worktreeContent).toContain(
      "DateTime? interviewDate",
    );

    const originalContent =
      await readFile(
        join(
          repositoryRoot,
          "lib",
          "models",
          "job_application.dart",
        ),
        "utf8",
      );

    expect(originalContent).toBe(
      "class JobApplication {}\n",
    );
  });

  it("repairs a failed implementation and reaches review when revalidation passes", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const validator =
      new SequenceValidator([
        createValidation(false),
        createValidation(true),
      ]);

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      validator,
      new FakeDiagnostician(
        createRepairableDiagnosis(),
      ),
      new FakeRepairer(),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "READY_FOR_REVIEW",
    );

    expect(result.run.task.status).toBe(
      "REVIEWING",
    );

    expect(
      result.run.validation?.passed,
    ).toBe(true);

    expect(
      result.run.task.repairAttempts,
    ).toBe(1);

    expect(result.run.repairs).toHaveLength(
      1,
    );

    expect(
      result.run.diagnosis,
    ).toEqual(
      createRepairableDiagnosis(),
    );
  });

  it("diagnoses again and performs a second repair when the first repair still fails", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const validator =
      new SequenceValidator([
        createValidation(false),
        createValidation(false),
        createValidation(true),
      ]);

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      validator,
      new FakeDiagnostician(
        createRepairableDiagnosis(),
      ),
      new FakeRepairer(),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "READY_FOR_REVIEW",
    );

    expect(result.run.task.status).toBe(
      "REVIEWING",
    );

    expect(
      result.run.validation?.passed,
    ).toBe(true);

    expect(
      result.run.task.repairAttempts,
    ).toBe(2);

    expect(result.run.repairs).toHaveLength(
      2,
    );
  });

  it("escalates to human input when the repair budget is exhausted", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const validator =
      new SequenceValidator([
        createValidation(false),
        createValidation(false),
        createValidation(false),
      ]);

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      validator,
      new FakeDiagnostician(
        createRepairableDiagnosis(),
      ),
      new FakeRepairer(),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "HUMAN_INPUT_REQUIRED",
    );

    expect(result.run.task.status).toBe(
      "NEEDS_HUMAN",
    );

    expect(
      result.run.task.repairAttempts,
    ).toBe(2);

    expect(result.run.repairs).toHaveLength(
      2,
    );

    expect(
      result.run.validation?.passed,
    ).toBe(false);
  });

  it("diagnoses a failed validation and stops when human input is required", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      new FakeValidator(false),
      new FakeDiagnostician(
        createHumanDiagnosis(),
      ),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "HUMAN_INPUT_REQUIRED",
    );

    expect(result.run.task.status).toBe(
      "NEEDS_HUMAN",
    );

    expect(
      result.run.diagnosis,
    ).toEqual(
      createHumanDiagnosis(),
    );

    expect(
      result.run.task.repairAttempts,
    ).toBe(0);

    expect(result.run.repairs).toEqual(
      [],
    );
  });

  it("routes a repair requiring human input to human escalation without consuming an attempt", async () => {
    const repositoryRoot =
      await createTemporaryRepository();

    const validator =
      new SequenceValidator([
        createValidation(false),
      ]);

    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      validator,
      new FakeDiagnostician(
        createRepairableDiagnosis(),
      ),
      new FakeRepairer(
        createRepair(true),
      ),
    );

    const planningResult =
      await factory.start(
        createTask(),
        repositoryRoot,
      );

    const result =
      await factory.resumeAfterPlanApproval(
        planningResult.run,
        repositoryRoot,
        "main",
      );

    expect(result.stopReason).toBe(
      "HUMAN_INPUT_REQUIRED",
    );

    expect(result.run.task.status).toBe(
      "NEEDS_HUMAN",
    );

    expect(
      result.run.task.repairAttempts,
    ).toBe(0);

    expect(result.run.repairs).toHaveLength(
      1,
    );

    expect(
      result.run.repairs[0]
        ?.requiresHumanInput,
    ).toBe(true);

    expect(
      result.run.validation?.passed,
    ).toBe(false);
  });

  it("rejects resume when plan approval is not pending", async () => {
    const factory = createFactory(
      createAnalysis(),
      createPlan(),
      new FakeValidator(true),
    );

    const run = {
      task: createTask(),
      repairs: [],
    };

    await expect(
      factory.resumeAfterPlanApproval(
        run,
        process.cwd(),
        "main",
      ),
    ).rejects.toThrow(
      "Cannot approve plan while task is in state TASK_CREATED",
    );
  });
});