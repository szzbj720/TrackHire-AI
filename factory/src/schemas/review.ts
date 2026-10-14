import { z } from "zod";

export const reviewSeveritySchema =
  z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ]);

export const reviewFindingSchema =
  z.object({
    severity: reviewSeveritySchema,
    summary: z.string().min(1),
    evidence: z.array(
      z.string().min(1),
    ).min(1),
    files: z.array(
      z.string().min(1),
    ),
    recommendation:
      z.string().min(1),
  });

export const reviewResultSchema =
  z.object({
    approved: z.boolean(),
    summary: z.string().min(1),
    findings:
      z.array(reviewFindingSchema),
    requirementCoverage: z.array(
      z.object({
        requirement:
          z.string().min(1),
        satisfied: z.boolean(),
        evidence: z.array(
          z.string().min(1),
        ),
      }),
    ),
    requiresHumanInput: z.boolean(),
    confidence:
      z.number().min(0).max(1),
  });

export type ReviewSeverity =
  z.infer<
    typeof reviewSeveritySchema
  >;

export type ReviewFinding =
  z.infer<
    typeof reviewFindingSchema
  >;

export type ReviewResult =
  z.infer<
    typeof reviewResultSchema
  >;