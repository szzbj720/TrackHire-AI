import { z } from "zod";

export const explorationCandidateSchema =
  z.object({
    candidateId: z.string().min(1),
    targetId: z.string().min(1),
    model: z.string().min(1),

    summary: z.string().min(1),

    approach: z.string().min(1),

    affectedFiles: z.array(
      z.string().min(1),
    ),

    implementationSteps: z.array(
      z.string().min(1),
    ).min(1),

    validationSteps: z.array(
      z.string().min(1),
    ).min(1),

    advantages: z.array(
      z.string().min(1),
    ),

    risks: z.array(
      z.string().min(1),
    ),

    assumptions: z.array(
      z.string().min(1),
    ),

    requiresHumanInput: z.boolean(),

    confidence: z
      .number()
      .min(0)
      .max(1),
  });

export type ExplorationCandidate =
  z.infer<
    typeof explorationCandidateSchema
  >;