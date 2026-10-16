import { z } from "zod";

export const benchmarkStrategySchema =
  z.enum([
    "lightweight",
    "sequential",
    "parallel",
    "exploration",
  ]);

export const benchmarkCriterionScoreSchema =
  z.object({
    criterionId: z.string().min(1),
    description: z.string().min(1),
    passed: z.boolean(),
    evidence: z
      .array(z.string().min(1)),
  });

export const benchmarkAcceptanceResultSchema =
  z.object({
    passed: z.boolean(),

    passedCriteria:
      z.number().int().nonnegative(),

    failedCriteria:
      z.number().int().nonnegative(),

    totalCriteria:
      z.number().int().nonnegative(),

    scores:
      z.array(
        benchmarkCriterionScoreSchema,
      ),

    missingCriterionIds:
      z.array(z.string().min(1)),

    unexpectedCriterionIds:
      z.array(z.string().min(1)),
  });

export const benchmarkValidationResultSchema =
  z.object({
    passed: z.boolean(),

    commandsRun:
      z.array(z.string().min(1)),

    failedCommands:
      z.array(z.string().min(1)),
  });

export const benchmarkUsageSchema =
  z.object({
    inputTokens:
      z.number().int().nonnegative(),

    outputTokens:
      z.number().int().nonnegative(),

    estimatedCostUsd:
      z.number().nonnegative(),
  });

export const benchmarkResultSchema =
  z.object({
    runId: z.string().min(1),

    scenarioId: z.string().min(1),

    strategy:
      benchmarkStrategySchema,

    baselineRevision:
      z.string().min(1),

    workspacePath:
      z.string().min(1),

    workspaceBranch:
      z.string().min(1),

    validation:
      benchmarkValidationResultSchema,

    acceptance:
      benchmarkAcceptanceResultSchema,

    usage:
      benchmarkUsageSchema,

    durationMs:
      z.number().int().nonnegative(),

    humanInterventions:
      z.number().int().nonnegative(),

    success:
      z.boolean(),

    startedAt:
      z.string().min(1),

    completedAt:
      z.string().min(1),
  });

export type BenchmarkStrategy =
  z.infer<
    typeof benchmarkStrategySchema
  >;

export type BenchmarkCriterionScore =
  z.infer<
    typeof benchmarkCriterionScoreSchema
  >;

export type BenchmarkAcceptanceResult =
  z.infer<
    typeof benchmarkAcceptanceResultSchema
  >;

export type BenchmarkValidationResult =
  z.infer<
    typeof benchmarkValidationResultSchema
  >;

export type BenchmarkUsage =
  z.infer<
    typeof benchmarkUsageSchema
  >;

export type BenchmarkResult =
  z.infer<
    typeof benchmarkResultSchema
  >;