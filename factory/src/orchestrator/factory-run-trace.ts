import {
  recordAdaptiveRoutingDecision,
} from "../observability/adaptive-routing-observability.js";
import {
  createHumanGateObservation,
} from "../observability/human-gate-observation.js";
import {
  createRunOutcomeObservation,
} from "../observability/run-outcome-observation.js";
import {
  RunTraceRecorder,
} from "../observability/run-trace-recorder.js";
import {
  recordSequentialRunEvidence,
} from "../observability/sequential-run-evidence.js";
import {
  recordSequentialFactoryResult,
} from "../observability/sequential-run-observability.js";
import type {
  FactoryRunTrace,
} from "../schemas/run-observation.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  AdaptiveFactoryResult,
} from "./adaptive-factory.js";
import {
  routeTask,
  type AdaptiveRoutingDecision,
} from "./adaptive-routing.js";
import type {
  LightweightWorkflowResult,
} from "./lightweight-workflow.js";
import type {
  SequentialFactoryResult,
} from "./sequential-factory.js";

export interface FactoryRunTraceSession {
  decision: AdaptiveRoutingDecision;
  recordAdaptiveResult(
    result: AdaptiveFactoryResult,
    timestamp?: string,
  ): FactoryRunTrace;
  recordLightweightResult(
    result: LightweightWorkflowResult,
    timestamp?: string,
  ): FactoryRunTrace;
  recordSequentialResult(
    result: SequentialFactoryResult,
    timestamp?: string,
  ): FactoryRunTrace;
  snapshot(): FactoryRunTrace;
}

export function startFactoryRunTrace(
  task: EngineeringTask,
  timestamp = new Date().toISOString(),
): FactoryRunTraceSession {
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
    recordAdaptiveResult(
      result: AdaptiveFactoryResult,
      resultTimestamp = new Date().toISOString(),
    ): FactoryRunTrace {
      if (result.run.task.id !== task.id) {
        throw new Error(
          "Cannot record an adaptive result for a different task.",
        );
      }

      recordSequentialRunEvidence(
        recorder,
        result.run,
        resultTimestamp,
      );

      const gateByStopReason = {
        PLAN_APPROVAL_REQUIRED: "PLAN_APPROVAL",
        PARALLEL_APPROVAL_REQUIRED: "PARALLEL_APPROVAL",
        FINAL_APPROVAL_REQUIRED: "FINAL_APPROVAL",
        HUMAN_INPUT_REQUIRED: "HUMAN_INPUT",
      } as const;
      const gate =
        result.stopReason in gateByStopReason
          ? gateByStopReason[
              result.stopReason as keyof typeof gateByStopReason
            ]
          : undefined;

      if (gate) {
        recorder.record(
          createHumanGateObservation(
            result.run.task,
            gate,
            `Adaptive factory stopped with ${result.stopReason}.`,
            resultTimestamp,
          ),
        );
      }

      recorder.record(
        createRunOutcomeObservation(
          result.run.task,
          result.stopReason,
          resultTimestamp,
        ),
      );

      if (
        result.stopReason === "COMPLETE" ||
        result.stopReason === "FAILED"
      ) {
        recorder.complete(resultTimestamp);
      }

      return recorder.snapshot();
    },
    recordLightweightResult(
      result: LightweightWorkflowResult,
      resultTimestamp = new Date().toISOString(),
    ): FactoryRunTrace {
      if (result.task.id !== task.id) {
        throw new Error(
          "Cannot record a lightweight result for a different task.",
        );
      }

      if (result.task.status === "AWAITING_FINAL_APPROVAL") {
        recorder.record(
          createHumanGateObservation(
            result.task,
            "FINAL_APPROVAL",
            "Lightweight execution completed and requires final approval.",
            resultTimestamp,
          ),
        );
        recorder.record(
          createRunOutcomeObservation(
            result.task,
            "FINAL_APPROVAL_REQUIRED",
            resultTimestamp,
          ),
        );
      } else if (result.task.status === "NEEDS_HUMAN") {
        recorder.record(
          createHumanGateObservation(
            result.task,
            "HUMAN_INPUT",
            "Lightweight execution requires human input.",
            resultTimestamp,
          ),
        );
        recorder.record(
          createRunOutcomeObservation(
            result.task,
            "HUMAN_INPUT_REQUIRED",
            resultTimestamp,
          ),
        );
      }

      return recorder.snapshot();
    },
    recordSequentialResult(
      result: SequentialFactoryResult,
      resultTimestamp = new Date().toISOString(),
    ): FactoryRunTrace {
      if (result.run.task.id !== task.id) {
        throw new Error(
          "Cannot record a sequential result for a different task.",
        );
      }

      recordSequentialRunEvidence(
        recorder,
        result.run,
        resultTimestamp,
      );
      recordSequentialFactoryResult(
        recorder,
        result,
        resultTimestamp,
      );

      return recorder.snapshot();
    },
    snapshot(): FactoryRunTrace {
      return recorder.snapshot();
    },
  };
}
