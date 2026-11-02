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
}
