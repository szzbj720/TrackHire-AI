import { z } from "zod";

export const benchmarkAcceptanceCriterionSchema =
  z.object({
    id: z.string().min(1),
    description: z.string().min(1),
    verification: z.string().min(1),
  });

export const benchmarkCategorySchema = z.enum([
  "localized-change",
  "state-management",
  "persistence",
  "cross-layer",
  "regression",
  "ambiguous-requirement",
]);

export const benchmarkDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard",
]);

export const benchmarkFailureModeSchema = z.enum([
  "type-contract",
  "nullability",
  "state-consistency",
  "persistence-loss",
  "api-mismatch",
  "cross-file-inconsistency",
  "regression",
  "edge-case",
  "requirement-ambiguity",
  "repository-convention",
]);

export const benchmarkExpectedBehaviorSchema = z.enum([
  "implement",
  "clarify",
]);

export const benchmarkScenarioSchema =
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    task: z.string().min(1),

    category: benchmarkCategorySchema,

    difficulty: benchmarkDifficultySchema,

    failureModes: z
      .array(benchmarkFailureModeSchema)
      .min(1),

    expectedBehavior:
      benchmarkExpectedBehaviorSchema,

    repositoryFiles: z
      .array(z.string().min(1))
      .min(1),

    acceptanceCriteria: z
      .array(
        benchmarkAcceptanceCriterionSchema,
      )
      .min(1),

    validationCommands: z
      .array(z.string().min(1))
      .min(1),

    expectedComplexity: z.enum([
      "low",
      "medium",
      "high",
    ]),

    expectedRisk: z.enum([
      "low",
      "medium",
      "high",
    ]),

    requiresRealRepository: z.boolean(),
  });

export type BenchmarkAcceptanceCriterion =
  z.infer<
    typeof benchmarkAcceptanceCriterionSchema
  >;

export type BenchmarkCategory =
  z.infer<
    typeof benchmarkCategorySchema
  >;

export type BenchmarkDifficulty =
  z.infer<
    typeof benchmarkDifficultySchema
  >;

export type BenchmarkFailureMode =
  z.infer<
    typeof benchmarkFailureModeSchema
  >;

export type BenchmarkExpectedBehavior =
  z.infer<
    typeof benchmarkExpectedBehaviorSchema
  >;

export type BenchmarkScenario =
  z.infer<
    typeof benchmarkScenarioSchema
  >;