import {
  recordAdaptiveRoutingDecision,
} from "../observability/adaptive-routing-observability.js";
import {
  RunTraceRecorder,
} from "../observability/run-trace-recorder.js";
import type {
  FactoryRunTrace,
} from "../schemas/run-observation.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  routeTask,
  type AdaptiveRoutingDecision,
} from "./adaptive-routing.js";

export interface ObservableRoutingResult {
  decision: AdaptiveRoutingDecision;
  trace: FactoryRunTrace;
}

export function routeTaskWithTrace(
  task: EngineeringTask,
  timestamp = new Date().toISOString(),
): ObservableRoutingResult {
  const recorder = new RunTraceRecorder(
    task.id,
    timestamp,
  );
  const decision = routeTask(task);

  recordAdaptiveRoutingDecision(
    recorder,
    task,
    decision,
    timestamp,
  );

  return {
    decision,
    trace: recorder.snapshot(),
  };
}
