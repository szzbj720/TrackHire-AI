import {
  ModelDecomposer,
} from "../agents/decomposer.js";
import {
  ModelWorkGraphGenerator,
} from "../agents/work-graph-generator.js";
import type {
  ModelProvider,
} from "../models/provider.js";
import type {
  Validator,
} from "../validation/validator.js";
import {
  AdaptiveFactory,
} from "./adaptive-factory.js";
import type {
  LightweightWorkflow,
} from "./lightweight-workflow.js";
import {
  ParallelPlanningWorkflow,
} from "./parallel-planning-workflow.js";
import {
  ParallelValidationWorkflow,
} from "./parallel-validation-workflow.js";
import type {
  ReviewWorkflow,
} from "./review-workflow.js";
import type {
  SequentialFactory,
} from "./sequential-factory.js";

export function createAdaptiveFactory(
  provider: ModelProvider,
  sequentialFactory: SequentialFactory,
  lightweightWorkflow: LightweightWorkflow,
  validator?: Validator,
  reviewWorkflow?: ReviewWorkflow,
): AdaptiveFactory {
  const decomposer = new ModelDecomposer(
    new ModelWorkGraphGenerator(provider),
  );

  const parallelPlanningWorkflow =
    new ParallelPlanningWorkflow(decomposer);

  const parallelValidationWorkflow =
    validator && reviewWorkflow
      ? new ParallelValidationWorkflow(
          validator,
          reviewWorkflow,
        )
      : undefined;

  return new AdaptiveFactory(
    sequentialFactory,
    lightweightWorkflow,
    parallelPlanningWorkflow,
    undefined,
    parallelValidationWorkflow,
  );
}
