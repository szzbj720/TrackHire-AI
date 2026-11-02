import type {
  FactoryRunTrace,
} from "../schemas/run-observation.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  startFactoryRunTrace,
} from "./factory-run-trace.js";
import type {
  AdaptiveRoutingDecision,
} from "./adaptive-routing.js";
import type {
  SequentialFactory,
  SequentialFactoryResult,
} from "./sequential-factory.js";

export interface FactoryRunnerResult {
  decision: AdaptiveRoutingDecision;
  sequentialResult?: SequentialFactoryResult;
  trace: FactoryRunTrace;
}

export class FactoryRunner {
  constructor(
    private readonly sequentialFactory: SequentialFactory,
  ) {}

  async run(
    task: EngineeringTask,
    repositoryRoot: string,
    timestamp = new Date().toISOString(),
  ): Promise<FactoryRunnerResult> {
    const session = startFactoryRunTrace(
      task,
      timestamp,
    );

    if (session.decision.route !== "SEQUENTIAL") {
      return {
        decision: session.decision,
        trace: session.snapshot(),
      };
    }

    const sequentialResult =
      await this.sequentialFactory.start(
        task,
        repositoryRoot,
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
