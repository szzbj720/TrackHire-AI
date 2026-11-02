import type {
  SequentialFactoryRun,
} from "../orchestrator/sequential-factory.js";
import { createRepairAttemptObservation } from "./repair-attempt-observation.js";
import type { RunTraceRecorder } from "./run-trace-recorder.js";
import { createTrustDecisionObservation } from "./trust-decision-observation.js";
import { createVerificationObservation } from "./verification-observation.js";

export function recordSequentialRunEvidence(
  recorder: RunTraceRecorder,
  run: SequentialFactoryRun,
  timestamp = new Date().toISOString(),
): void {
  if (run.verification) {
    recorder.record(
      createVerificationObservation(
        run.task,
        run.verification,
        timestamp,
      ),
    );
  }

  for (const repair of run.repairs) {
    recorder.record(
      createRepairAttemptObservation(
        run.task,
        repair,
        timestamp,
      ),
    );
  }

  if (run.trustDecision) {
    recorder.record(
      createTrustDecisionObservation(
        run.task,
        run.trustDecision,
        timestamp,
      ),
    );
  }
}
