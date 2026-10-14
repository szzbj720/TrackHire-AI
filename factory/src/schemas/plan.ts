import { z } from "zod";

export const planStepSchema = z.object({
  order: z.number().int().positive(),
  description: z.string().min(1),
  files: z.array(z.string()),
  rationale: z.string().min(1),
});

export const implementationPlanSchema = z.object({
  summary: z.string().min(1),

  steps: z.array(planStepSchema).min(1),

  affectedFiles: z.array(z.string()),

  validationSteps: z.array(z.string()).min(1),

  risks: z.array(z.string()),

  assumptions: z.array(z.string()),

  requiresHumanInput: z.boolean(),
});

export type PlanStep = z.infer<typeof planStepSchema>;

export type ImplementationPlan = z.infer<
  typeof implementationPlanSchema
>;