import type {
  FactoryRunTrace,
  RunObservation,
} from "../schemas/run-observation.js";

export class RunTraceRecorder {
  private readonly trace: FactoryRunTrace;

  constructor(
    taskId: string,
    startedAt = new Date().toISOString(),
  ) {
    this.trace = {
      taskId,
      startedAt,
      observations: [],
    };
  }

  record(
    observation: Omit<RunObservation, "taskId">,
  ): void {
    this.trace.observations.push({
      ...observation,
      taskId: this.trace.taskId,
    });
  }

  complete(
    completedAt = new Date().toISOString(),
  ): void {
    this.trace.completedAt = completedAt;
  }

  snapshot(): FactoryRunTrace {
    return {
      ...this.trace,
      observations: this.trace.observations.map(
        (observation) => ({ ...observation }),
      ),
    };
  }
}
