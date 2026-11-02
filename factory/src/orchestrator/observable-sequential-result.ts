import {
  recordSequentialRunEvidence,
} from "../observability/sequential-run-evidence.js";
import {
  recordSequentialFactoryResult,
} from "../observability/sequential-run-observability.js";
import {
  RunTraceRecorder,
} from "../observability/run-trace-recorder.js";
import type {
  FactoryRunTrace,
} from "../schemas/run-observation.js";
import type {
  SequentialFactoryResult,
} from "./sequential-factory.js";

export function traceSequentialFactoryResult(
  result: SequentialFactoryResult,
  startedAt = result.run.task.createdAt,
  timestamp = new Date().toISOString(),
): FactoryRunTrace {
  const recorder = new RunTraceRecorder(
    result.run.task.id,
    startedAt,
  );

  recordSequentialRunEvidence(
    recorder,
    result.run,
    timestamp,
  );
  recordSequentialFactoryResult(
    recorder,
    result,
    timestamp,
  );

  return recorder.snapshot();
}
