import type { AdaptiveRoutingDecision } from "../orchestrator/adaptive-routing.js";
import type { EngineeringTask } from "../schemas/task.js";
import { createAutonomyObservation } from "./autonomy-observation.js";
import { createRoutingObservation } from "./routing-observation.js";
import type { RunTraceRecorder } from "./run-trace-recorder.js";

export function recordAdaptiveRoutingDecision(
  recorder: RunTraceRecorder,
  task: EngineeringTask,
  decision: AdaptiveRoutingDecision,
  timestamp = new Date().toISOString(),
): void {
  recorder.record(
    createRoutingObservation(
      task,
      decision,
      timestamp,
    ),
  );

  if (decision.autonomy) {
    recorder.record(
      createAutonomyObservation(
        task,
        decision.autonomy,
        timestamp,
      ),
    );
  }
}
