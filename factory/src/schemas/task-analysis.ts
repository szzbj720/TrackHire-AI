import { z } from "zod";

export const taskAnalysisSchema = z.object({
  complexity: z.enum(["low", "medium", "high"]),
  risk: z.enum(["low", "medium", "high"]),

  affectedAreas: z.array(z.string()),
  relevantFiles: z.array(z.string()),
  ambiguities: z.array(z.string()),
  assumptions: z.array(z.string()),

  confidence: z.number().min(0).max(1),

  requiresHumanInput: z.boolean(),

  reasoning: z.string().min(1),
});