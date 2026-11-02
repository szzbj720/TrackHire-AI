import type {
  FactoryRunTrace,
} from "../schemas/run-observation.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  AdaptiveFactory,
  AdaptiveFactoryResult,
} from "./adaptive-factory.js";
import type {
  AdaptiveRoutingDecision,
} from "./adaptive-routing.js";
import {
  resumeFactoryRunTrace,
  startFactoryRunTrace,
} from "./factory-run-trace.js";
import type {
  LightweightWorkflow,
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
import type {
  SequentialFactory,
  SequentialFactoryResult,
  SequentialFactoryRun,
} from "./sequential-factory.js";

export interface FactoryRunnerResult {
  decision: AdaptiveRoutingDecision;
  adaptiveResult?: AdaptiveFactoryResult;
  lightweightResult?: LightweightWorkflowResult;
  sequentialResult?: SequentialFactoryResult;
  trace: FactoryRunTrace;
}

export class FactoryRunner {
  constructor(
    private readonly sequentialFactory: SequentialFactory,
    private readonly lightweightWorkflow?: LightweightWorkflow,
    private readonly adaptiveFactory?: AdaptiveFactory,
  ) {}

  async run(
    task: EngineeringTask,
    repositoryRoot: string,
    timestamp = new Date().toISOString(),
    baseBranch = "main",
  ): Promise<FactoryRunnerResult> {
    if (!task.strategy) {
      throw new Error(
        "FactoryRunner requires a planned task with an execution strategy.",
      );
    }

    const session = startFactoryRunTrace(
      task,
      timestamp,
    );

    if (session.decision.route === "LIGHTWEIGHT") {
      if (!this.lightweightWorkflow) {
        throw new Error(
          "FactoryRunner requires a lightweight workflow for LIGHTWEIGHT routing.",
        );
      }

      const lightweightResult =
        await this.lightweightWorkflow.run(
          task,
          repositoryRoot,
          baseBranch,
        );
      const trace = session.recordLightweightResult(
        lightweightResult,
      );

      return {
        decision: session.decision,
        lightweightResult,
        trace,
      };
    }

    if (session.decision.route === "PARALLEL") {
      if (!this.adaptiveFactory) {
        throw new Error(
          "FactoryRunner requires an adaptive factory for PARALLEL routing.",
        );
      }

      const plannedResult: AdaptiveFactoryResult = {
        run: {
          task,
          repairs: [],
        },
        route: session.decision,
        stopReason: "PLAN_APPROVAL_REQUIRED",
      };
      const adaptiveResult =
        await this.adaptiveFactory.resumeAfterPlanApproval(
          plannedResult,
          repositoryRoot,
          baseBranch,
        );
      const trace = session.recordAdaptiveResult(
        adaptiveResult,
      );

      return {
        decision: session.decision,
        adaptiveResult,
        trace,
      };
    }

    const plannedRun: SequentialFactoryRun = {
      task,
      repairs: [],
    };
    const sequentialResult =
      await this.sequentialFactory.resumeAfterPlanApproval(
        plannedRun,
        repositoryRoot,
        baseBranch,
      );
    const trace = session.recordSequentialResult(
      sequentialResult,
    );

    return {
      decision: session.decision,
      sequentialResult,
      trace,
    };
  }

  async resumeAfterParallelApproval(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
    repositoryRoot: string,
    baseBranch = "main",
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel execution.",
      );
    }

    if (result.stopReason !== "PARALLEL_APPROVAL_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume parallel approval from stop reason ${result.stopReason}.`,
      );
    }

    return this.resumeAdaptive(
      result,
      trace,
      () =>
        this.adaptiveFactory!.resumeAfterParallelApproval(
          result,
          repositoryRoot,
          baseBranch,
        ),
    );
  }

  async resumeAfterParallelValidation(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel validation.",
      );
    }

    if (result.stopReason !== "PARALLEL_VALIDATION_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume parallel validation from stop reason ${result.stopReason}.`,
      );
    }

    return this.resumeAdaptive(
      result,
      trace,
      () =>
        this.adaptiveFactory!.resumeAfterParallelValidation(
          result,
        ),
    );
  }

  async resumeAfterParallelDiagnosis(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel diagnosis.",
      );
    }

    if (result.stopReason !== "PARALLEL_DIAGNOSIS_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume parallel diagnosis from stop reason ${result.stopReason}.`,
      );
    }

    return this.resumeAdaptive(
      result,
      trace,
      () =>
        this.adaptiveFactory!.resumeAfterParallelDiagnosis(
          result,
        ),
    );
  }

  async resumeAfterParallelRepair(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel repair.",
      );
    }

    if (result.stopReason !== "PARALLEL_REPAIR_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume parallel repair from stop reason ${result.stopReason}.`,
      );
    }

    return this.resumeAdaptive(
      result,
      trace,
      () =>
        this.adaptiveFactory!.resumeAfterParallelRepair(
          result,
        ),
    );
  }

  async resumeAfterParallelReview(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel review.",
      );
    }

    if (result.stopReason !== "PARALLEL_REVIEW_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume parallel review from stop reason ${result.stopReason}.`,
      );
    }

    return this.resumeAdaptive(
      result,
      trace,
      () =>
        this.adaptiveFactory!.resumeAfterParallelReview(
          result,
        ),
    );
  }

  private async resumeAdaptive(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
    resume: () => Promise<AdaptiveFactoryResult>,
  ): Promise<FactoryRunnerResult> {
    const session = resumeFactoryRunTrace(
      result.run.task,
      trace,
    );

    if (session.decision.route !== "PARALLEL") {
      throw new Error(
        "FactoryRunner can only resume parallel lifecycle steps for PARALLEL routing.",
      );
    }

    const adaptiveResult = await resume();
    const continuedTrace = session.recordAdaptiveResult(
      adaptiveResult,
    );

    return {
      decision: session.decision,
      adaptiveResult,
      trace: continuedTrace,
    };
  }
}
