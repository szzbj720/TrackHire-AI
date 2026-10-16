import { z } from "zod";

export const evaluationStrategySchema = z.enum([
  "lightweight",
  "sequential",
  "parallel",
]);

export const factoryRunMetricsSchema = z.object({
  runId: z.string().min(1),
  taskId: z.string().min(1),

  strategy: evaluationStrategySchema,

  success: z.boolean(),
  firstPassSuccess: z.boolean(),

  validationFailures: z.number().int().nonnegative(),
  repairAttempts: z.number().int().nonnegative(),
  humanInterventions: z.number().int().nonnegative(),
  reviewFindings: z.number().int().nonnegative(),

  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),

  planningDurationMs: z.number().int().nonnegative(),
  implementationDurationMs: z.number().int().nonnegative(),
  validationDurationMs: z.number().int().nonnegative(),
  reviewDurationMs: z.number().int().nonnegative(),
  totalDurationMs: z.number().int().nonnegative(),

  startedAt: z.string().min(1),
  completedAt: z.string().min(1),
});

export type EvaluationStrategy = z.infer<
  typeof evaluationStrategySchema
>;

export type FactoryRunMetrics = z.infer<
  typeof factoryRunMetricsSchema
>;