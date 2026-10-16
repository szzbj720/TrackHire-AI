import { z } from "zod";

export const explorationMetricsSchema =
  z.object({
    candidateCount:
      z.number().int().nonnegative(),

    candidateGenerationFailures:
      z.number().int().nonnegative(),

    implementationSuccesses:
      z.number().int().nonnegative(),

    implementationFailures:
      z.number().int().nonnegative(),

    validationPasses:
      z.number().int().nonnegative(),

    validationFailures:
      z.number().int().nonnegative(),

    validationErrors:
      z.number().int().nonnegative(),

    validationSkipped:
      z.number().int().nonnegative(),

    inputTokens:
      z.number().int().nonnegative(),

    outputTokens:
      z.number().int().nonnegative(),

    estimatedCostUsd:
      z.number().nonnegative(),

    selectedCandidateId:
      z.string().min(1).optional(),

    requiredHumanSelection:
      z.boolean(),

    usableCandidateCount:
      z.number().int().nonnegative(),
  });

export type ExplorationMetrics =
  z.infer<
    typeof explorationMetricsSchema
  >;