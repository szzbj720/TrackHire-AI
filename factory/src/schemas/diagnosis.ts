import { z } from "zod";

export const failureCategorySchema = z.enum([
  "STATIC_ANALYSIS",
  "TEST_REGRESSION",
  "INCORRECT_IMPLEMENTATION",
  "INTEGRATION_MISMATCH",
  "ENVIRONMENT",
  "REQUIREMENT_AMBIGUITY",
  "UNKNOWN",
]);

export const failureDiagnosisSchema = z.object({
  category: failureCategorySchema,
  summary: z.string().min(1),
  evidence: z.array(z.string()).min(1),
  suspectedFiles: z.array(z.string()),
  recommendedAction: z.string().min(1),
  repairable: z.boolean(),
  confidence: z.number().min(0).max(1),
  requiresHumanInput: z.boolean(),
});

export type FailureCategory = z.infer<
  typeof failureCategorySchema
>;

export type FailureDiagnosis = z.infer<
  typeof failureDiagnosisSchema
>;