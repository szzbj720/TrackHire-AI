import { z } from "zod";

export const benchmarkAcceptanceCriterionSchema =
  z.object({
    id: z.string().min(1),
    description: z.string().min(1),
    verification: z.string().min(1),
  });

export const benchmarkScenarioSchema =
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),

    task: z.string().min(1),

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

export type BenchmarkScenario =
  z.infer<
    typeof benchmarkScenarioSchema
  >;