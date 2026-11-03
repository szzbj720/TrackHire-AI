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

  async resumeAfterLightweightFinalApproval(
    result: LightweightWorkflowResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (!this.lightweightWorkflow) {
      throw new Error(
        "FactoryRunner requires a lightweight workflow to resume final approval.",
      );
    }

    if (result.task.status !== "AWAITING_FINAL_APPROVAL") {
      throw new Error(
        `FactoryRunner cannot resume lightweight final approval from state ${result.task.status}.`,
      );
    }

    const session = resumeFactoryRunTrace(
      result.task,
      trace,
    );

    if (session.decision.route !== "LIGHTWEIGHT") {
      throw new Error(
        "FactoryRunner can only resume lightweight final approval for LIGHTWEIGHT routing.",
      );
    }

    const lightweightResult =
      this.lightweightWorkflow.approveFinal(result);
    const continuedTrace = session.recordLightweightResult(
      lightweightResult,
    );

    return {
      decision: session.decision,
      lightweightResult,
      trace: continuedTrace,
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

    const session = resumeFactoryRunTrace(
      result.run.task,
      trace,
    );

    if (session.decision.route !== "PARALLEL") {
      throw new Error(
        "FactoryRunner can only resume parallel approval for PARALLEL routing.",
      );
    }

    const adaptiveResult =
      await this.adaptiveFactory.resumeAfterParallelApproval(
        result,
        repositoryRoot,
        baseBranch,
      );
    const continuedTrace = session.recordAdaptiveResult(
      adaptiveResult,
    );

    return {
      decision: session.decision,
      adaptiveResult,
      trace: continuedTrace,
    };
  }

  async resumeAfterParallelValidation(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    return this.resumeParallelContinuation(
      result,
      trace,
      "PARALLEL_VALIDATION_REQUIRED",
      (adaptiveFactory) =>
        adaptiveFactory.resumeAfterParallelValidation(result),
    );
  }

  async resumeAfterParallelDiagnosis(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    return this.resumeParallelContinuation(
      result,
      trace,
      "PARALLEL_DIAGNOSIS_REQUIRED",
      (adaptiveFactory) =>
        adaptiveFactory.resumeAfterParallelDiagnosis(result),
    );
  }

  async resumeAfterParallelRepair(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    return this.resumeParallelContinuation(
      result,
      trace,
      "PARALLEL_REPAIR_REQUIRED",
      (adaptiveFactory) =>
        adaptiveFactory.resumeAfterParallelRepair(result),
    );
  }

  async resumeAfterParallelReview(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    return this.resumeParallelContinuation(
      result,
      trace,
      "PARALLEL_REVIEW_REQUIRED",
      (adaptiveFactory) =>
        adaptiveFactory.resumeAfterParallelReview(result),
    );
  }

  async resumeAfterParallelFinalApproval(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    return this.resumeParallelContinuation(
      result,
      trace,
      "FINAL_APPROVAL_REQUIRED",
      (adaptiveFactory) =>
        adaptiveFactory.resumeAfterFinalApproval(result),
    );
  }

  async resumeAfterTrustRetry(
    result: SequentialFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (result.stopReason !== "TRUST_RETRY_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume trust retry from stop reason ${result.stopReason}.`,
      );
    }

    const session = resumeFactoryRunTrace(
      result.run.task,
      trace,
    );

    if (session.decision.route !== "SEQUENTIAL") {
      throw new Error(
        "FactoryRunner can only resume trust retry for SEQUENTIAL routing.",
      );
    }

    const sequentialResult =
      await this.sequentialFactory.resumeAfterTrustRetry(
        result.run,
      );
    const continuedTrace = session.recordSequentialResult(
      sequentialResult,
    );

    return {
      decision: session.decision,
      sequentialResult,
      trace: continuedTrace,
    };
  }

  async resumeAfterSequentialFinalApproval(
    result: SequentialFactoryResult,
    trace: FactoryRunTrace,
  ): Promise<FactoryRunnerResult> {
    if (result.stopReason !== "FINAL_APPROVAL_REQUIRED") {
      throw new Error(
        `FactoryRunner cannot resume final approval from stop reason ${result.stopReason}.`,
      );
    }

    const session = resumeFactoryRunTrace(
      result.run.task,
      trace,
    );

    if (session.decision.route !== "SEQUENTIAL") {
      throw new Error(
        "FactoryRunner can only resume sequential final approval for SEQUENTIAL routing.",
      );
    }

    const sequentialResult =
      await this.sequentialFactory.resumeAfterFinalApproval(
        result.run,
      );
    const continuedTrace = session.recordSequentialResult(
      sequentialResult,
    );

    return {
      decision: session.decision,
      sequentialResult,
      trace: continuedTrace,
    };
  }

  private async resumeParallelContinuation(
    result: AdaptiveFactoryResult,
    trace: FactoryRunTrace,
    expectedStopReason: AdaptiveFactoryResult["stopReason"],
    resume: (
      adaptiveFactory: AdaptiveFactory,
    ) => Promise<AdaptiveFactoryResult>,
  ): Promise<FactoryRunnerResult> {
    if (!this.adaptiveFactory) {
      throw new Error(
        "FactoryRunner requires an adaptive factory to resume parallel execution.",
      );
    }

    if (result.stopReason !== expectedStopReason) {
      throw new Error(
        `FactoryRunner cannot resume ${expectedStopReason} from stop reason ${result.stopReason}.`,
      );
    }

    const session = resumeFactoryRunTrace(
      result.run.task,
      trace,
    );

    if (session.decision.route !== "PARALLEL") {
      throw new Error(
        "FactoryRunner can only resume parallel execution for PARALLEL routing.",
      );
    }

    const adaptiveResult = await resume(
      this.adaptiveFactory,
    );
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
