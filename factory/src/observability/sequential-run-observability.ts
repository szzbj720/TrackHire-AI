import type {
  SequentialFactoryResult,
  SequentialFactoryStopReason,
} from "../orchestrator/sequential-factory.js";
import { createHumanGateObservation } from "./human-gate-observation.js";
import { createRunOutcomeObservation } from "./run-outcome-observation.js";
import type { RunTraceRecorder } from "./run-trace-recorder.js";

const humanGateByStopReason = {
  PLAN_APPROVAL_REQUIRED: "PLAN_APPROVAL",
  FINAL_APPROVAL_REQUIRED: "FINAL_APPROVAL",
  HUMAN_INPUT_REQUIRED: "HUMAN_INPUT",
} as const;

type HumanGateStopReason = keyof typeof humanGateByStopReason;

function isHumanGateStopReason(
  stopReason: SequentialFactoryStopReason,
): stopReason is HumanGateStopReason {
  return stopReason in humanGateByStopReason;
}

export function recordSequentialFactoryResult(
  recorder: RunTraceRecorder,
  result: SequentialFactoryResult,
  timestamp = new Date().toISOString(),
): void {
  if (isHumanGateStopReason(result.stopReason)) {
    recorder.record(
      createHumanGateObservation(
        result.run.task,
        humanGateByStopReason[result.stopReason],
        `Sequential factory stopped with ${result.stopReason}.`,
        timestamp,
      ),
    );
  }

  recorder.record(
    createRunOutcomeObservation(
      result.run.task,
      result.stopReason,
      timestamp,
    ),
  );

  if (
    result.stopReason === "COMPLETE" ||
    result.stopReason === "FAILED"
  ) {
    recorder.complete(timestamp);
  }
}
