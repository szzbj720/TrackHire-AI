import { z } from "zod";

export const trustActionSchema =
  z.enum([
    "MERGE",
    "RETRY",
    "ESCALATE",
  ]);

export const trustEvidenceSchema =
  z.object({
    source: z.enum([
      "validation",
      "verification",
      "review",
      "risk",
    ]),
    signal: z.string().min(1),
    supportsTrust: z.boolean(),
  });

export const trustDecisionSchema =
  z.object({
    action: trustActionSchema,
    confidence:
      z.number().min(0).max(1),
    reasons:
      z.array(
        z.string().min(1),
      ).min(1),
    evidence:
      z.array(
        trustEvidenceSchema,
      ).min(1),
  });

export type TrustAction =
  z.infer<
    typeof trustActionSchema
  >;

export type TrustEvidence =
  z.infer<
    typeof trustEvidenceSchema
  >;

export type TrustDecision =
  z.infer<
    typeof trustDecisionSchema
  >;
